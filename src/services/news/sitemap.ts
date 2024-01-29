import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { parseString } from 'xml2js';
import axios from 'axios';
import cheerio from 'cheerio';
import Domain from '../../models/Domain';
import { DomainSitemap } from '../../interfaces/analytics/domain';
import { HydratedDocument } from 'mongoose';
import { getBrowserContext } from '../playwright';
import { appConfig } from '../../configs/app.config';


export async function findSitemapUrl(base_url: string): Promise<string | null> {
  try {
    const response = await axios.get(base_url);
    const html = response.data;
    const $ = cheerio.load(html);
    let sitemapUrl: string | null = null;

    // Look for sitemap in the robots.txt file
    const robotsUrl = `${base_url.replace(/\/$/, '')}/robots.txt`;
    const robotsResponse = await axios.get(robotsUrl);
    const robotsContent = robotsResponse.data;
    const lines = robotsContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('Sitemap:') && line.match(/blog|post|article/i)) {
          sitemapUrl = line.split(': ')[1].trim();
          break;            
      }
    }

    if (!sitemapUrl) {
        for (const line of lines) {
            if (line.startsWith('Sitemap:') && !line.match(/blog|post|article/i)) {
                sitemapUrl = line.split(': ')[1].trim();
                break;  
            }
        }
        // If not found in robots.txt, look for sitemap in the HTML
        if (!sitemapUrl) {
          $('link[rel="sitemap"]').each((index, element) => {
            sitemapUrl = $(element).attr('href') || null;
            if (sitemapUrl) {
              return false; // Exit the loop when the sitemap URL is found
            }
          });
        }
    }
    return sitemapUrl;
  } catch (error) {
    console.error(`Error: Unable to fetch data from ${base_url}`);
    return null;
  }
}

export async function generateSitemap(base_url: string, context: BrowserContext): Promise<string | null | any> {  
  const page: Page = await context.newPage();		
  try {
    let baseDomain = new URL(base_url).hostname;
    const timeout = appConfig.crawler.timeout;
    await Promise.race([
      page.goto(base_url, { waitUntil: 'domcontentloaded' }),
      page.waitForTimeout(timeout) // Wait for the specified timeout
  ]);
  // console.log('page opened from sitemap generation')

    // Extract all URLs from the website
    const allUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map((link) => link.getAttribute('href'));
    });
    // await page.close();

    // Filter out invalid URLs and remove duplicates
    const uniqueUrls = Array.from(new Set(allUrls.filter((url) =>  { if (url) return filterByBaseDomain(url, baseDomain) })));
    return uniqueUrls
  } catch (error) {
    console.error('Error while generating the sitemap:', error);
  } finally {
    await page.close()
    // console.log('page closed from sitemap generation')
  }
}

function filterByBaseDomain(url: string, baseDomain: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === baseDomain;
    } catch (error) {
      return false;
    }
  }



// export async function crawlSitemap(urls: string[], page: Page) {
//   // let browser: Browser | null = null;

//   try {
//     // browser = await chromium.launch();

//     for (const url of urls) {
//       try {
//         // const page = await browser.newPage();
//         await page.goto(url);
//         const pageTitle = await page.title();
//         const paragraph = await page.evaluate(() => document.querySelectorAll('p').length);
//         await page.close();
//       } catch (error) {
//         console.error(`Error while crawling ${url}:`, error);
//       }
//     }
//   } catch (error) {
//     console.error('Error while crawling sitemap:', error);
//   // } finally {
//   //   if (browser) {
//   //     await browser.close();
//   //   }
//   }
// }

export async function getSitemapLinksResponse(sitemapUrl: string) {
  try {
    const response = await axios.get(sitemapUrl);
    // // Parse the XML data to JSON
    const xmlData = response.data;
    // const xmlData = fs.readFileSync(sitemapPath, 'utf-8');

    const jsonData = await parseSitemapXML(xmlData);

    // Extract the links from the JSON
    const links: string[] = extractLinksFromJSON(jsonData);

    return links;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}


function parseUrlsFromSitemap(sitemapXml: string): string[] {
  const urls: string[] = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;

  while ((match = regex.exec(sitemapXml))) {
    urls.push(match[1]);
  }
  return urls;
}


function parseSitemapXML(xmlData: string): Promise<any> {
  return new Promise((resolve, reject) => {
    parseString(xmlData, { trim: true }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function extractLinksFromJSON(jsonData: any): string[] {
  const links: string[] = [];

  // Modify this to extract links according to your sitemap structure
  if (jsonData.urlset && jsonData.urlset.url) {
    for (const urlObj of jsonData.urlset.url) {
      if (urlObj.loc && urlObj.loc.length > 0) {
        links.push(urlObj.loc[0]);
      }
    }
  }

  return links;
}


export const saveSitemapUrls = async (source: string, links: string[]): Promise<HydratedDocument<DomainSitemap>> => {
	const onDb = await Domain.findOne({ source });
	if (onDb) {
    let updatedData = { source, sitemapUrls: links, updatedAt: new Date() }
    return await onDb.overwrite(updatedData).save()
  } else {
    let newData = { source, sitemapUrls: links, updatedAt: new Date(), createdAt: new Date() }
    return await new Domain(newData).save();
  }
};
