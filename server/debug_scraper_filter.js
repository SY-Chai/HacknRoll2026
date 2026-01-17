import { searchPhotographs } from './app/scraper/nasScraper.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testFilter() {
  console.log("Testing Visual Filter with query that returns maps...");
  // "Map" usually returns non-photos.
  try {
    const results = await searchPhotographs("Map of Singapore", "1950", "1960", 5);
    console.log("\nFinal Results:");
    results.forEach((r, i) => console.log(`${i+1}. ${r.title} (${r.date}) - ${r.imageUrl}`));
  } catch (e) {
    console.error(e);
  }
}

testFilter();
