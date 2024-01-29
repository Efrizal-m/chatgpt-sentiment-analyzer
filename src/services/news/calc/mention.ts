import playwright, { BrowserContext, Page } from 'playwright';
import { getBrowserContext } from '../../playwright';
import { appConfig } from '../../../configs/app.config';

export function countOccurrencesByTittle(arr: string[], word: string): number {
    let count = 0;
  
    for (const str of arr) {
      // Convert both the string and word to lowercase to perform case-insensitive matching
      const lowerCaseStr = str.toLowerCase();
      const lowerCaseWord = word.toLowerCase();
  
      // Use regular expression to find all occurrences of the word in the string
      const regex = new RegExp(`\\b${lowerCaseWord}\\b`, 'g');
      const occurrences = lowerCaseStr.match(regex);
  
      if (occurrences) {
        count += occurrences.length;
      }
    }
  
    return count;
}


export async function countOccurrencesByArticle(arr: string[], word: string): Promise<number | null | any> {
  try {
    let context: BrowserContext = await getBrowserContext()
    let count = 0;
  
    for await (const link of arr) {
      const page: Page = await context.newPage();
      const timeout = appConfig.crawler.timeout;

      try {
        await Promise.race([
          page.goto(link, { waitUntil: 'domcontentloaded', timeout: timeout }),
          page.waitForTimeout(timeout) // Wait for the specified timeout
        ]);
        // console.log('page opened')

        // let articles = await getArticleContent(news.link, page)
        // news.article = extractMainArticle(articles);

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Logger.info(`handling news[${idx}] from ${news.link.slice(0, 20)}...`)
      } catch (error) {
        if (error instanceof playwright.errors.TimeoutError) {
          console.error('Timeout exceeded while waiting for the page to load.');
        } else {
          console.error('An error occurred:', error);
        }
      } finally {
        // idx++
        await page.close();
        // console.log('page closed')
      }



      // const lowerCaseStr = str.toLowerCase();
      // const lowerCaseWord = word.toLowerCase();
  
      // // Use regular expression to find all occurrences of the word in the string
      // const regex = new RegExp(`\\b${lowerCaseWord}\\b`, 'g');
      // const occurrences = lowerCaseStr.match(regex);
  
      // if (occurrences) {
      //   count += occurrences.length;
      // }
    }
  
    return count;
  } catch (error) {
    return error    
  }
}
