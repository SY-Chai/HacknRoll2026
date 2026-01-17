import express from 'express';
import { searchPhotographs } from '../scraper/nasScraper.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q, start, end } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" (keywords) is required.' });
    }

    // Default dates if not provided (optional)
    const startDate = start; 
    const endDate = end;

    console.log(`Received search request: q=${q}, start=${startDate}, end=${endDate}`);

    const results = await searchPhotographs(q, startDate, endDate);
    
    res.json({
      success: true,
      count: results.length,
      data: results
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
