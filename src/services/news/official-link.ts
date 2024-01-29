import { Page, BrowserContext } from 'playwright';
import { getBrowserContext } from '../playwright';
import { appConfig } from '../../configs/app.config';

export async function findOfficialWebsite(query: string): Promise<string | null> {
    try {
        let context: BrowserContext = await getBrowserContext()
        const page: Page = await context.newPage();

        // Navigate to Google and perform the search
        await page.goto(`https://www.google.com/search?q=${query} official website`);
        const searchResults = await page.evaluate(() => {
          const results: any = [];
      
          const links = document.querySelectorAll('.yuRUbf a');
          links.forEach((link:any) => {
            results.push({
              title: link.textContent,
              url: link.href,
            });
          });
      
          return results;
        });
        return searchResults[0].url
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

export async function crawlSocialMediaLinks(url: string): Promise<{ instagram: string | null, tiktok: string | null, twitter: string | null, facebook: string | null }> {
    try {
        let context: BrowserContext = await getBrowserContext()
        const page: Page = await context.newPage();
  
        // Navigate to the website
        const timeout = appConfig.crawler.timeout;
        await Promise.race([
            page.goto(url, { waitUntil: 'domcontentloaded' }),
            page.waitForTimeout(timeout) // Wait for the specified timeout
        ]);

  
        // Get all links on the page
        const links = await page.$$eval('a', (elements) => elements.map((element) => element.href));
  
        // Initialize social media links as null
        let instagramLink: string | null = null;
        let tiktokLink: string | null = null;
        let twitterLink: string | null = null;
        let facebookLink: string | null = null;
  
        // Search for social media links in the extracted links
        for (const link of links) {
            if (link.includes('instagram.com')) {
                instagramLink = link;
            } else if (link.includes('tiktok.com')) {
                tiktokLink = link;
            } else if (link.includes('twitter.com')) {
                twitterLink = link;
            } else if (link.includes('facebook.com')) {
                facebookLink = link;
            }
        }
  
        return { instagram: instagramLink, tiktok: tiktokLink, twitter: twitterLink, facebook: facebookLink };
    } catch (error) {
        console.error('Error:', error);
        return { instagram: null, tiktok: null, twitter: null, facebook: null };
    }
  }
