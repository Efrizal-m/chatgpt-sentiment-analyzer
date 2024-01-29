import moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { appConfig } from '../configs/app.config';
import { News as NewsI } from '../interfaces/news';
import { BasicSentimentAnalytic, NewsSentimentData, SentimentChartData, SentimentMetric } from '../interfaces/analytics/sentiment';
import { BasicSentiment } from '../models/BasicSentiment';
import { addBasicSentimentQueue } from '../queues/basicSentimentQueue';
// import { crawlNewsList } from '../services/news/full-keyword';
import { crawlNewsList } from '../services/news/keyword';
import { saveNews, saveOneNews } from '../services/news/news';
import { updateErrorStatusLogQuery } from '../services/logQuery';
import { LogQueryModes } from '../interfaces/analytics/logquery';
import { BaseError } from '../errors/BaseError';
import Logger from '../library/logger/Logger';
import News from '../models/News';
import { saveBasicSentiment } from '../services/news/sentiment';
import { GrouppedByDate } from '../interfaces/analytics/influencer';
import { QueryZeroResultException } from '../errors/crawlerErrors/QueryZeroResultException';
import { BadGatewayException } from '../errors/llmErrors/BadGatewayException';
import { hitOpenAI } from '../services/llm/openai';
import Site from '../models/Site';
import { processSiteDomain } from '../services/news/siteDomain';
import { IncompleteResourceDataException } from '../errors/crawlerErrors/IncompleteResourceException';

export const basicSentimentAnalytics = async (keyword: string): Promise<HydratedDocument<BasicSentimentAnalytic> | undefined> => {
	if (appConfig.cache.analyticAge) {
		const basicSentimentAnalytics = await BasicSentiment.findOne({
			keyword,
			createdAt: { $gte: moment().subtract(appConfig.cache.analyticAge, 'minute').toDate() }
		});

		if (basicSentimentAnalytics) return basicSentimentAnalytics;
	}

	if (!appConfig.queue.basicSentiment) {
		const mode: string = 'basic-sentiment'
		return await crawlBasicSentiment(keyword, mode)
	} else {
		await addBasicSentimentQueue({ query: keyword });
	}

	return await crawlBasicSentiment(keyword, 'basic-report')
};

export const crawlBasicSentiment = async (keyword: string, mode: string) : Promise<HydratedDocument<BasicSentimentAnalytic> | undefined> => {
	try {
		let basicSentimentAnalyticsData = await crawlNewsSentiment(keyword, mode);
		const basicSentiment = await saveBasicSentiment(basicSentimentAnalyticsData);
		Logger.info(`${keyword} analyzed! [mode: sentiment]`);
		return basicSentiment
	} catch (error: any) {
		if (error instanceof BaseError) {
			if (mode == 'basic-report') await updateErrorStatusLogQuery(keyword, LogQueryModes.BasicReport, error.code, error.message || '-');
			else if (mode == 'basic-sentiment') await updateErrorStatusLogQuery(keyword, LogQueryModes.BasicSentiment, error.code, error.message || '-');				
		}
		throw error;
	}
};

export const crawlNewsSentiment = async (keyword: string, mode: string) => {
	try {
		// let feeds = await News.find({
		// 	keyword,
		// 	datetime: {
		// 		$gte : new Date('2022-12-12'),
		// 		$lte : new Date('2023-02-12')
		// 	}
		// });
		let feeds = await News.find({ keyword });

		if (feeds.length <= 0) {
			const newsfeed = await crawlNewsList(keyword, mode)
			if (newsfeed.data.length <= 0) {
				throw new QueryZeroResultException();
			} else {
				await saveNews(newsfeed.data);
				feeds = await News.find({ keyword });
			}
		}

		const basicSentimentAnalyticsNews = await processSentiment(keyword, feeds)
		return {
			keyword,
			sentiment: basicSentimentAnalyticsNews.sentiment,
			keyMetrics: basicSentimentAnalyticsNews.keyMetrics,
			chartData: basicSentimentAnalyticsNews.chartData,
			createdAt: Date.now(),
			updatedAt: Date.now()
		}
	} catch (error: any) {
		throw error;
	}
};

