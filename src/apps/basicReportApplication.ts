import moment from 'moment';
import { appConfig } from '../configs/app.config';
import { BasicInfluencer } from '../models/BasicInfluencer';
import { BasicSentiment } from '../models/BasicSentiment';
import { crawlBasicSentiment } from './basicSentimentApplication';
import { BasicReportAnalytic } from '../interfaces/analytics/basic';
import { addBasicReportQueue } from '../queues/basicReportQueue';
import { crawlBasicInfluencer } from './basicInfluencerApplication';

export const basicReportAnalytics = async (keyword: string): Promise<BasicReportAnalytic | undefined> => {
	if (appConfig.cache.analyticAge) {
		const basicInfluencerAnalytics = await BasicInfluencer.findOne({
			keyword,
			createdAt: { $gte: moment().subtract(appConfig.cache.analyticAge, 'minute').toDate() }
		});
		const basicSentimentAnalytics = await BasicSentiment.findOne({
			keyword,
			createdAt: { $gte: moment().subtract(appConfig.cache.analyticAge, 'minute').toDate() }
		});

			
		if (basicInfluencerAnalytics && basicSentimentAnalytics) {
			return {
				keyword: keyword,
				influencer: basicInfluencerAnalytics.influencer,
				topContributor: basicInfluencerAnalytics.topContributor,
				sentiment: basicSentimentAnalytics.sentiment,
				keyMetrics: basicSentimentAnalytics.keyMetrics,
				chartData: basicSentimentAnalytics.chartData
			}
		};
	}

	if (!appConfig.queue.basicReport) {
		const mode: string = 'basic-report'
		const influencerResult = await crawlBasicInfluencer(keyword, mode)
		const sentimentResult = await crawlBasicSentiment(keyword, mode)

		if (influencerResult && sentimentResult) {			
			return {
				keyword: keyword,
				influencer: influencerResult.influencer,
				topContributor: influencerResult.topContributor,
				sentiment: sentimentResult.sentiment,
				keyMetrics: sentimentResult.keyMetrics,
				chartData: sentimentResult.chartData
			}
		}
	} else {
		await addBasicReportQueue({ query: keyword });
	}
};

export const basicReportAnalyticsRefresh = async (keyword: string): Promise<BasicReportAnalytic | undefined> => {
	const basicInfluencerAnalytics = await BasicInfluencer.findOne({keyword});
	const basicSentimentAnalytics = await BasicSentiment.findOne({keyword});

	if (basicInfluencerAnalytics && basicSentimentAnalytics) {
		return {
			keyword: keyword,
			influencer: basicInfluencerAnalytics.influencer,
			topContributor: basicInfluencerAnalytics.topContributor,
			sentiment: basicSentimentAnalytics.sentiment,
			keyMetrics: basicSentimentAnalytics.keyMetrics,
			chartData: basicSentimentAnalytics.chartData
		}
	};
};