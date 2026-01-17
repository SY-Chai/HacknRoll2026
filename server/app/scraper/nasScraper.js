import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.nas.gov.sg/archivesonline/photographs/search-result';

export async function searchPhotographs(keywords, startDate, endDate, limit = 100) {
  try {
    const params = {
      'search-type': 'advanced',
      'keywords': keywords,
      'keywords-type': 'all',
      'max-display': '20' // Fetch minimum allowed by server to reduce load, we will slice later
    };

    if (startDate) {
      params['date-from'] = startDate;
    }
    if (endDate) {
      params['date-to'] = endDate;
    }

    console.log('Fetching URL with params:', params);

    const response = await axios.get(BASE_URL, { params });
    const html = response.data;
    const $ = cheerio.load(html);
    const results = [];

    // The selector investigation showed results are likely in .searchResultItem or similar
    // Based on browser investigation:
    // Container: likely .searchResultItem or derived from 'div' structure.
    // Let's rely on the structure seen: 
    //   item: div.searchResultItem (or similar, need to be robust)
    //   title: .resultData a.linkRow
    //   image: .imageColumn img
    //   date: .resultData p.date
    //   source: .resultData p.source

    // Let's iterate over the containers.
    // From manual investigation output:
    // "Result Item Container": ".searchResultItem"
    
    $('.searchResultItem').each((i, el) => {
      const titleElement = $(el).find('.resultData a.linkRow');
      const imageElement = $(el).find('.imageColumn img');
      const dateElement = $(el).find('.resultData .date'); // Assuming class .date based on typical structure, or p contains text
      
      const title = titleElement.text().trim();
      const link = titleElement.attr('href');
      const imageSrc = imageElement.attr('src');
      
      // Sometimes date is just text in a p tag, let's try to find it more loosely if specific class fails
      let date = dateElement.text().trim();
      if (!date) {
         // Fallback: look for text pattern in .resultData
         const textContent = $(el).find('.resultData').text();
         const dateMatch = textContent.match(/(\d{2}\/\d{2}\/\d{4})/);
         if (dateMatch) date = dateMatch[1];
      }

      // Process the URL
      let fullLink = link;
      if (link) {
        if (link.startsWith('http')) {
           fullLink = link;
        } else if (link.startsWith('//')) {
           fullLink = `https:${link}`;
        } else if (link.startsWith('/')) {
           // It's a root relative path.
           // Check if it already includes /archivesonline or not to decide base
           fullLink = `https://www.nas.gov.sg${link}`;
        } else {
           // Relative to current path?
           fullLink = `https://www.nas.gov.sg/archivesonline/${link}`;
        }
      }

      // Process the Image URL
      let fullImageSrc = imageSrc;
      if (imageSrc) {
        if (imageSrc.startsWith('http')) {
          fullImageSrc = imageSrc;
        } else if (imageSrc.startsWith('//')) {
          fullImageSrc = `https:${imageSrc}`;
        } else if (imageSrc.startsWith('/')) {
          fullImageSrc = `https://www.nas.gov.sg${imageSrc}`;
        }
        
        // Remove 'a' from the end of the filename (e.g., img001a.jpg -> img001.jpg)
        // This is often used to switch from a specific variant to the main image
        fullImageSrc = fullImageSrc.replace(/a\.jpg$/i, '.jpg');
      }

      if (title && fullImageSrc) {
        results.push({
          title,
          url: fullLink,
          imageUrl: fullImageSrc,
          date
        });
      }
    });
    
    // Batched Processing to guarantee filling the limit without over-fetching
    const uniqueResults = [];
    const seenTitles = new Set();
    let currentIndex = 0;
    
    // Process matches until we reach the limit or run out of candidates
    while (uniqueResults.length < limit && currentIndex < results.length) {
        // Prepare a batch (e.g., try to fetch enough to fill the remaining gap, plus a buffer)
        // Buffer of 2 extra in case of duplicates in this batch
        const remainingNeeded = limit - uniqueResults.length;
        const batchSize = remainingNeeded + 2; 
        
        const batchCandidates = results.slice(currentIndex, currentIndex + batchSize);
        currentIndex += batchSize; // Move pointer

        if (batchCandidates.length === 0) break;

        console.log(`Processing batch of ${batchCandidates.length} items (Needed: ${remainingNeeded})...`);

        // Fetch details for this batch in parallel
        const batchDetails = await Promise.all(batchCandidates.map(async (item) => {
            try {
                const detailResponse = await axios.get(item.url);
                const $d = cheerio.load(detailResponse.data);
                
                let newTitle = null;
                const label = $d('label').filter((i, el) => $d(el).text().includes('Unedited Description Supplied by Transferring Agency'));
                
                if (label.length > 0) {
                    const nextDiv = label.next('div');
                    if (nextDiv.length > 0) newTitle = nextDiv.text().trim();
                }

                if (!newTitle) {
                    $d('td').each((i, el) => {
                        if ($d(el).text().includes('Unedited Description Supplied by Transferring Agency')) {
                            const nextTd = $d(el).next('td');
                            if (nextTd.length > 0) newTitle = nextTd.text().trim();
                        }
                    });
                }

                return {
                    ...item,
                    title: newTitle || item.title,
                    originalCaption: item.title
                };
            } catch (err) {
                console.error(`Failed to fetch details for ${item.url}:`, err.message);
                return item;
            }
        }));

        // Add unique items from this batch to the final list
        for (const item of batchDetails) {
            if (uniqueResults.length >= limit) break; // Hard stop if filled during batch processing

            const normalizedTitle = item.title.trim().toLowerCase();
            if (!seenTitles.has(normalizedTitle)) {
                seenTitles.add(normalizedTitle);
                uniqueResults.push(item);
            }
        }
    }

    return uniqueResults;

  } catch (error) {
    console.error('Error in searchPhotographs:', error);
    throw error;
  }
}
