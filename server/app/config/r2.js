
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

// Lazy load .env
dotenv.config(); 
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const accountId = process.env.R2_ACCOUNT_ID;

// Parse Cloudflare S3 Key if present
let accessKeyId = process.env.R2_ACCESS_KEY_ID;
let secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (process.env.CLOUDFLARE_R2_S3_KEY) {
    const parts = process.env.CLOUDFLARE_R2_S3_KEY.split(':');
    if (parts.length === 2) {
        accessKeyId = parts[0];
        secretAccessKey = parts[1];
    }
}

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || process.env.CLOUDFLARE_R2_S3_URL || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.warn("⚠️ Cloudflare R2 Credentials Missing! Need: (CLOUDFLARE_R2_ENDPOINT or CLOUDFLARE_R2_S3_URL or R2_ACCOUNT_ID) AND (R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY or CLOUDFLARE_R2_S3_KEY)");
}

if (endpoint) {
    console.log("Using R2 Endpoint:", endpoint);
}

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
});

export const R2_BUCKETS = {
    IMAGE: process.env.R2_IMAGE_BUCKET || 'images',
    AUDIO: process.env.R2_AUDIO_BUCKET || 'audio',
    SPLAT: process.env.R2_SPLAT_BUCKET || 'splats'
};

export const R2_DOMAINS = {
    IMAGE: process.env.CLOUDFLARE_R2_IMAGE_URL || process.env.R2_IMAGE_DOMAIN || `https://${process.env.R2_IMAGE_BUCKET}`,
    AUDIO: process.env.CLOUDFLARE_R2_AUDIO_URL || process.env.R2_AUDIO_DOMAIN || `https://${process.env.R2_AUDIO_BUCKET}`,
    SPLAT: process.env.CLOUDFLARE_R2_SPLAT_URL || process.env.R2_SPLAT_DOMAIN || `https://${process.env.R2_SPLAT_BUCKET}`
};
