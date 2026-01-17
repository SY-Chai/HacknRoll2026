import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/scrape', async (req, res) => {
    try {
        const { query, startYear, endYear } = req.query;

        if (!query || !startYear || !endYear) {
            return res.status(400).json({ error: 'Missing query parameters' });
        }

        const encodedQuery = encodeURIComponent(query);
        const fromDate = encodeURIComponent(`01/01/${startYear}`);
        const toDate = encodeURIComponent(`01/01/${endYear}`);

        // NAS URL
        const url = `https://www.nas.gov.sg/archivesonline/photographs/search-result?search-type=advanced&redirectedFrom=main&search-type=advanced&keywords=${encodedQuery}&keywords-type=all&max-display=20&date-from=${fromDate}&date-to=${toDate}`;

        console.log(`Fetching: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('.dataColumn').each((i, el) => {
            const titleEl = $(el).find('.linkRow');
            const imgEl = $(el).find('.imageColumn img');

            const title = titleEl.text().trim();
            let imgUrl = imgEl.attr('src');

            // Fix relative URLs
            if (imgUrl && !imgUrl.startsWith('http')) {
                imgUrl = `https://www.nas.gov.sg${imgUrl}`;
            }

            if (title && imgUrl) {
                results.push({
                    title,
                    imageUrl: imgUrl,
                    link: `https://www.nas.gov.sg${titleEl.attr('href')}`
                });
            }
        });

        res.json({ results });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('URL is required');
        }

        const response = await axios({
            url: decodeURIComponent(url),
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.nas.gov.sg/'
            }
        });

        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Failed to fetch image');
    }
});

app.listen(PORT, () => {
    console.log(`Scraper server running on http://localhost:${PORT}`);
});
