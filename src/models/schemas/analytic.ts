import { Schema } from 'mongoose';
import { News } from '../../interfaces/news';
import { NewsInfluencerData } from '../../interfaces/analytics/influencer';
import { NewsSentimentData, SentimentChartData, SentimentMetric } from '../../interfaces/analytics/sentiment';
import { chartPerDatesSchema } from './mics';


export const rawNewsInfluencerSchema = new Schema<NewsInfluencerData>(
	{
		site: { type: String, required: true },
		logo: { type: String },
		mention: { type: Number }
	},
	{ _id: false }
);

export const rawNewsSentimentSchema = new Schema<NewsSentimentData>(
	{
		link: { type: String, required: true },
		siteName: { type: String },
		source: { type: String, required: true },
		title: { type: String },
		sentiment: { type: String },
		datetime: { type: Date },
		logoUrl: { type: String }
	},
	{ _id: false }
);

export const chartDataSchema = new Schema<SentimentChartData>(
	{
		sentimentByDate: { type: [chartPerDatesSchema], required: true },
	},
	{ _id: false }
);

export const keyMetricsSchema = new Schema<SentimentMetric>(
	{
		totalCount: { type: Object, required: true },
		totalPercentage: { type: Object, required: true },
	},
	{ _id: false }
);