export const processSentiment = async (keyword: string, feeds: any[]) => {
	try {
		let newsStats: SentimentMetric = {
			totalCount: { positive: 0, negative: 0, neutral: 0 },
			totalPercentage: { positive: 0, negative: 0, neutral: 0 }
		}

		const delayTime = appConfig.llm.delayTime
		try {
			let idx: number = 1
			for await (const newsData of feeds) {
				if (newsData.link && !newsData.sentiment && newsData.article) {
					if (appConfig.llm.enableSentiment) {
						let sentimentResult;
						if (newsData.article.length >= appConfig.llm.maxTextLength) {
							sentimentResult = await hitOpenAI(newsData.article.slice(0, appConfig.llm.maxTextLength))	
						} else {
							sentimentResult = await hitOpenAI(newsData.article)	
						}
						// const sentimentResult = await runOpenAI(newsData.article)
						// const sentimentResult = await runLLM(newsData.article)												
						if (sentimentResult.toLowerCase().includes('positive')) { newsData.sentiment = 'Positive' }
						else if (sentimentResult.toLowerCase().includes('negative')) { newsData.sentiment = 'Negative' }
						else if (sentimentResult.toLowerCase().includes('neutral')) { newsData.sentiment = 'Neutral' }
						else newsData.sentiment = ''						
					}
					
					await saveOneNews(newsData, idx);
					idx++

					await new Promise(resolve => setTimeout(resolve, delayTime));
				}
			}
		} catch (error: any) {
			let message: string;
			if (error.status === 400) { message = `Open AI Error: Bad Request!` }
			else if (error.status === 401) { message = `Open AI Error: Authentication Error!` }
			else if (error.status === 403) { message = `Open AI Error: Permission Denied!` }
			else if (error.status === 404) { message = `Open AI Error: Not Found!` }
			else if (error.status === 409) { message = `Open AI Error: Conflict Error!` }
			else if (error.status === 422) { message = `Open AI Error: Unprocessable Entity!` }
			else if (error.status === 429) { message = `Open AI Error: Rate Limit!` }
			else if (error.status >= 500) { message = `Open AI Error: Server Error!` }
			else { message = `Open AI Error: Open AI Undefined Error!` }
			throw new BadGatewayException(message);
		}

		// let newsFiltered: NewsI[] = await News.find({ keyword, sentiment: { $in: [ 'Positive', 'Negative', 'Neutral' ]}, datetime: {
		// 	$gte : new Date('2022-12-12'),
		// 	$lte : new Date('2023-02-12')
		// }
		// });
		let newsFiltered: NewsI[] = await News.find({ keyword });
		if (newsFiltered.length <= 0) {
			throw new IncompleteResourceDataException('Insufficient Resource Data To Analyze')
		}

		let newsUpdated: NewsSentimentData[] = []
		for await (const nf of newsFiltered) {
			let sentimentData = { link:nf.link, siteName: '', source:'', title:nf.title, sentiment:nf.sentiment, datetime:nf.datetime, logoUrl: '' }
			let siteDomain = await Site.findOne({ siteUrl: nf.source })
			if (!siteDomain) {
				let resultdomain = await processSiteDomain(nf.source)
				if (resultdomain) {
					sentimentData.source = resultdomain.domain;
					sentimentData.siteName = resultdomain.siteName;
					sentimentData.logoUrl = resultdomain.logoUrl;					
				}
			} else {
				sentimentData.source = siteDomain.domain;
				sentimentData.siteName = siteDomain.siteName;
				sentimentData.logoUrl = siteDomain.logoUrl;
			}
			newsUpdated.push(sentimentData)
		}

		let totalData: number = newsUpdated.length
		newsUpdated.forEach((nws:any) => {
			if (nws.sentiment == 'Positive') { newsStats.totalCount.positive++ }
			else if (nws.sentiment == 'Negative') { newsStats.totalCount.negative++ }
			else if (nws.sentiment == 'Neutral') { newsStats.totalCount.neutral++ }
		})

        newsStats.totalPercentage.positive = (newsStats.totalCount.positive/totalData)*100
        newsStats.totalPercentage.negative = (newsStats.totalCount.negative/totalData)*100
        newsStats.totalPercentage.neutral = (newsStats.totalCount.neutral/totalData)*100

		//================================================//

		const newsPostByDate = newsUpdated.map((x) => moment(Number(x.datetime)).format('YYYY MMM DD'))

        const uniqueDate = [...new Set([...newsPostByDate])].sort((a, b) => {
          if (new Date(a) < new Date(b)) {
            return -1;
          } else {
            return 1;
          }
        })

		let sentimentByDate: GrouppedByDate[] =[]
        uniqueDate.forEach((dt:string) => {
            let newStatsByDate: any = {
                date: new Date(dt),
                positive: 0,
                negative: 0,
                neutral: 0
            }
            newsUpdated.forEach((nw:any) => {
                if (dt == moment(Number(nw.datetime)).format('YYYY MMM DD')) {
                    if (nw.sentiment == 'Positive') newStatsByDate.positive++                        
                    else if (nw.sentiment == 'Negative') newStatsByDate.negative++
                    else if (nw.sentiment == 'Neutral') newStatsByDate.neutral++     
                }
            })

            if (dt != "Invalid date") sentimentByDate.push(newStatsByDate)
        })
		let sentimentChartData: SentimentChartData = { sentimentByDate }

		return {
			keyword,
			sentiment: newsUpdated || [],
			keyMetrics: newsStats || {},
			chartData: sentimentChartData	
		}
	} catch (error: any) {
		throw error;
	}
};
