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

    // 2. Enhance with AI descriptions
    // 2. Enhance with AI descriptions
    console.log('Enhancing results with AI...');
    const enhancedResults = await Promise.all(results.map(async (item, index) => {
      const description = await enhanceDescription(item.title, item.date);
      // Lazy Load: Do NOT generate audio here.

      return {
        ...item,
        description,
        audio: null // Client will fetch this later
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

// New Endpoint: Lazy Generate Audio
router.post('/generate-audio', async (req, res) => {
  try {
    const { text, id } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    console.log(`Generating audio on-demand for ID: ${id}`);
    // Use a unique ID based on timestamp if valid ID not provided
    const safeId = id || Date.now().toString();

    const audioFile = await generateAudio(text, safeId);

    if (!audioFile) {
      return res.status(500).json({ error: "Audio generation failed" });
    }

    res.json({ success: true, audioUrl: `/audio/${audioFile}` });

  } catch (error) {
    console.error("Generate Audio API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;