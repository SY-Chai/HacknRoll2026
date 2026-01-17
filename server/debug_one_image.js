import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

async function checkImage(url) {
    console.log(`Checking Aerial Photo: ${url}`);
    try {
        const imageResponse = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const base64Image = Buffer.from(imageResponse.data).toString('base64');
        const mimeType = 'image/jpeg';

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Is this image a ground-level photograph? Reply strictly with 'PHOTOGRAPH'. Reply 'OTHER' if it is an aerial view, bird's-eye view, map, document, poster, or illustration." },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ],
          max_tokens: 10
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`
          }
        });
    
        const answer = response.data.choices[0].message.content;
        console.log(`GPT Answer: ${answer}`);
    } catch (e) {
        console.error(e);
    }
}

// "PART OF A SERIES OF AERIAL PHOTOGRAPHS..."
checkImage("https://www.nas.gov.sg/archivesonline/attachments/picas_data/tn_pcd/20120000748/img0096.jpg");
