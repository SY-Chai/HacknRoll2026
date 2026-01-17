import express from 'express';
import axios from 'axios';
import multer from 'multer';
import { searchPhotographs } from '../scraper/nasScraper.js';
import { enhanceDescription, generateAudio, colorizeImage } from '../agent/researchAgent.js';
import { supabase } from '../utils/supabase.js';
import { uploadToR2 } from '../utils/r2.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Image Proxy
router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send("Missing url parameter");
    }

    // Add User-Agent to avoid being blocked by NAS/External servers
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.nas.gov.sg/'
      },
      timeout: 10000
    });

    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy Image Error:", error.message);
    res.status(500).send("Failed to fetch image");
  }
});

// Original Search Endpoint (Using capitalized 'Record' table)
router.get('/search', async (req, res) => {
  try {
    const { q, start, end, limit } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" (keywords) is required.' });
    }

    const resultLimit = limit ? parseInt(limit) : 5;

    console.log(`Received search request: q=${q}, start=${start}, end=${end}, limit=${resultLimit}`);

    const results = await searchPhotographs(q, start, end, resultLimit);

    console.log('Enhancing results with AI...');
    const enhancedResults = await Promise.all(results.map(async (item) => {
      const description = await enhanceDescription(item.title, item.date);
      return {
        ...item,
        description,
        audio: null
      };
    }));

    // Persist to 'Record' table (Confirmed as Capitalized with correct columns)
    const recordsToInsert = enhancedResults.map((item) => ({
      title: item.title,
      description: item.description,
      image_url: item.imageUrl,
      // audio_url: item.audio
    }));

    const { error: recordsError } = await supabase
      .from('Record')
      .insert(recordsToInsert);

    if (recordsError) console.error('Failed to save records:', recordsError);

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

// New Endpoint: Create Memory (Using JSON storage in 'Journal.query' to bypass missing columns)
router.post('/memories', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description } = req.body;
    const files = req.files;

    if (!process.env.R2_IMAGE_BUCKET || !process.env.R2_AUDIO_BUCKET) {
      console.error('R2 Bucket environment variables are missing');
      return res.status(500).json({ success: false, error: 'Server configuration error: R2 Buckets not defined' });
    }

    let imageUrl = null;
    let audioUrl = null;

    if (files.image) {
      const file = files.image[0];
      const filename = `user-img-${Date.now()}-${file.originalname}`;
      imageUrl = await uploadToR2(file.buffer, filename, file.mimetype, process.env.R2_IMAGE_BUCKET);
    }

    if (files.audio) {
      const file = files.audio[0];
      const filename = `user-audio-${Date.now()}-${file.originalname}`;
      audioUrl = await uploadToR2(file.buffer, filename, file.mimetype, process.env.R2_AUDIO_BUCKET);
    }

    // Store ALL metadata as a JSON string in the 'query' column which exists
    const memoryData = {
      title: title || 'Untitled Memory',
      description,
      image_url: imageUrl,
      audio_url: audioUrl,
      user_created: true,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('Journal')
      .insert([{
        query: JSON.stringify(memoryData),
        user_created: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Memories upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all Journal/Memories (Parse JSON from 'query' column)
router.get('/memories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Journal')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Parse the JSON data from query column
    const parsedData = data.map(item => {
      try {
        const metadata = JSON.parse(item.query);
        return {
          id: item.id,
          created_at: item.created_at,
          ...metadata
        };
      } catch (e) {
        // Fallback if not JSON
        return {
          id: item.id,
          title: 'Imported Memory',
          description: item.query,
          created_at: item.created_at
        };
      }
    });

    res.json({ success: true, data: parsedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// New Endpoint: Lazy Generate Audio
router.post('/generate-audio', async (req, res) => {
  try {
    const { text, id } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    console.log(`Generating audio on-demand for ID: ${id}`);
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

// New Endpoint: Colorize Image via Nano Banana
router.post('/colorize-image', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Image URL is required" });

    console.log(`Colorizing image on-demand: ${url}`);
    const colorizedFile = await colorizeImage(url);

    if (!colorizedFile) {
      return res.status(500).json({ error: "Colorization failed" });
    }

    res.json({ success: true, colorUrl: `/color/${colorizedFile}` });

  } catch (error) {
    console.error("Colorize API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;