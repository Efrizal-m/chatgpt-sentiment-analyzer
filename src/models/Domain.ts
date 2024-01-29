import { model, Schema } from 'mongoose';
import { Domains } from '../interfaces/domain';

export default model<Domains>(
	'Domain',
	new Schema({
		source: { type: String, required: true },
		sitemapUrls: { type: [String] },
		createdAt: { type: Date },
		updatedAt: { type: Date },
	}),
	'newsDomain'
);
