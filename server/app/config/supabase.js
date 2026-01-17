
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Lazy load .env
// Lazy load .env - Try local first, then parent
dotenv.config(); // Defaults to cwd (server/.env)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') }); // Fallback/Merge from root

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase URL or Key is missing!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
