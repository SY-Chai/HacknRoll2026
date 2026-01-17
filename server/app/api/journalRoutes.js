
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { r2Client, R2_BUCKETS, R2_DOMAINS } from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { searchPhotographs } from '../scraper/nasScraper.js';
import { enhanceDescription, processAndEnhanceImage } from '../agent/researchAgent.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
        // Create Journal Entry immediately
        const { data: journal, error: journalError } = await supabase
            .from('Journal')
            .insert({ query: query, user_created: false })
            .select() // Return inserted row
            .single();

        if (journalError) throw journalError;

        console.log(`[Journal] Created Journal ID: ${journal.id}. Starting background processing...`);
        res.json({ success: true, journalId: journal.id }); // Respond immediately

        // --- Background Processing ---
        (async () => {
            try {
                // Define Streaming Callback
                const processItem = async (item) => {
                    console.log(`[Journal ${journal.id}] Processing item: ${item.title}`);
                    
                    // 1. Enhance Description
                    let description = item.tempTitle;
                    try {
                        description = await enhanceDescription(item.title || item.tempTitle, item.date || "Unknown Date");
                    } catch (descErr) {
                        console.warn(`Description enhancement failed for ${item.url}`);
                    }

                    // 2. Upload Image to R2 (Upscaled + Colorized)
                    let imageUrl = item.imageUrl;
                    try {
                        const imgRes = await axios.get(item.imageUrl, { responseType: 'arraybuffer' });
                        const originalBuffer = Buffer.from(imgRes.data);

                        // Process Image (Upscale + Colorize)
                        let finalBuffer = originalBuffer;
                        let mimeType = imgRes.headers['content-type'] || 'image/jpeg';
                        
                        try {
                            const enhancedFilename = await processAndEnhanceImage(originalBuffer);
                            if (enhancedFilename) {
                                const enhancedPath = path.join(process.cwd(), 'tmp', 'enhanced_cache', enhancedFilename);
                                if (fs.existsSync(enhancedPath)) {
                                    finalBuffer = fs.readFileSync(enhancedPath);
                                    mimeType = 'image/png'; // Enhanced output is PNG
                                }
                            }
                        } catch (processingErr) {
                            console.warn(`Processing failed for ${item.imageUrl}, falling back to original.`, processingErr.message);
                        }

                        const file = {
                            buffer: finalBuffer,
                            originalname: `record_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`,
                            mimetype: mimeType
                        };

                        const key = await uploadToR2(file, R2_BUCKETS.IMAGE);
                        imageUrl = `${R2_DOMAINS.IMAGE}/${key}`;

                    } catch (imgErr) {
                        console.warn(`Image upload to R2 failed for ${item.imageUrl}:`, imgErr.message);
                    }

                    // Insert Record Incremental
                    const record = {
                        journal_id: journal.id,
                        title: item.title || item.tempTitle,
                        description: description,
                        image_url: imageUrl,
                        audio_url: null,
                        splat_url: null
                    };

                    const { error: insertError } = await supabase.from('Record').insert(record);
                    if (insertError) console.error(`Failed to insert record for ${item.title}:`, insertError.message);
                    else console.log(`[Journal ${journal.id}] Record inserted: ${item.title}`);
                };

                // Trigger Scraper with Streaming Callback
                // The scraper will await 'processItem', which now returns quickly (after insert),
                // ensuring order 1->2->3 is preserved in DB IDs.
                await searchPhotographs(query, undefined, undefined, 5, processItem);
                
                console.log(`[Journal ${journal.id}] Scraper finished. Background tasks may still be running.`);

            } catch (bgError) {
                console.error(`[Journal ${journal.id}] Background processing failed:`, bgError);
            }
        })();

    } catch (error) {
        console.error("Search failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 2. UPLOAD -> DB ---
router.post('/create', upload.any(), async (req, res) => {
    try {
        const { items, journalTitle } = req.body; // Expect JSON string of metadata
        const files = req.files;

        if (!items || !files) {
            return res.status(400).json({ error: "Missing items or files" });
        }

        const parsedItems = JSON.parse(items); // Expect array of { title, description, imageIndex, audioIndex }

        // Create Journal Entry
        const { data: journal, error: journalError } = await supabase
            .from('Journal')
            .insert({ 
                user_created: true,
                query: journalTitle || 'Untitled Journal' // Save Title in Query Column
            }) 
            .select()
            .single();

        if (journalError) throw journalError;

        // Frontend sends: 
        // `items`: JSON string `[{title, desc}, {title, desc}]`
        // Files: `image_0`, `audio_0`, `image_1`, `audio_1`...

        const records = [];

        for (let i = 0; i < parsedItems.length; i++) {
            const itemMetadata = parsedItems[i];
            
            // Find Image
            const imageFile = files.find(f => f.fieldname === `image_${i}`);
            let imageUrl = null;
            if (imageFile) {
                // Process Image (Upscale + Colorize)
                let finalBuffer = imageFile.buffer;
                let mimeType = imageFile.mimetype;

                try {
                    const enhancedFilename = await processAndEnhanceImage(imageFile.buffer);
                    if (enhancedFilename) {
                        const enhancedPath = path.join(process.cwd(), 'tmp', 'enhanced_cache', enhancedFilename);
                        if (fs.existsSync(enhancedPath)) {
                            finalBuffer = fs.readFileSync(enhancedPath);
                            mimeType = 'image/png'; // Enhanced output is PNG
                        }
                    }
                } catch (processingErr) {
                    console.warn(`Processing failed for uploaded image_${i}, using original.`, processingErr.message);
                }

                const fileToUpload = {
                    buffer: finalBuffer,
                    originalname: `user_upload_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`,
                    mimetype: mimeType
                };

                const key = await uploadToR2(fileToUpload, R2_BUCKETS.IMAGE);
                imageUrl = `${R2_DOMAINS.IMAGE}/${key}`;
            }

            // Auto-Generate Audio from Description
            let audioUrl = null;
            if (itemMetadata.description) {
                try {
                    const safeId = `user_gen_${Date.now()}_${i}`;
                    const audioFilename = await generateAudio(itemMetadata.description, safeId);
                    
                    if (audioFilename && R2_BUCKETS.AUDIO) {
                        const filePath = path.join(process.cwd(), 'tmp', audioFilename);
                        if (fs.existsSync(filePath)) {
                            const fileBuffer = fs.readFileSync(filePath);
                            const key = `audio-${safeId}-${Date.now()}.mp3`;
                             
                            const command = new PutObjectCommand({
                                Bucket: R2_BUCKETS.AUDIO,
                                Key: key,
                                Body: fileBuffer,
                                ContentType: 'audio/mpeg'
                            });
                            
                            await r2Client.send(command);
                            audioUrl = `${R2_DOMAINS.AUDIO}/${key}`;
                            console.log(`[Create] Generated & Uploaded Audio: ${audioUrl}`);
                            
                            // Cleanup tmp file
                            fs.unlinkSync(filePath);
                        }
                    }
                } catch (audioErr) {
                    console.warn(`Audio generation failed for item ${i}:`, audioErr.message);
                }
            }

            records.push({
                journal_id: journal.id,
                title: itemMetadata.title,
                description: itemMetadata.description,
                image_url: imageUrl,
                audio_url: audioUrl,
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


// --- 3. BATCH FETCH & USER JOURNALS ---

// Get specific journals by IDs (For LocalStorage Bookmarks)
router.post('/batch', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { data: journals, error } = await supabase
            .from('Journal')
            .select('*')
            .in('id', ids)
            .order('id', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: journals });
    } catch (error) {
        console.error("Batch fetch failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get User Created Journals
router.get('/mine', async (req, res) => {
    try {
        const { data: journals, error } = await supabase
            .from('Journal')
            .select('*')
            .eq('user_created', true)
            .order('id', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: journals });
    } catch (error) {
        console.error("Fetch mine failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 4. FETCH SINGLE JOURNAL ---
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch Journal
        const { data: journal, error: journalError } = await supabase
            .from('Journal')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (journalError) throw journalError;
        if (!journal) return res.status(404).json({ error: "Journal not found" });

        // Fetch Records
        const { data: records, error: recordsError } = await supabase
            .from('Record')
            .select('*')
            .eq('journal_id', id)
            .order('id', { ascending: true });

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
