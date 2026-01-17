import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Custom lightweight Search scraper (Switching to DuckDuckGo HTML for easier scraping)
async function searchGoogle(query) {
  try {
    console.log(`Searching for: ${query}`);
    // Using DuckDuckGo HTML version which is friendlier to bots/scraping than Google
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const snippets = [];

    // DuckDuckGo HTML selectors are usually .result__body or .result__snippet
    // Title: .result__a
    // Snippet: .result__snippet
    
    $('.result').each((i, el) => {
      if (snippets.length >= 3) return; 

      const title = $(el).find('.result__a').text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      
      if (title && snippet) {
         snippets.push(`${title}: ${snippet}`);
      }
    });

    console.log(`Found ${snippets.length} snippets.`);
    return snippets.join('\n\n');

  } catch (error) {
    console.error('Search failed:', error.message);
    return "";
  }
}

export async function enhanceDescription(title, date) {
  console.log(`Enhancing description for: ${title} (${date})`);

  try {
    // 1. Search for context
    const searchQuery = `${title} ${date} singapore history context`;
    const searchContext = await searchGoogle(searchQuery);

    if (!searchContext) {
      return "Historical context could not be retrieved.";
    }

    // 2. Generate description with Gemini
    const prompt = `
      You are a historical researcher. 
      Based STRICTLY on the following search results, write a concise, engaging 2-sentence description for a photograph titled "${title}" taken around ${date}.
      
      Focus on the historical significance or event happening at that time. Do not mention that you searched the internet.
      
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
