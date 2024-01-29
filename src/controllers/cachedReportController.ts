import { Request, Response } from 'express';
import { BasicInfluencer } from '../models/BasicInfluencer';
import { BasicSentiment } from '../models/BasicSentiment';
	
export const cachedBasicInfluencerQueryController = async (req: Request, res: Response) => {
	const query = req.params.query
	const report = await BasicInfluencer.findOne({ keyword: query });
	return res.json({ message: 'success', data: report ?? null });
};

export const cachedBasicSentimentQueryController = async (req: Request, res: Response) => {
	const query = req.params.query
	const report = await BasicSentiment.findOne({ keyword: query });
	return res.json({ message: 'success', data: report ?? null });
};

export const cachedBasicReportQueryController = async (req: Request, res: Response) => {
	const query = req.params.query
	const influencerReport = await BasicInfluencer.findOne({ keyword: query });
	const sentimentReport = await BasicSentiment.findOne({ keyword: query });
	const report = {
		keyword: query,
		influencer: influencerReport?.influencer,
		topContributor: influencerReport?.topContributor,
		sentiment: sentimentReport?.sentiment,
		keyMetrics: sentimentReport?.keyMetrics,
		chartData: sentimentReport?.chartData
	}

	return res.json({ message: 'success', data: report ?? null });
};