import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('SUPABASE_URL presence:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY presence:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY presence:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SERVICE_ROLE_KEY (alt) presence:', !!process.env.SERVICE_ROLE_KEY);
