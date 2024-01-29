import { Request, Response } from 'express';
import _ from 'lodash';
import { LogQueryModes, LogQueryStatuses } from '../interfaces/analytics/logquery';
import { ApiResponse } from '../interfaces/apiResponse';
import {
	failedLogQueryStatuses,
	finishLogQuery,
	getErrorLogQueryInstance,
	getUserLogQuery,
	newLogQuery,
	onProcessLogQueryStatuses,
} from '../services/logQuery';
import { getBasicReportJobById } from '../queues/basicReportQueue';
import { basicReportAnalytics, basicReportAnalyticsRefresh } from '../apps/basicReportApplication';
import { validateKeywordInput } from '../library/common';

export const basicReportController = async (req: Request, res: Response<ApiResponse>) => {
	let query: string = req.query.keyword?.toString() || '';
	let refresh: boolean = req.query.refresh === 'true' ? true: false;

	if (!query) return res.status(400).json({ error: { 	code: 'bad-request',message: 'query is required on query string' }, message: 'Error' });
	query = _.toLower(query);

	let isValidated: boolean = validateKeywordInput(query);
	if (!isValidated) return res.status(400).json({ error: { code: 'bad-request',message: 'keyword must be a valid keyword. Do not contain any social media account, url, or any special character' }, message: 'Error' });
	const email: string = req.query.email?.toString() || '';

	if (email) {
		const logQuery = await getUserLogQuery(email, query, LogQueryModes.BasicReport);
		if (refresh && logQuery && logQuery.status == LogQueryStatuses.Finish) {
			const result = await basicReportAnalyticsRefresh(query);
			if (result) {
				return res.json({ message: 'success', data: result });
			}		
		} else if (logQuery && onProcessLogQueryStatuses.includes(logQuery.status)) {
			const job = await getBasicReportJobById(query);
			if (job && ((await job.isWaiting()) || (await job.isActive()))) {
				return res.status(202).json({ message: 'queuing' });
			}
		} else if (logQuery && failedLogQueryStatuses.includes(logQuery.status)) {
			throw getErrorLogQueryInstance(logQuery.status);
		}
		await newLogQuery(email, query, LogQueryModes.BasicReport);
	}
	const result = await basicReportAnalytics(query);
	if (result) {
		await finishLogQuery(query, LogQueryModes.BasicReport);
		return res.json({ message: 'success', data: result });
	}

	return res.status(202).json({ message: 'queuing' });
};
