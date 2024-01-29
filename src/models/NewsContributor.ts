import { model, Schema } from 'mongoose';
import { NewsContributor } from '../interfaces/newsContributor';

export default model<NewsContributor>(
	'NewsContributor',
	new Schema({
		keyword: { type: String, required: true },
		source: { type: String, required: true },
		urls: { type: [String] },
		createdAt: { type: Date },
		updatedAt: { type: Date },
	}),
	'newsContributor'
);
