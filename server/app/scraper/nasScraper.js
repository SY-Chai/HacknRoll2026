import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.nas.gov.sg/archivesonline/photographs/search-result';

export async function searchPhotographs(keywords, startDate, endDate) {
  try {
    const params = {
      'search-type': 'advanced',
      'keywords': keywords,
      'keywords-type': 'all',
      'max-display': 100 // Fetch up to 100 results per request
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

      if (title && imageSrc) {
        results.push({
          title,
          url: link ? `https://www.nas.gov.sg/archivesonline${link}` : null,
          imageUrl: imageSrc, // Likely already absolute or relative, need to check.
                             // If relative, prepend base.
          date
        });
      }
    });
    
    // Fix relative URLs if necessary
    return results.map(item => {
      if (item.imageUrl && !item.imageUrl.startsWith('http')) {
        item.imageUrl = `https://www.nas.gov.sg${item.imageUrl}`;
      }
      return item;
    });

  } catch (error) {
    console.error('Error in searchPhotographs:', error);
    throw error;
  }
}
