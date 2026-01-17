import express from 'express';
import axios from 'axios';
import { searchPhotographs } from '../scraper/nasScraper.js';
import { enhanceDescription, generateAudio, colorizeImage } from '../agent/researchAgent.js';
import { supabase } from '../config/supabase.js';
import { r2Client, R2_BUCKETS, R2_DOMAINS } from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Image Proxy
router.get("/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send("Missing url parameter");
    }

    // Add User-Agent to avoid being blocked by NAS/External servers
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.nas.gov.sg/",
      },
      timeout: 10000,
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy Image Error:", error.message);
    res.status(500).send("Failed to fetch image");
  }
});

// Original Search Endpoint (Kept for backward compatibility/debugging)
router.get("/search", async (req, res) => {
  try {
    const { q, start, end, limit } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ error: 'Query parameter "q" (keywords) is required.' });
    }

    // Default dates if not provided (optional)
    const startDate = start;
    const endDate = end;
    const resultLimit = limit ? parseInt(limit) : 5; // Default to 5 as requested

    console.log(
      `Received search request: q=${q}, start=${startDate}, end=${endDate}, limit=${resultLimit}`,
    );

    // 1. Scrape basic results
    const results = await searchPhotographs(q, startDate, endDate, resultLimit);

    // 2. Enhance with AI descriptions
    console.log("Enhancing results with AI...");
    const enhancedResults = await Promise.all(
      results.map(async (item, index) => {
        const description = await enhanceDescription(item.title, item.date);
        // Lazy Load: Do NOT generate audio here.

        return {
          ...item,
          description,
          audio: null, // Client will fetch this later
        };
      }),
    );

    res.json({
      success: true,
      count: enhancedResults.length,
      data: enhancedResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch data from NAS Archives",
      details: error.message,
    });
  }
});

// New Endpoint: Lazy Generate Audio
router.post("/generate-audio", async (req, res) => {
  try {
    const { text, id, recordId } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    console.log(`Generating audio on-demand for ID: ${id}`);
    // Use a unique ID based on timestamp if valid ID not provided
    const safeId = id || Date.now().toString();

    const audioFilename = await generateAudio(text, safeId);

    if (!audioFilename) {
      return res.status(500).json({ error: "Audio generation failed" });
    }

    if (!R2_BUCKETS.AUDIO) {
         console.warn("⚠️ R2 Audio Bucket not configured. Skipping upload.");
         return res.json({ success: true, audioUrl: `/audio/${audioFilename}` });
    }

    let finalAudioUrl = `/audio/${audioFilename}`; // Default to local
    try {
        const filePath = path.join(process.cwd(), 'tmp', audioFilename);
        const fileBuffer = fs.readFileSync(filePath);
        
        const key = `audio-${safeId}-${Date.now()}.mp3`;
        const command = new PutObjectCommand({
            Bucket: R2_BUCKETS.AUDIO,
            Key: key,
            Body: fileBuffer,
            ContentType: 'audio/mpeg'
        });
        
        await r2Client.send(command);
        finalAudioUrl = `${R2_DOMAINS.AUDIO}/${key}`;
        console.log(`Audio uploaded to R2: ${finalAudioUrl}`);

        // Update DB if recordId provided
        if (recordId) {
            const { error: updateError } = await supabase
                .from('Record')
                .update({ audio_url: finalAudioUrl })
                .eq('id', recordId);
            
            if (updateError) console.error("Failed to update Record with audio URL:", updateError);
            else console.log(`DB updated for record ${recordId}`);
        }

    } catch (r2Error) {
        console.error("R2 Upload failed for audio:", r2Error);
    }

    res.json({ success: true, audioUrl: finalAudioUrl });

  } catch (error) {
    console.error("Generate Audio API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// New Endpoint: Colorize Image via Nano Banana
router.post("/colorize-image", async (req, res) => {
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

// New Endpoint: Generate 3D Gaussians (SHARP)
router.post("/generate-3d", async (req, res) => {
  try {
    const { imageUrls } = req.body;
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({ error: "imageUrls array is required" });
    }

    console.log(`Generating 3D Gaussians for ${imageUrls.length} images...`);
    const results = await generate3DGaussians(imageUrls);

    if (!results) {
      return res.status(500).json({ error: "3D generation failed" });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Generate 3D API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
