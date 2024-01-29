import { InternalServerError } from '../errors/InternalServerError';
import { IncompleteResourceDataException } from '../errors/crawlerErrors/IncompleteResourceException';
import { QueryNotFoundException } from '../errors/crawlerErrors/QueryNotFoundException';
import { QueryZeroResultException } from '../errors/crawlerErrors/QueryZeroResultException';
import { BadGatewayException } from '../errors/llmErrors/BadGatewayException';
import { LogQuery as ILogQuery, LogQueryModes, LogQueryStatuses } from '../interfaces/analytics/logquery';
import LogQuery from '../models/LogQuery';
import RequestReport from '../models/RequestReport';
import { TriggerMeta } from './socketTriggerer';

export const failedLogQueryStatuses = [LogQueryStatuses.NotFound, LogQueryStatuses.BadGateway, LogQueryStatuses.IncompleteResource, LogQueryStatuses.ZeroResult, LogQueryStatuses.Forbidden, LogQueryStatuses.UndefinedError];
export const onProcessLogQueryStatuses = [LogQueryStatuses.Inputted, LogQueryStatuses.Queuing, LogQueryStatuses.Processing];

export const parseLogQueryForErrorDetail = (logQuery: ILogQuery) => {
	return { ...logQuery, _id: undefined, __v: undefined, email: undefined };
};

export const newLogQuery = async (email: string, query: string, mode: LogQueryModes, refresh = false) => {
	let logQuery = await LogQuery.findOne({ email, query, mode });
	if (!logQuery) logQuery = new LogQuery({ email, query, mode });

	logQuery.status = LogQueryStatuses.Inputted;
	logQuery.createdAt = logQuery.createdAt || new Date().getTime();
	logQuery.updatedAt = refresh ? new Date().getTime() : logQuery.updatedAt || new Date().getTime();
	logQuery.refresh = refresh;

	await logQuery.save();
};

export const getFailedLogQueryByStatus = async (mode: LogQueryModes, status: LogQueryStatuses ) => {
	let logQueries = await LogQuery.find({ mode, status });
	return logQueries
};

export const refreshLogQuery = async (email: string, query: string, mode: LogQueryModes, refresh = true) => {
	let logQuery = await LogQuery.findOne({ email, query, mode });
	if (!logQuery) logQuery = new LogQuery({ email, query, mode });
	logQuery.status = LogQueryStatuses.Inputted;
	logQuery.createdAt = logQuery.createdAt || new Date().getTime();
	logQuery.updatedAt = refresh ? new Date().getTime() : logQuery.updatedAt || new Date().getTime();
	logQuery.refresh = refresh;

	await logQuery.save();
};


export const refreshLogQueries = async (query: string, mode: LogQueryModes, refresh = true) => {
	await LogQuery.updateMany(
		{
			query,
			mode
		},
		{
			$set: {
				status: LogQueryStatuses.Inputted,
				updatedAt: new Date().getTime(),
				refresh: refresh
			},
		}
	);

	await RequestReport.updateMany(
		{
			query,
			mode
		},
		{
			$set: {
				status: LogQueryStatuses.Inputted,
				updatedAt: new Date().getTime(),
				refresh: true,
			},
		}
	);

};


export const queueLogQuery = async (query: string, mode: LogQueryModes) => {
	await LogQuery.updateMany(
		{
			query,
			mode,
			status: { $in: onProcessLogQueryStatuses },
		},
		{
			$set: {
				status: LogQueryStatuses.Queuing,
				queuingAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
			},
		}
	);
};

export const processLogQuery = async (query: string, mode: LogQueryModes) => {
	await LogQuery.updateMany(
		{
			query,
			mode,
			status: { $in: onProcessLogQueryStatuses },
		},
		{
			$set: {
				status: LogQueryStatuses.Processing,
				processingdAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
			},
		}
	);
};

export const finishLogQuery = async (query: string, mode: LogQueryModes) => {
	await LogQuery.updateMany(
		{
			query,
			mode,
			status: { $in: onProcessLogQueryStatuses },
		},
		{
			$set: {
				status: LogQueryStatuses.Finish,
				finishedAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				refresh: false,
			},
		}
	);

	await RequestReport.updateMany(
		{
			query,
			mode,
			status: { $in: onProcessLogQueryStatuses },
		},
		{
			$set: {
				status: LogQueryStatuses.Finish,
				finishedAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				refresh: false,
			},
		}
	);
};

export const updateErrorStatusLogQuery = async (query: string, mode: LogQueryModes, status: LogQueryStatuses | TriggerMeta | string, message:string) => {
	await LogQuery.updateMany(
		{
			query,
			mode,
			status: { $in: onProcessLogQueryStatuses },
		},
		{
			$set: {
				status,
				message,
				finishedAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
			},
		}
	);

	await RequestReport.updateMany(
		{
			query,
			mode,
			status: { $in: onProcessLogQueryStatuses },
		},
		{
			$set: {
				status: status,
				finishedAt: new Date().getTime(),
				updatedAt: new Date().getTime(),
				refresh: false,
			},
		}
	);
};

export const getUserLogQuery = async (email: string, query: string, mode: LogQueryModes) => {
	return await LogQuery.findOne({
		email,
		query,
		mode,
	});
};

export const getErrorLogQueryInstance = (status: LogQueryStatuses = LogQueryStatuses.UndefinedError) => {
	switch (status) {
		case LogQueryStatuses.NotFound:
			return new QueryNotFoundException('Query not found!');
		case LogQueryStatuses.ZeroResult:
			return new QueryZeroResultException();
		case LogQueryStatuses.BadGateway:
			return new BadGatewayException('Something went wrong from OpenAI API. Please try again later');
		case LogQueryStatuses.ZeroResult:
			return new IncompleteResourceDataException('Insufficient Resource Data To Analyze. Try Another Query');

		default:
			return new InternalServerError('Internal server error!');
	}
};
