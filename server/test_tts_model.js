import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const API_KEY = process.env.GEMINI_API_KEY;
// Switching to 2.0 Flash Exp which supports Audio Output
const MODEL = "gemini-2.0-flash-exp"; 
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

async function testTTS() {
  console.log(`Testing TTS with model: ${MODEL}`);
  
  const payload = {
    contents: [{
      parts: [{ text: "Read this text aloud: This is a test of the 2.0 Flash Experimental model." }]
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
      console.log("SUCCESS: Audio data received.");
      console.log("MimeType:", response.data.candidates[0].content.parts[0].inlineData.mimeType);
    } else {
      console.log("Failure: No audio data found in response.");
      console.log(JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTTS();
