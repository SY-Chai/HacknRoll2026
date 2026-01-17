import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
    return `Photo of ${title}, taken in ${date}. (AI description unavailable: ${error.message})`;
  }
}
