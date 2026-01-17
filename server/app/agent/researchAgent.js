import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// In-memory lock to avoid concurrent requests for same text
const pendingAudio = new Map();

// Exa Search API
async function searchExa(query) {
  try {
    console.log(`Searching Exa for: ${query}`);
    const response = await axios.post('https://api.exa.ai/search',
      {
        query: query,
        numResults: 3,
        contents: {
          text: true
        }
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY
        }
      }
    );

    // Check if results exist
    const results = response.data.results || [];
    const snippets = results.map(r => `Title: ${r.title}\nText: ${r.text.substring(0, 300)}...`);

    console.log(`Found ${snippets.length} snippets via Exa.`);
    return snippets.join('\n\n');

  } catch (error) {
    console.error('Exa Search failed:', error.message);
    if (error.response) {
      console.error('Exa API Error Data:', error.response.data);
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

    console.log("Search Context passed to Gemini:", searchContext.substring(0, 200) + "...");

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
    console.error('Gemini enhancement CRITICAL failure:', error);
    if (error.response) {
      console.error('Gemini Response Error:', error.response);
    }
    return null;
  }
}

// Helper to create WAV header for raw PCM
function createWavHeader(dataLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write('RIFF', 0);
  // File size usually dataLength + 36
  header.writeUInt32LE(dataLength + 36, 4);
  // WAVE identifier
  header.write('WAVE', 8);
  // fmt chunk identifier
  header.write('fmt ', 12);
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
  header.write('data', 36);
  // Data chunk length
  header.writeUInt32LE(dataLength, 40);

  return header;
}

// Generate Audio using Gemini TTS
export async function generateAudio(text, itemId) {
  // Use a known valid model supporting Audio generation
  const ttsModel = "gemini-2.5-flash-preview-tts";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  // Use hashing for caching
  const textHash = crypto.createHash('md5').update(text).digest('hex');
  const filename = `audio_cache_${textHash}.wav`;
  const tmpDir = path.join(process.cwd(), 'tmp');
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
    const payload = {
      contents: [{
        parts: [{ text: text }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Fenrir" // Formal voice
            }
          }
        }
      }
    };

    try {
      console.log(`Generating audio for: "${text.substring(0, 30)}..." using ${ttsModel}...`);
      let response;
      try {
        // Increase timeout to 60s as audio generation can be slow
        response = await axios.post(url, payload, { timeout: 60000 });
      } catch (err) {
        if (err.response && err.response.status === 429) {
          console.warn("Quota reached (429). Retrying in 12s...");
          await new Promise(resolve => setTimeout(resolve, 12000));
          response = await axios.post(url, payload, { timeout: 60000 });
        } else {
          throw err;
        }
      }

      if (response.data.candidates && response.data.candidates[0].content.parts[0].inlineData) {
        const inlineData = response.data.candidates[0].content.parts[0].inlineData;
        const audioData = inlineData.data;
        const rawBuffer = Buffer.from(audioData, 'base64');

        let sampleRate = 24000;
        if (inlineData.mimeType && inlineData.mimeType.includes('rate=')) {
          try {
            const match = inlineData.mimeType.match(/rate=(\d+)/);
            if (match && match[1]) sampleRate = parseInt(match[1]);
          } catch (e) { }
        }

        const wavHeader = createWavHeader(rawBuffer.length, sampleRate);
        const finalBuffer = Buffer.concat([wavHeader, rawBuffer]);

        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(filePath, finalBuffer);
        console.log(`Audio saved to cache: ${filePath}`);
        return filename;
      } else {
        throw new Error("No audio data in response");
      }
    } catch (error) {
      console.error("Audio generation failed:", error.message);
      if (error.response) {
        console.error("Error Details:", JSON.stringify(error.response.data));
      }
      return null;
    }
  })();

  pendingAudio.set(textHash, generationTask);
  try {
    return await generationTask;
  } finally {
    // Basic cleanup: remove from pending map once done (success or fail)
    // We only keep it for a short window to prevent immediate thundering herd
    setTimeout(() => pendingAudio.delete(textHash), 2000);
  }
}
