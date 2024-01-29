import moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { appConfig } from '../configs/app.config';
import { BasicInfluencerAnalytic } from '../interfaces/analytics/influencer';
import { BasicInfluencer } from '../models/BasicInfluencer';
import { addBasicInfluencerQueue } from '../queues/basicInfluencerQueue';
// import { crawlNewsList } from '../services/news/full-keyword';
import { crawlNewsList } from '../services/news/keyword';
import { saveNews } from '../services/news/news';
import { updateErrorStatusLogQuery } from '../services/logQuery';
import { LogQueryModes } from '../interfaces/analytics/logquery';
import { BaseError } from '../errors/BaseError';
import Logger from '../library/logger/Logger';
import News from '../models/News';
import { saveBasicInfluencer } from '../services/news/influencer';
import { QueryZeroResultException } from '../errors/crawlerErrors/QueryZeroResultException';
import { IncompleteResourceDataException } from '../errors/crawlerErrors/IncompleteResourceException';
import NewsContributor from '../models/NewsContributor';
import { crawlUrlsList, saveNewsContributor } from '../services/news/keywordBySite';
import { processSiteDomain } from '../services/news/siteDomain';

export const basicInfluencerAnalytics = async (keyword: string): Promise<HydratedDocument<BasicInfluencerAnalytic> | undefined> => {
	if (appConfig.cache.analyticAge) {
		const basicInfluencerAnalytics = await BasicInfluencer.findOne({
			keyword,
			createdAt: { $gte: moment().subtract(appConfig.cache.analyticAge, 'minute').toDate() }
		});

		if (basicInfluencerAnalytics) return basicInfluencerAnalytics;
	}

	if (!appConfig.queue.basicInfluencer) {
		const mode: string = 'basic-influencer'
		return await crawlBasicInfluencer(keyword, mode)
	} else {
		await addBasicInfluencerQueue({ query: keyword });
	}
};

export const crawlBasicInfluencer = async (keyword: string, mode: string) : Promise<HydratedDocument<BasicInfluencerAnalytic> | undefined> => {
	try {
		const basicInfluencerAnalyticsData = await crawlNewsInfluencer(keyword, mode);

		const basicInfluencer = await saveBasicInfluencer(basicInfluencerAnalyticsData);
		Logger.info(`${keyword} analyzed! [mode: influencer]`);
		return basicInfluencer
	} catch (error) {
		if (error instanceof BaseError) {
			if (mode == 'basic-report') await updateErrorStatusLogQuery(keyword, LogQueryModes.BasicReport, error.code, error.message || '-');
			else if (mode == 'basic-influencer') await updateErrorStatusLogQuery(keyword, LogQueryModes.BasicInfluencer, error.code, error.message || '-');				
		}
		throw error;
	}
};


export const crawlNewsInfluencer = async (keyword: string, mode: string) => {
	try {
		// let feeds = await News.find({
		// 	keyword,
		// 	datetime: {
		// 		$gte : new Date('2022-12-12'),
		// 		$lte : new Date('2023-02-12')
		// 	}
		// });
		let feeds = await News.find({ keyword });

		// let withInterval: boolean = true;
		let withInterval: boolean = false;
		if (feeds.length  <= 0) {
			const newsfeed = await crawlNewsList(keyword, mode)

			if (newsfeed.data.length <= 0) {
				throw new QueryZeroResultException();
			} else {
				withInterval = newsfeed.interval
				await saveNews(newsfeed.data);
				feeds = await News.find({ keyword });
			}
		}

		const basicInfluencerAnalyticsNews = await processInfluencer(keyword, feeds, withInterval)

		return {
			keyword,
			influencer: basicInfluencerAnalyticsNews.influencer || [],
			topContributor: basicInfluencerAnalyticsNews.influencer.sort((a:any, b:any) => b.mention - a.mention).slice(0,1)[0] || {},
			createdAt: Date.now(),
			updatedAt: Date.now()
		}

	} catch (error) {
		throw error;
	}
};

export const processInfluencer = async (keyword: string, feeds: any[], interval: boolean) => {
	try {
		let count = 0
		let basicInfluencerArray:any = []

		let newsContributors = [...new Map(feeds.map((f) => [f.source, f])).values()];

		Logger.info(`processing ${keyword} from any source`);
		for await (const website of newsContributors) {
			if (website.source) {
				let contributorData = await NewsContributor.findOne({
					keyword: keyword,
					source: website.source,
					// updatedAt: { $gte: moment().subtract(appConfig.cache.analyticAge, 'minute').toDate() }
				});
		
				if (contributorData && contributorData. urls && contributorData.urls.length > 0) {
					count = contributorData.urls.length
					basicInfluencerArray.push({
						site: website.source,
						logo: website.logo,
						mention: count
					})	
				} else {
					let contributorUrls = await crawlUrlsList(keyword, website.source, interval)
					if (contributorUrls && contributorUrls.length > 0) {
						await saveNewsContributor(keyword, website.source, contributorUrls)
						count = contributorUrls.length
					}
					await processSiteDomain(website.source)

					basicInfluencerArray.push({
						site: website.source,
						mention: count
					})
				}
				
				if (count > 0) Logger.info(`${website.source} analyzed | status: counted`);					
				else Logger.info(`${website.source} analyzed | status: uncounted`);
			}
		}

		let basicInfluencerArrayFiltered: any[] = [];
		basicInfluencerArray.forEach((inf: any) => { if (inf.mention > 0) {
				basicInfluencerArrayFiltered.push(inf)
			}
		});

		if (basicInfluencerArrayFiltered.length <= 0) {
			throw new IncompleteResourceDataException('Insufficient Resource Data To Analyze')
		}

		return {
			keyword,
			influencer: basicInfluencerArrayFiltered,
		}

	} catch (error) {
		throw error;
	}
};