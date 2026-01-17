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
      parts: [{ text: "This is a formal test of the Gemini Text to Speech capabilities using the Fenrir voice." }]
    }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Fenrir"
          }
        }
      }
    }
  };

  try {
    const response = await axios.post(URL, payload);
    
    if (response.data.candidates && response.data.candidates[0].content.parts[0].inlineData) {
      const inlineData = response.data.candidates[0].content.parts[0].inlineData;
      console.log(`MimeType from API: ${inlineData.mimeType}`);
      
      const audioData = inlineData.data;
      const buffer = Buffer.from(audioData, 'base64');
      
      // Check magic number
      const header = buffer.subarray(0, 4).toString('hex');
      console.log(`File Header (Hex): ${header}`);
      
      // Save as mp3
      const filename = path.join(process.cwd(), 'tmp', 'test_fenrir.mp3');
      fs.writeFileSync(filename, buffer);
      console.log(`Saved to ${filename}`);
      
    } else {
      console.log("No audio data found.");
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTTS();
