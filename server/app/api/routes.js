import express from 'express';
import { searchPhotographs } from '../scraper/nasScraper.js';
import { enhanceDescription, generateAudio } from '../agent/researchAgent.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q, start, end, limit } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" (keywords) is required.' });
    }

    // Default dates if not provided (optional)
    const startDate = start; 
    const endDate = end;
    const resultLimit = limit ? parseInt(limit) : 5; // Default to 5 as requested

    console.log(`Received search request: q=${q}, start=${startDate}, end=${endDate}, limit=${resultLimit}`);

    // 1. Scrape basic results
    const results = await searchPhotographs(q, startDate, endDate, resultLimit);

    // 2. Enhance with AI descriptions and Audio
    console.log('Enhancing results with AI (Text + Audio)...');
    const enhancedResults = await Promise.all(results.map(async (item, index) => {
      const description = await enhanceDescription(item.title, item.date);
      
      // Generate audio
      // Use a safe ID for filename (timestamp + index)
      const audioFilename = await generateAudio(description, `item_${Date.now()}_${index}`);
      
      return { 
        ...item, 
        description,
        audio: audioFilename ? `/audio/${audioFilename}` : null
      };
    }));
    
    res.json({
      success: true,
      count: enhancedResults.length,
      data: enhancedResults
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch data from NAS Archives',
      details: error.message 
    });
  }
});

export default router;
