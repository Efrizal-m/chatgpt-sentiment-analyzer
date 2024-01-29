import { model, Schema } from 'mongoose';
import { News } from '../interfaces/news';

export default model<News>(
	'News',
	new Schema({
		keyword: { type: String, required: true },		
		link: { type: String, required: true },
		source: { type: String, required: true },
		title: { type: String },
		sentiment: { type: String },
		image: { type: String },
		datetime: { type: Date },
		article: { type: String },
		createdAt: { type: Date },
		updatedAt: { type: Date }
	}),
	'newsFeed'
);
