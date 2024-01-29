import mongoose from 'mongoose';
import { BasicSentimentAnalytic } from '../interfaces/analytics/sentiment';
import { chartDataSchema, keyMetricsSchema, rawNewsSentimentSchema } from './schemas/analytic';

export const BasicSentiment = mongoose.model<BasicSentimentAnalytic>(
	'NewsBasicSentiment',
	new mongoose.Schema({
		keyword: { type: String, required: true },
		sentiment: { type: [rawNewsSentimentSchema], required: true },
		keyMetrics: { type: keyMetricsSchema, required: true },
		chartData: { type: chartDataSchema, required: true  },
		createdAt: { type: Number, require: true },
		updatedAt: { type: Number, require: true },
	}),
	'newsBasicSentiment'
);
