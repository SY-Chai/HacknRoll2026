import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve to root .env (utility is in server/app/utils/r2.js)
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// Parse CLOUDFLARE_R2_S3_KEY (format: accessKeyId:secretAccessKey)
const s3Key = (process.env.CLOUDFLARE_R2_S3_KEY || '').trim();
const [accessKeyId, secretAccessKey] = s3Key.split(':').map(s => s.trim());

const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_S3_URL || process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: accessKeyId || process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export const uploadToR2 = async (buffer, filename, contentType, bucket) => {
    if (!bucket) {
        console.error('R2 Upload Error: No bucket specified');
        throw new Error('Bucket is required for R2 upload');
    }

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
    });

    try {
        console.log(`Uploading ${filename} to R2 bucket: ${bucket}...`);
        await r2Client.send(command);

        // Use mapping for public URLs
        let baseUrl = bucket === process.env.R2_AUDIO_BUCKET
            ? process.env.R2_PUBLIC_AUDIO_URL || process.env.CLOUDFLARE_R2_AUDIO_URL
            : process.env.R2_PUBLIC_IMAGE_URL || process.env.CLOUDFLARE_R2_IMAGES_URL;

        if (!baseUrl) {
            console.error('R2 Public URL fallback: Bucket name might be missing in .env');
            baseUrl = '';
        }

        const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${normalizedBaseUrl}/${filename}`;
    } catch (error) {
        console.error('R2 upload failed:', error.message);
        throw error;
    }
};
