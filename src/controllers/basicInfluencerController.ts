import { Request, Response } from 'express';
import _ from 'lodash';
import { basicInfluencerAnalytics} from '../apps/basicInfluencerApplication';
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
import { getBasicInfluencerJobById } from '../queues/basicInfluencerQueue';
import { validateKeywordInput } from '../library/common';




export const basicInfluencerController = async (req: Request, res: Response<ApiResponse>) => {
	let query: string = req.query.keyword?.toString() || '';
	if (!query) return res.status(400).json({ error: { 	code: 'bad-request',message: 'query is required on query string' }, message: 'Error' });
	query = _.toLower(query);

	let isValidated: boolean = validateKeywordInput(query);
	if (!isValidated) return res.status(400).json({ error: { code: 'bad-request',message: 'keyword must be not a social media account' }, message: 'Error' });

	const email: string = req.query.email?.toString() || '';

	if (email) {
		const logQuery = await getUserLogQuery(email, query, LogQueryModes.BasicInfluencer);
		if (logQuery && onProcessLogQueryStatuses.includes(logQuery.status)) {
			const job = await getBasicInfluencerJobById(query);
			if (job && ((await job.isWaiting()) || (await job.isActive()))) {
				return res.status(202).json({ message: 'queuing' });
			}
		} else if (logQuery && failedLogQueryStatuses.includes(logQuery.status)) {
			throw getErrorLogQueryInstance(logQuery.status);
		}

		await newLogQuery(email, query, LogQueryModes.BasicInfluencer);
	}
	const result = await basicInfluencerAnalytics(query);
	if (result) {
		await finishLogQuery(query, LogQueryModes.BasicInfluencer);
		return res.json({ message: 'success', data: result });
	}

	return res.status(202).json({ message: 'queuing' });
};

