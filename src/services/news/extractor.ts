import { Page } from 'playwright';
import cheerio from 'cheerio'
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { writeFileSync } from 'fs';


export async function getArticleContent(url: string, page: Page): Promise<any> {
  try {
    // Navigate to the URL
    // await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extract article content
    const articleContent: string[] = await page.evaluate(() => {
      const paragraphElements = document.querySelectorAll('p');
      const paragraphs = Array.from(paragraphElements, (element) => element.innerText);
      return paragraphs;
    });
    const longParagraphs = articleContent.filter((paragraph) => paragraph.length > 50);

    // Join the long paragraphs to form the main article text
    const mainArticle = longParagraphs.join('\n\n');

    // Print or process the article content
    // return articleContent.join('\n')
    // console.log(articleContent.join('\n')); // Combine paragraphs into one string and print
    return mainArticle
  } catch (e) {
    console.error(`Error processing URL: ${url}, ${e}`);
  // } finally {
  //   // Close the page
  //   await page.close();
  }
}

export function extractMainArticle(data: string): string {
  const lines = data.split(/\n+/); // Split the data into lines
  let mainArticle = '';

  for (const line of lines) {
    // Use regular expressions to filter out unwanted lines
    const isHeadline = /HEADLINE/.test(line);
    const isTimeInfo = /\d+\s+\w+/.test(line);
    const isSourceInfo = /(?:© \d+\. )?All Right Reserved\./.test(line);

    if (!isHeadline && !isTimeInfo && !isSourceInfo) {
      mainArticle += line.trim() + '\n'; // Concatenate the relevant lines with a newline
    }
  }

  return mainArticle.trim();
}

export async function getLogoUrl(pageUrl: string, page: Page): Promise<string> {
  try {
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);

    // // Look for the favicon link in the HTML
    const faviconUrl = $("link[rel='icon']").attr("href") || "";

    const absoluteFaviconUrl = new URL(faviconUrl, pageUrl).href;
    return absoluteFaviconUrl;
  } catch (error) {
    console.error(`Error fetching logo for ${pageUrl}:`, error);
    return "";
  // } finally {
  //   // Close the page
  //   await page.close();
  }
}

export async function getTitleFromUrl(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      const dom = new JSDOM(response.data);
      const title = dom.window.document.querySelector('title')?.textContent;
      return title || 'Title not found';
    } else {
      throw new Error('Failed to fetch URL');
    }
  } catch (error) {
    throw new Error('Error fetching URL');
  }
}

export function extractMainDomain (url: string): string | null {
  const match = url.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+)\b/);
  return match ? match[1] : null;
};

export async function getLogoDomain(url: string, domain: string): Promise<string> {
  try {
    // const response = await axios.get(url);
    // if (response.status === 200 && response.data) {
    //   const dom = new JSDOM(response.data);
    //   const title = dom.window.document.querySelector('title')?.textContent;
    //   return title || 'Title not found';
    // } else {
    //   throw new Error('Failed to fetch URL');
    // }
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });

    const tempFile = 'tmp/news/logo/' + domain.replace('.', '_');
    writeFileSync(tempFile, Buffer.from(data, 'binary'));
    return tempFile ||  ''
  } catch (error) {
    throw new Error('Error fetching URL');
  }
}
