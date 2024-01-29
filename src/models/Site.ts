import { model, Schema } from 'mongoose';
import { SiteDomains } from '../interfaces/site';

export default model<SiteDomains>(
	'SiteDomain',
	new Schema({
		siteName: { type: String },
		siteUrl: { type: String, required: true },
		domain: { type: String },
		logoUrl: { type: String },
		createdAt: { type: Date },
		updatedAt: { type: Date },
	}),
	'siteDomain'
);
