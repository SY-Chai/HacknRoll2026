import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve to root .env (agent is in server/app/agent/researchAgent.js)
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// In-memory lock to avoid concurrent requests for same text
const pendingAudio = new Map();
// Exa Search API
async function searchExa(query) {
  try {
    console.log(`Searching Exa for: ${query}`);
    const response = await axios.post(
      "https://api.exa.ai/search",
      {
        query: query,
        numResults: 3,
        contents: {
          text: true,
        },
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": process.env.EXA_API_KEY,
        },
      },
    );

    // Check if results exist
    const results = response.data.results || [];
    const snippets = results.map(
      (r) => `Title: ${r.title}\nText: ${r.text.substring(0, 300)}...`,
    );

    console.log(`Found ${snippets.length} snippets via Exa.`);
    return snippets.join("\n\n");
  } catch (error) {
    console.error("Exa Search failed:", error.message);
    if (error.response) {
      console.error("Exa API Error Data:", error.response.data);
    }
    return "";
  }
}

export async function enhanceDescription(title, date) {
  console.log(`Enhancing description for: ${title} (${date})`);

  try {
    // 1. Search for context with retries
    let searchContext = "";

    // Attempt 1: Specific query
    let searchQuery = `${title} ${date} singapore history`;
    searchContext = await searchExa(searchQuery);

    // Attempt 2: Broader query if first failed
    if (!searchContext) {
      console.log("Attempt 1 failed, trying broader query...");
      searchQuery = `${title} singapore`;
      searchContext = await searchExa(searchQuery);
    }

    if (!searchContext) {
      return "Historical context could not be retrieved from search.";
    }

    console.log(
      "Search Context passed to Gemini:",
      searchContext.substring(0, 200) + "...",
    );

    // 2. Generate description with Gemini
    const prompt = `
      You are a historical researcher.
      Use the following search results to write a concise, engaging 2-sentence description for a photograph titled "${title}" taken around ${date}.

      The search results might not contain this exact photo, but they should contain relevant historical context about the people, institution, or event.
      Synthesize the best possible description based on these results. Explain the significance of the subject or the era.

      Search Results:
      ${searchContext}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini enhancement CRITICAL failure:", error);
    if (error.response) {
      console.error("Gemini Response Error:", error.response);
    }
    return null;
  }
}

// Helper to create WAV header for raw PCM
function createWavHeader(
  dataLength,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
) {
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // File size usually dataLength + 36
  header.writeUInt32LE(dataLength + 36, 4);
  // WAVE identifier
  header.write("WAVE", 8);
  // fmt chunk identifier
  header.write("fmt ", 12);
  // Chunk length (16 for PCM)
  header.writeUInt32LE(16, 16);
  // Audio format (1 for PCM)
  header.writeUInt16LE(1, 20);
  // Number of channels
  header.writeUInt16LE(numChannels, 22);
  // Sample rate
  header.writeUInt32LE(sampleRate, 24);
  // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  // Block align (NumChannels * BitsPerSample/8)
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  // Bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // Data chunk length
  header.writeUInt32LE(dataLength, 40);

  return header;
}

// Generate Audio using OpenAI TTS (ChatGPT model)
export async function generateAudio(text, itemId) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error("Missing OPENAI_API_KEY for TTS");
    return null;
  }

  // Use hashing for caching
  const textHash = crypto.createHash("md5").update(text).digest("hex");
  const filename = `audio_cache_${textHash}.mp3`;
  const tmpDir = path.join(process.cwd(), "tmp");
  const filePath = path.join(tmpDir, filename);

  // Check if cached file exists
  if (fs.existsSync(filePath)) {
    console.log(`Using cached audio: ${filename}`);
    return filename;
  }

  // Prevent concurrent duplicate requests
  if (pendingAudio.has(textHash)) {
    console.log(`Waiting for existing generation for hash: ${textHash}`);
    return pendingAudio.get(textHash);
  }

  const generationTask = (async () => {
    try {
      console.log(
        `Generating audio for: "${text.substring(0, 30)}..." using OpenAI TTS...`,
      );

      const response = await axios.post(
        "https://api.openai.com/v1/audio/speech",
        {
          model: "tts-1",
          input: text,
          voice: "alloy", // Can be changed to onyx, nova, etc.
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
          timeout: 30000,
        },
      );

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      fs.writeFileSync(filePath, Buffer.from(response.data));
      console.log(`Audio saved to cache: ${filePath}`);
      return filename;
    } catch (error) {
      console.error("OpenAI Audio generation failed:", error.message);
      if (error.response && error.response.data) {
        try {
          const errorMsg = Buffer.from(error.response.data).toString();
          console.error("Error Details:", errorMsg);
        } catch (e) { }
      }
      return null;
    }
  })();

  pendingAudio.set(textHash, generationTask);
  try {
    return await generationTask;
  } finally {
    // Basic cleanup: remove from pending map once done (success or fail)
    setTimeout(() => pendingAudio.delete(textHash), 2000);
  }
}

// Colorize Image using Gemini Nano Banana (Flash Image)
export async function colorizeImage(imageUrl) {
  const colorModel = "gemini-2.5-flash-image"; // Official Nano Banana model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${colorModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const imageHash = crypto.createHash("md5").update(imageUrl).digest("hex");
  const filename = `color_cache_${imageHash}.png`;
  const tmpDir = path.join(process.cwd(), "tmp", "color_cache");
  const filePath = path.join(tmpDir, filename);

  if (fs.existsSync(filePath)) {
    console.log(`Using cached colorized image: ${filename}`);
    return filename;
  }

  try {
    console.log(`Downloading image for colorization: ${imageUrl}`);
    const imgResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const base64Image = Buffer.from(imgResponse.data).toString("base64");

    console.log(`Colorizing image via Nano Banana (${colorModel})...`);
    const payload = {
      contents: [
        {
          parts: [
            {
              text: "Restore and colorize this black and white photo. Upscale the image to 1080p and 4K resolution using professional restoration techniques. Make the colors realistic and vibrant. Output ONLY the colorized image.",
            },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        temperature: 0.4,
      },
    };

    const response = await axios.post(url, payload, { timeout: 60000 });

    if (
      response.data.candidates &&
      response.data.candidates[0].content.parts[0].inlineData
    ) {
      const inlineData =
        response.data.candidates[0].content.parts[0].inlineData;
      const colorImageData = inlineData.data;
      const buffer = Buffer.from(colorImageData, "base64");

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);
      console.log(`Colorized image saved to cache: ${filePath}`);
      return filename;
    } else {
      throw new Error("No image data in response");
    }
  } catch (error) {
    console.error("Colorization failed:", error.message);
    return null;
  }
}
