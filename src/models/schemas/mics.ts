import { Schema } from 'mongoose';
import { GrouppedByDate } from '../../interfaces/analytics/influencer';

export const chartPerDatesSchema = new Schema<GrouppedByDate>({
	date: { type: Date, required: true },
	positive: { type: Number, required: true },
	negative: { type: Number, required: true },
	neutral: { type: Number, required: true },
}, { _id: false });
