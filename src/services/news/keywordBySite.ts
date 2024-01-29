import cheerio from "cheerio";
import axios, { AxiosResponse } from "axios";
import { appConfig } from '../../configs/app.config';
import NewsContributor from '../../models/NewsContributor';
import { HydratedDocument } from "mongoose";
import { Contributor } from "../../interfaces/analytics/contributor";

export const crawlUrlsListProcess = async (keyword: string, site: string, interval: string) => {
	let encodedString: string;
	if (interval) encodedString = encodeURI(keyword+" "+`site:${site}`)+" "+encodeURI(`when:${appConfig.crawler.news.time_interval}`);
	else encodedString = encodeURI(keyword+" "+`site:${site}`);				

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


export const crawlUrlsList = async (keyword: string, site: string, interval: boolean) => {
	try {
		let items: any;
		let $: any;

		if (interval) {
			const xmlData = await crawlUrlsListProcess(keyword, site, appConfig.crawler.news.time_interval); $ = cheerio.load(xmlData, { xmlMode: true });
			items = $('item');				
		} else {
			const xmlData = await crawlUrlsListProcess(keyword, site, ''); $ = cheerio.load(xmlData, { xmlMode: true });
			items = $('item');
		}

		let urls: any[] = [];

		items.each((index:any, element:any) => {
			const item = $(element)
			urls.push(item.find('link').text())
		});
		
		let redirectedUrls: string[] = [];
		await Promise.all(urls.map(url => {
            return fetch(url).then(res => res.text()).then(data => {
                const _$ = cheerio.load(data)
                url = _$('c-wiz a[rel=nofollow]').attr('href')
				redirectedUrls.push(url)
            })
		}))		

		return redirectedUrls;
	} catch (error) {
		throw error;
	}
};

export const saveNewsContributor = async (keyword: string, source: string, urls: string[]): Promise<HydratedDocument<Contributor>> => {
  const onDb = await NewsContributor.findOne({ keyword, source });
  if (onDb) {
    let updatedData = { keyword, source, urls, updatedAt: new Date() }
    return await onDb.overwrite(updatedData).save()
  } else {
    let newData = { keyword, source, urls, updatedAt: new Date(), createdAt: new Date() }
    return await new NewsContributor(newData).save();
  }
};