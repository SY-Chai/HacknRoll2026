import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testTTS() {
  console.log(`Testing TTS with model: ${MODEL}`);
  
  const payload = {
    contents: [{
      parts: [{ text: "This is a test of the Gemini Text to Speech capabilities." }]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Puck"
          }
        }
      }
    }
  };

  try {
    const response = await axios.post(URL, payload);
    console.log("Response Status:", response.status);
    
    // Inspect the structure
    console.log("Response Data Keys:", Object.keys(response.data));
    if (response.data.candidates) {
      console.log("Candidates found:", response.data.candidates.length);
      const part = response.data.candidates[0].content.parts[0];
      console.log("Part keys:", Object.keys(part));
      
      if (part.inline_data) { // Check for inline_data (base64 audio)
        console.log("Audio data found!");
        const audioBuffer = Buffer.from(part.inline_data.data, 'base64');
        fs.writeFileSync('server/tmp/test_audio.wav', audioBuffer); // Assuming wav or mp3
        console.log("Saved to server/tmp/test_audio.wav (guessing format)");
      } else if (part.inlineData) {
         console.log("Audio data found (camelCase)!");
         const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
         fs.writeFileSync('server/tmp/test_audio.wav', audioBuffer);
      } else {
        console.log("No inline data found. Content:", part);
      }
    } else {
      console.log("No candidates:", JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTTS();
