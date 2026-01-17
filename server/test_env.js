import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env:', result.error);
} else {
    console.log('Env loaded successfully');
}

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('R2_IMAGE_BUCKET:', process.env.R2_IMAGE_BUCKET);
console.log('CLOUDFLARE_R2_S3_KEY status:', process.env.CLOUDFLARE_R2_S3_KEY ? 'Present' : 'Missing');

const s3Key = (process.env.CLOUDFLARE_R2_S3_KEY || '').trim();
const [accessKeyId, secretAccessKey] = s3Key.split(':').map(s => s.trim());
console.log('Parsed AccessKeyId:', accessKeyId ? 'OK' : 'MISSING');
console.log('Parsed SecretKey:', secretAccessKey ? 'OK' : 'MISSING');
