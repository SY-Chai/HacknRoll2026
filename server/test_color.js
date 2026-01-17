import { colorizeImage } from './app/agent/researchAgent.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const testUrl = "https://www.nas.gov.sg/archivesonline/watermark/picas_data/tn_pcd/20090000520-7142-D211-6578/img0321.jpg";

async function test() {
    try {
        console.log("Starting colorization test...");
        console.log("Using API Key:", process.env.GEMINI_API_KEY ? "FOUND" : "NOT FOUND");

        // Test base connectivity
        try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const testModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const testResult = await testModel.generateContent("echo test");
            console.log("API Key Verification:", testResult.response.text().trim() === "test" ? "SUCCESS" : "UNEXPECTED RESPONSE");
        } catch (e) {
            console.error("API Key Verification FAILED:", e.message);
        }

        const result = await colorizeImage(testUrl);
        if (result) {
            console.log("SUCCESS: Resulting filename:", result);
        } else {
            console.log("FAILURE: Result was null. Check agent logs above.");
        }
    } catch (error) {
        console.error("Test code CRASHED:", error);
    }
}

test();
