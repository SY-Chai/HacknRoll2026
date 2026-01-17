import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.nas.gov.sg/archivesonline/photographs/search-result';

async function debugScraper() {
    const params = {
        'search-type': 'advanced',
        'keywords': 'raffles',
        'keywords-type': 'all',
        'max-display': '5'
    };

    console.log("Fetching...");
    const response = await axios.get(BASE_URL, { params });
    const $ = cheerio.load(response.data);

    const firstItem = $('.searchResultItem').first();
    console.log("First Item HTML:");
    console.log(firstItem.html());
    
    // Check for "Unedited Description" which might be in hidden fields or visible text
    console.log("\n--- Full Text of first item ---");
    console.log(firstItem.text().replace(/\s+/g, ' '));
}

debugScraper();
