import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No API Key found in .env");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

  try {
    console.log(`Fetching models from: ${url.replace(key, 'HIDDEN_KEY')}`);
    const response = await axios.get(url);

    if (response.data && response.data.models) {
      console.log("Available Models:");
      response.data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name} (Supported)`);
        } else {
          console.log(`- ${m.name} (Not for generateContent)`);
        }
      });
    } else {
      console.log("No models found in response:", response.data);
    }

  } catch (error) {
    console.error("Error listing models:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

listModels();
