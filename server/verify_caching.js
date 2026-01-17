import { generateAudio } from './app/agent/researchAgent.js';
import fs from 'fs';
import path from 'path';

async function testCaching() {
    const id = "test_cache_unique_id";
    const text = "This is a test of the caching system.";
    
    console.log("1. Requesting Audio (Active generation or existing)...");
    const file1 = await generateAudio(text, id);
    console.log(`File 1: ${file1}`);

    console.log("\n2. Requesting Audio AGAIN (Should result in Cache Hit)...");
    const file2 = await generateAudio(text, id);
    console.log(`File 2: ${file2}`);

    if (file1 === file2) {
        console.log("\nSUCCESS: Filenames match.");
        if (file1.includes("test_cache_unique_id") && !file1.includes(Date.now().toString().substring(0,8))) { 
             // weak check for timestamp presence, but main thing is stability
             console.log("SUCCESS: Filename appears stable (no new timestamp appended).");
        }
    } else {
        console.error("\nFAILURE: Filenames do not match (Caching failed).");
    }
}

testCaching();
