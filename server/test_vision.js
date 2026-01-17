import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

async function classifyImage(url, label) {
  try {
    console.log(`\nAnalyzing ${label} with GPT-4o-mini...`);

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Is this image a real photograph of a physical environment or person? Reply strictly with 'PHOTOGRAPH' or 'OTHER'." },
            { type: "image_url", image_url: { url: url } }
          ]
        }
      ],
      max_tokens: 10
    };

    const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      }
    });

    const answer = response.data.choices[0].message.content;
    console.log(`Result for ${label}: ${answer}`);

  } catch (error) {
    console.error(`Error analyzing ${label}:`, error.message);
    if (error.response) console.error(error.response.data);
  }
}

async function testVision() {
  console.log("Testing Vision with OpenAI...");
  // 1. A Simple Graphic (Placeholder) -> Expect OTHER
  const mapUrl = "https://placehold.co/600x400/png"; 
  
  // 2. A Real Photo (Unsplash) -> Expect PHOTOGRAPH
  // Using a specific ID to ensure it's a photo
  const photoUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600"; // Landscape photo

  await classifyImage(mapUrl, "Graphic Image");
  await classifyImage(photoUrl, "Real Photo");
}

testVision();
