import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugDetails() {
    // URL from the debug output (inferred or known structure)
    // NAS URLs are usually /archivesonline/data/pdfdoc/... or /details/...
    // Let's rely on the link scraped in the previous step if possible, but I don't have it easily.
    // I will use a known sample or search again.
    
    // Simulating the flow
    const searchUrl = 'https://www.nas.gov.sg/archivesonline/photographs/search-result?search-type=advanced&keywords=raffles&keywords-type=all&max-display=5';
    const res = await axios.get(searchUrl);
    const $ = cheerio.load(res.data);
    
    const firstLink = $('.searchResultItem a.linkRow').first().attr('href');
    const absoluteLink = `https://www.nas.gov.sg/archivesonline/${firstLink}`;
    
    console.log(`Fetching details from: ${absoluteLink}`);
    
    const detailRes = await axios.get(absoluteLink);
    const $detail = cheerio.load(detailRes.data);
    
    // Dump mostly text to find the label
    console.log($detail('body').text().replace(/\s+/g, ' '));
}

debugDetails();
