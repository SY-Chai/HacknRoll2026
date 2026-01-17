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
    
    // Slice results
    return results.slice(0, limit);

  } catch (error) {
    console.error('Error in searchPhotographs:', error);
    throw error;
  }
}
