import { supabase } from './server/app/utils/supabase.js';
import { uploadToR2 } from './server/app/utils/r2.js';
import fs from 'fs';

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('journeys').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('Supabase Connection: OK');
    } catch (err) {
        console.error('Supabase Connection FAILED:', err.message);
    }

    console.log('\nTesting R2 Upload...');
    try {
        const testBuffer = Buffer.from('test data');
        const url = await uploadToR2(testBuffer, 'test-connection.txt', 'text/plain', process.env.R2_IMAGE_BUCKET);
        console.log('R2 Upload: OK');
        console.log('Test URL:', url);
    } catch (err) {
        console.error('R2 Upload FAILED:', err.message);
    }
}

testConnection();
