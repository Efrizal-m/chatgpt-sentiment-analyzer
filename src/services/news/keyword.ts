import { getArticleContent, extractMainArticle } from './extractor';
import cheerio from "cheerio";
import axios from "axios";
import playwright, { Page, BrowserContext } from 'playwright';
import { appConfig } from '../../configs/app.config';
import Logger from '../../library/logger/Logger';
import { getBrowserContext } from '../playwright';

export const crawlNewsListProcess = async (keyword: string, interval: string, quotes: boolean) => {
	let encodedString: string;

	if (quotes) {
		if (interval) encodedString = encodeURI(keyword+" "+`"${keyword}"`+" "+encodeURI(`when:${appConfig.crawler.news.time_interval}`));
		else encodedString = encodeURI(keyword+" "+`"${keyword}"`);		
	} else {
		if (interval) encodedString = encodeURI(keyword)+" "+encodeURI(`when:${appConfig.crawler.news.time_interval}`);
		else encodedString = encodeURI(keyword);				
	}

	let params = {
		hl: appConfig.crawler.news.hl,
		gl: appConfig.crawler.news.gl,
		ceid: appConfig.crawler.news.ceid
	}

	let rssFeedUrl: string;
	if (appConfig.crawler.customSearch) rssFeedUrl = `https://www.news.google.com/rss/search?q=${encodedString}&hl=${params.hl}&gl=${params.gl}&ceid=${params.ceid}`;
	else rssFeedUrl = `https://www.news.google.com/rss/search?q=${encodedString}`;
	const response = await axios.get(rssFeedUrl);
	const xmlData = response.data;

	return xmlData
}


export const crawlNewsList = async (keyword: string, mode: string) => {
	let context: BrowserContext = await getBrowserContext()
	// console.log('browser opened')
	try {
		let items: any;
		let $: any;
		let withInterval: boolean = false

		if (appConfig.crawler.news.time_interval) {
			withInterval = true
			const xmlData = await crawlNewsListProcess(keyword, appConfig.crawler.news.time_interval, false)
			$ = cheerio.load(xmlData, { xmlMode: true });
			items = $('item');
			await new Promise(resolve => setTimeout(resolve, 5000));
		}

		if (items.length < 20) {
			const xmlData = await crawlNewsListProcess(keyword, '', false)
			$ = cheerio.load(xmlData, { xmlMode: true });
			items = $('item');
			await new Promise(resolve => setTimeout(resolve, 5000));
		}

		let allNewsInfo: any[] = [];

		let max_post_limit: number;
		if (mode == 'basic-report') max_post_limit = appConfig.analytics.basicReport.postLimit
		else if (mode == 'basic-influencer') max_post_limit = appConfig.analytics.basicInfluencer.postLimit
		else if (mode == 'basic-sentiment') max_post_limit = appConfig.analytics.basicSentiment.postLimit
		else max_post_limit = 20

		items.each((index:any, element:any) => {
			if (index < max_post_limit) {
				const item = $(element);	  
				const mainArticle = {
					keyword: keyword,
					title: item.find('title').text() || false,
					link: item.find('link').text(),
					image: false,
					source: item.find('source').attr('url'),
					datetime: new Date(item.find('pubDate').text() || ''),
					sentiment: '',
					article: '',
					updatedAt: new Date()
				};			  
				allNewsInfo.push(mainArticle);
			}
		});
		
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
				const page: Page = await context.newPage();
				const timeout = appConfig.crawler.timeout;

				try {
					await Promise.race([
						page.goto(news.link, { waitUntil: 'domcontentloaded', timeout: timeout }),
						page.waitForTimeout(timeout) // Wait for the specified timeout
					]);
					// console.log('page opened from gnews article link')

					// interact with the loaded page
					let articles = await getArticleContent(news.link, page)
					news.article = extractMainArticle(articles);
			
					await new Promise(resolve => setTimeout(resolve, 5000));
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
					// console.log('page closed from gnews article link')

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
	} finally {
		await context.close();
		// console.log('browser closed')
	}
};