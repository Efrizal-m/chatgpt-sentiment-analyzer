import mongoose from 'mongoose';
import { BasicInfluencerAnalytic } from '../interfaces/analytics/influencer';
import { rawNewsInfluencerSchema } from './schemas/analytic';

export const BasicInfluencer = mongoose.model<BasicInfluencerAnalytic>(
	'NewsBasicInfluencer',
	new mongoose.Schema({
		keyword: { type: String, required: true },
		influencer: { type: [rawNewsInfluencerSchema], required: true },
		topContributor: { type: rawNewsInfluencerSchema, required:true },
		createdAt: { type: Number, require: true },
		updatedAt: { type: Number, require: true },
	}),
	'newsBasicInfluencer'
);
