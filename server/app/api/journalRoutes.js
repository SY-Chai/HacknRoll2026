
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { r2Client, R2_BUCKETS, R2_DOMAINS } from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { searchPhotographs } from '../scraper/nasScraper.js';
import { enhanceDescription } from '../agent/researchAgent.js';
import axios from 'axios';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper: Upload to R2 ---
async function uploadToR2(file, bucket) {
    const key = `${uuidv4()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await r2Client.send(command);
    return key;
}

// --- 1. SEARCH -> DB ---
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Missing query" });

        console.log(`[Journal] Searching for: ${query}`);

        // 1. Check for existing Journal
        const { data: existingJournals, error: findError } = await supabase
            .from('Journal')
            .select('id')
            .eq('query', query)
            .limit(1);

        if (findError) throw findError;

        if (existingJournals && existingJournals.length > 0) {
            console.log(`[Journal] Found existing journal: ${existingJournals[0].id}`);
            return res.json({ success: true, journalId: existingJournals[0].id });
        }

        // 2. No existing journal, Scrape & Create
        const rawResults = await searchPhotographs(query, undefined, undefined, 5); // Limit 5 for speed
        const results = rawResults.slice(0, 5); // Ensure max 5

        // Create Journal Entry
        const { data: journal, error: journalError } = await supabase
            .from('Journal')
            .insert({ query: query, user_created: false })
            .select() // Return inserted row
            .single();

        if (journalError) throw journalError;

        const records = [];
        // Sequential to avoid rate limits? Or Parallel? Parallel is faster.
        await Promise.all(results.map(async (item) => {
             // 1. Enhance Description
             let description = item.tempTitle;
             try {
                description = await enhanceDescription(item.title || item.tempTitle, item.date || "Unknown Date");
             } catch (descErr) {
                console.warn(`Description enhancement failed for ${item.url}`);
             }

             // 2. Upload Image to R2
             let imageUrl = item.imageUrl;
             try {
                const imgRes = await axios.get(item.imageUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imgRes.data);
                const file = {
                    buffer: buffer,
                    originalname: `scraped_${Date.now()}.jpg`, // Default name
                    mimetype: imgRes.headers['content-type'] || 'image/jpeg'
                };
                const key = await uploadToR2(file, R2_BUCKETS.IMAGE);
                imageUrl = `${R2_DOMAINS.IMAGE}/${key}`;
             } catch (imgErr) {
                 console.warn(`Image upload to R2 failed for ${item.imageUrl}:`, imgErr.message);
                 // Fallback to original URL if upload fails? Or null?
                 // User wants R2, so if fail, maybe keep original or fail?
                 // Keeping original allows app to still work.
             }

            records.push({
                journal_id: journal.id,
                title: item.title || item.tempTitle,
                description: description,
                image_url: imageUrl,
                audio_url: null
            });
        }));

        // Insert Records
        if (records.length > 0) {
            const { error: recordsError } = await supabase.from('Record').insert(records);
            if (recordsError) throw recordsError;
        }

        console.log(`[Journal] Created Journal ID: ${journal.id} with ${records.length} records.`);
        res.json({ success: true, journalId: journal.id });

    } catch (error) {
        console.error("Search failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 2. UPLOAD -> DB ---
router.post('/create', upload.any(), async (req, res) => {
    try {
        const { items } = req.body; // Expect JSON string of metadata
        const files = req.files;

        if (!items || !files) {
            return res.status(400).json({ error: "Missing items or files" });
        }

        const parsedItems = JSON.parse(items); // Expect array of { title, description, imageIndex, audioIndex }

        // Create Journal Entry
        const { data: journal, error: journalError } = await supabase
            .from('Journal')
            .insert({ user_created: true }) // No query for uploads
            .select()
            .single();

        if (journalError) throw journalError;

        // Frontend sends: 
        // `items`: JSON string `[{title, desc}, {title, desc}]`
        // Files: `image_0`, `audio_0`, `image_1`, `audio_1`...

        for (let i = 0; i < parsedItems.length; i++) {
            const itemMetadata = parsedItems[i];
            
            // Find Image
            const imageFile = files.find(f => f.fieldname === `image_${i}`);
            let imageUrl = null;
            if (imageFile) {
                const key = await uploadToR2(imageFile, R2_BUCKETS.IMAGE);
                imageUrl = `${R2_DOMAINS.IMAGE}/${key}`;
            }

            // Find Audio
            const audioFile = files.find(f => f.fieldname === `audio_${i}`);
            let audioUrl = null;
            if (audioFile) {
                const key = await uploadToR2(audioFile, R2_BUCKETS.AUDIO);
                audioUrl = `${R2_DOMAINS.AUDIO}/${key}`;
            }

            records.push({
                journal_id: journal.id,
                title: itemMetadata.title,
                description: itemMetadata.description,
                image_url: imageUrl,
                audio_url: null,
                splat_url: null
            });
        }

        // Insert Records
        if (records.length > 0) {
            const { error: recordsError } = await supabase.from('Record').insert(records);
            if (recordsError) throw recordsError;
        }

        res.json({ success: true, journalId: journal.id });

    } catch (error) {
        console.error("Create failed:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- 3. FETCH JOURNAL ---
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch Journal
        const { data: journal, error: journalError } = await supabase
            .from('Journal')
            .select('*')
            .eq('id', id)
            .single();

        if (journalError) throw journalError;

        // Fetch Records
        const { data: records, error: recordsError } = await supabase
            .from('Record')
            .select('*')
            .eq('journal_id', id);

        if (recordsError) throw recordsError;

        res.json({
            id: journal.id,
            query: journal.query,
            user_created: journal.user_created,
            created_at: journal.created_at,
            records: records
        });

    } catch (error) {
        console.error("Fetch failed:", error);
        res.status(404).json({ error: "Journal not found" });
    }
});

export default router;
