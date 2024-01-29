import { Request, Response } from 'express';
import _ from 'lodash';
import { basicSentimentAnalytics} from '../apps/basicSentimentApplication';
import { LogQueryModes } from '../interfaces/analytics/logquery';
import { ApiResponse } from '../interfaces/apiResponse';
import {
	failedLogQueryStatuses,
	finishLogQuery,
	getErrorLogQueryInstance,
	getUserLogQuery,
	newLogQuery,
	onProcessLogQueryStatuses,
} from '../services/logQuery';
import { getBasicSentimentJobById } from '../queues/basicSentimentQueue';
import { validateKeywordInput } from '../library/common';

export const basicSentimentController = async (req: Request, res: Response<ApiResponse>) => {
	let query: string = req.query.keyword?.toString() || '';
	if (!query) return res.status(400).json({ error: { 	code: 'bad-request',message: 'query is required on query string' }, message: 'Error' });
	query = _.toLower(query);

	let isValidated: boolean = validateKeywordInput(query);
	if (!isValidated) return res.status(400).json({ error: { code: 'bad-request',message: 'keyword must be not a social media account' }, message: 'Error' });

	const email: string = req.query.email?.toString() || '';

	if (email) {
		const logQuery = await getUserLogQuery(email, query, LogQueryModes.BasicSentiment);
		if (logQuery && onProcessLogQueryStatuses.includes(logQuery.status)) {
			const job = await getBasicSentimentJobById(query);
			if (job && ((await job.isWaiting()) || (await job.isActive()))) {
				return res.status(202).json({ message: 'queuing' });
			}
		} else if (logQuery && failedLogQueryStatuses.includes(logQuery.status)) {
			throw getErrorLogQueryInstance(logQuery.status);
		}

		await newLogQuery(email, query, LogQueryModes.BasicSentiment);
	}

	const result = await basicSentimentAnalytics(query);
	if (result) {
		await finishLogQuery(query, LogQueryModes.BasicSentiment);
		return res.json({ message: 'success', data: result });
	}

	return res.status(202).json({ message: 'queuing' });
};
