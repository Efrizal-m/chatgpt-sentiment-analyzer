import { getArticleContent,getLogoUrl, extractMainArticle, getTitleFromUrl } from './extractor';
import cheerio from "cheerio";
import playwright, { Page, BrowserContext } from 'playwright';
import { appConfig } from '../../configs/app.config';
import Logger from '../../library/logger/Logger';
import { getBrowserContext } from '../playwright';

export const crawlNewsList = async (keyword: string, mode: string) => {
	try {
		const encodedString = encodeURI(`${keyword}  when:7d`);
		// const encodedString = encodeURI(`${keyword}`);
		let withInterval: boolean = true

		let context: BrowserContext = await getBrowserContext()
		const page: Page = await context.newPage();		
		
		let params = {
			hl: appConfig.crawler.news.hl,
			gl: appConfig.crawler.news.gl,
			ceid: appConfig.crawler.news.ceid
		}
		const url: string = `http://www.news.google.com/search?q=${encodedString}&hl=${params.hl}&gl=${params.gl}&ceid=${params.ceid}`;

		let allNewsInfo: any[] = [];
		try {			
			await page.goto(url, { waitUntil: 'networkidle', timeout: appConfig.crawler.timeout });
			console.log('page google search opened')
	
			let previousHeight: number = 0;
			let scrollCount: number = 0;
			const maxScrollCount: number = appConfig.crawler.maxScroll; // Adjust as needed
	
			while (scrollCount < maxScrollCount) {
				const currentHeight: number = await page.evaluate(() => document.documentElement.scrollHeight);
				if (currentHeight > previousHeight) {
					previousHeight = currentHeight;
					await page.evaluate(() => {
						window.scrollTo(0, document.documentElement.scrollHeight);
					});
					await page.waitForTimeout(2000); // Adjust the timeout as needed
					scrollCount++;
				} else {
					break;
				}
			}
			
			const content: string = await page.content();
	
			const $ = cheerio.load(content);
			let articles = $('a[href^="./article"]').closest('div[jslog]')
	
			const urlChecklist: string[] = [];
			articles.each((index, element) => {
				const link = $(element).find('a[href^="./article"]').attr('href')?.replace('./', 'https://news.google.com/') || '';
				if (link) {
					urlChecklist.push(link);
			
					const mainArticle = {
						keyword: keyword,
						title: $(element).find('h3').text() || false,
						link: link,
						image: $(element).find('figure').find('img').attr('src') || false,
						source: '',
						datetime: new Date($(element).find('div:last-child time').attr('datetime') || ''),
						sentiment: '',
						article: '',
						updatedAt: new Date()
					};
			
					allNewsInfo.push(mainArticle);
				}	
			});	
		} catch (error) {
			if (error instanceof playwright.errors.TimeoutError) {
				console.error('Timeout exceeded while waiting for the page to load.');
			} else {
				console.error('An error occurred:', error);
			}
		} finally {
			await page.close();
			// console.log('page closed')
		}

		// let freemium = true
		// if (freemium) {
		// 	allNewsInfo = allNewsInfo.splice(0,20)	
		// }
		
		await Promise.all(allNewsInfo.map(article => {
            return fetch(article.link).then(res => res.text()).then(data => {
                const _$ = cheerio.load(data)
                article.link = _$('c-wiz a[rel=nofollow]').attr('href')
                return article
            })
		}))
		console.log(`processing ${allNewsInfo.length} news`)
		
		let idx = 1
		for await (const news of allNewsInfo) {
		    if (news.link) {
				const page = await context.newPage()
				const timeout = appConfig.crawler.timeout;

				try {
					await Promise.race([
						page.goto(news.link, { waitUntil: 'domcontentloaded' }),
						page.waitForTimeout(timeout) // Wait for the specified timeout
					]);
					// console.log('page opened')

					news.source = new URL(news.link).hostname
					let articles = await getArticleContent(news.link, page)
					news.article = extractMainArticle(articles);
			
					Logger.info(`handling news[${idx}] from ${news.link.slice(0, 20)}...`)
				} catch (error) {
					if (error instanceof playwright.errors.TimeoutError) {
						console.error('Timeout exceeded while waiting for the page to load.');
					} else {
						console.error('An error occurred:', error);
					}
				} finally {
					idx++
					await page.close();
					// console.log('page closed')
				}
		    }
		}

		let saved = 0
		allNewsInfo.map(el => { 
			if ((el.article.length > 0) && (el.source)) {
				saved++
				return el
			}
		})
		console.log(`there ${allNewsInfo.length - saved} unsaved data cause of broken data`)
		return {
			query: keyword,
			interval: withInterval,
			data: allNewsInfo
		}

	} catch (error) {
		throw error;
	}
};