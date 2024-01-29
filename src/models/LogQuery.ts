import { model, Schema } from 'mongoose';
import { LogQuery, LogQueryModes, LogQueryStatuses } from '../interfaces/analytics/logquery';

export default model<LogQuery>(
	'LogQuery',
	new Schema({
		email: { type: String, required: true, index: true },
		query: { type: String, required: true, index: true },
		mode: { type: String, enum: LogQueryModes, required: true, index: true },
		status: { type: String, enum: LogQueryStatuses, required: true },
		message: { type: String, required: false },
		createdAt: { type: Number, require: true },
		queuingAt: { type: Number, required: false },
		processingdAt: { type: Number, required: false },
		finishedAt: { type: Number, required: false },
		updatedAt: { type: Number, require: true, index: true },
		refresh: { type: Boolean, default: false },
		redirect: { type: Boolean }
	}),
	'newsLogQuery'
);
