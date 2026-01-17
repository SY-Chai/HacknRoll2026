import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.nas.gov.sg/archivesonline/photographs/search-result';

// Updated default limit to 8 as requested
export async function searchPhotographs(keywords, startDate, endDate, limit = 10) {
  try {
    // 1. Configure Search Parameters
    // We request MORE than the limit (e.g., 20) to create a buffer.
    // This allows us to skip duplicates and still reach the target of 8 unique items.
    const params = {
      'search-type': 'advanced',
      'keywords': keywords,
      'keywords-type': 'all',
      'max-display': '30'
    };

    if (startDate) params['date-from'] = startDate;
    if (endDate) params['date-to'] = endDate;

    console.log('Fetching Search Results with params:', params);

    // 2. Fetch Search Results Page
    const response = await axios.get(BASE_URL, { params });
    const $ = cheerio.load(response.data);

    let candidates = [];

    // 3. Extract Candidates (Links & Images)
    $('.searchResultItem').each((i, el) => {
      const linkElement = $(el).find('.resultData a.linkRow');
      const imageElement = $(el).find('.imageColumn img');
      const dateElement = $(el).find('.resultData .date');

      let link = linkElement.attr('href');

      // Initial fallback title
      let tempTitle = $(el).find('.details').eq(1).text().trim();
      if (!tempTitle) tempTitle = linkElement.text().trim();

      const imageSrc = imageElement.attr('src');

      // Date logic
      let date = dateElement.text().trim();
      if (!date) {
        const textContent = $(el).find('.resultData').text();
        const dateMatch = textContent.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) date = dateMatch[1];
      }

      // Normalize URL
      let fullLink = link;
      if (link) {
        if (link.startsWith('http')) fullLink = link;
        else if (link.startsWith('//')) fullLink = `https:${link}`;
        else if (link.startsWith('/')) fullLink = `https://www.nas.gov.sg${link}`;
        else fullLink = `https://www.nas.gov.sg/archivesonline/${link}`;
      }

      // Normalize Image URL
      let fullImageSrc = imageSrc;
      if (imageSrc) {
        if (imageSrc.startsWith('http')) fullImageSrc = imageSrc;
        else if (imageSrc.startsWith('//')) fullImageSrc = `https:${imageSrc}`;
        else if (imageSrc.startsWith('/')) fullImageSrc = `https://www.nas.gov.sg${imageSrc}`;
        fullImageSrc = fullImageSrc.replace(/a\.jpg$/i, '.jpg');
      }

      if (fullLink && fullImageSrc) {
        candidates.push({
          tempTitle: tempTitle,
          url: fullLink,
          imageUrl: fullImageSrc,
          date
        });
      }
    });

    console.log(`Found ${candidates.length} candidates. Processing until we have ${limit} unique items...`);

    // 4. Process candidates until we fill the quota
    const finalResults = [];
    const seenTitles = new Set();

    for (const item of candidates) {
      // Stop if we have reached the requested limit (e.g. 8)
      if (finalResults.length >= limit) break;

      try {
        // Fetch the details page
        const detailResponse = await axios.get(item.url);
        const $detail = cheerio.load(detailResponse.data);

        // Extract "Unedited Description"
        // Logic: Find label text -> go up to row -> find sibling .details span
        const uneditedDescLabel = $detail('label').filter((i, el) =>
          $detail(el).text().trim().includes('Unedited Description Supplied by Transferring Agency')
        );

        let finalTitle = item.tempTitle;

        if (uneditedDescLabel.length > 0) {
          const uneditedText = uneditedDescLabel.closest('.row').find('.details').text().trim();
          if (uneditedText) {
            finalTitle = uneditedText;
          }
        }

        // 5. Deduplication Check
        // If we have already seen this title, SKIP it.
        if (seenTitles.has(finalTitle)) {
          console.log(`Skipping duplicate title: "${finalTitle}"`);
          continue; // Move to the next candidate (finding a "new one")
        }

        // If unique, add to results
        seenTitles.add(finalTitle);
        finalResults.push({
          title: finalTitle,
          url: item.url,
          imageUrl: item.imageUrl,
          date: item.date
        });

      } catch (err) {
        console.warn(`Failed to fetch details for ${item.url}: ${err.message}`);
        // Depending on preference, you could skip this item or add it with the fallback title.
        // Here we try to add it with the temp title if unique.
        if (!seenTitles.has(item.tempTitle)) {
          seenTitles.add(item.tempTitle);
          finalResults.push({
            title: item.tempTitle,
            url: item.url,
            imageUrl: item.imageUrl,
            date: item.date
          });
        }
      }
    }

    console.log(`Successfully scraped ${finalResults.length} unique items.`);
    return finalResults;

  } catch (error) {
    console.error('Error in searchPhotographs:', error);
    throw error;
  }
}