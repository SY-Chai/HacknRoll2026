import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve to root .env (utility is in server/app/utils/supabase.js)
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Service Role Key for backend bypass if available, otherwise fallback to Anon
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Missing Supabase credentials in .env');
    console.log('SUPABASE_URL:', supabaseUrl);
    console.log('SUPABASE_KEY status:', supabaseKey ? 'Present' : 'Missing');
}

if (supabaseServiceRoleKey) {
    console.log('Supabase: Using Service Role Key (RLS Bypass enabled)');
} else {
    console.warn('Supabase: Using Anon Key (RLS will be enforced)');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
