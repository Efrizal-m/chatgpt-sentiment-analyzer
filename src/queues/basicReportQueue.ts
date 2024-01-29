import { captureException } from '@sentry/node';
import Queue, { Job } from 'bull';
import { crawlBasicInfluencer} from '../apps/basicInfluencerApplication';
import { appConfig } from '../configs/app.config';
import { LogQueryModes } from '../interfaces/analytics/logquery';
import Logger from '../library/logger/Logger';
import { finishLogQuery, queueLogQuery } from '../services/logQuery';
import { TriggerMeta, triggerBasicReport } from '../services/socketTriggerer';
import { crawlBasicSentiment } from '../apps/basicSentimentApplication';

import { BadGatewayException } from '../errors/llmErrors/BadGatewayException';
import { QueryZeroResultException } from '../errors/crawlerErrors/QueryZeroResultException';
import { QueryNotFoundException } from '../errors/crawlerErrors/QueryNotFoundException';
import { IncompleteResourceDataException } from '../errors/crawlerErrors/IncompleteResourceException';

export type BasicReportJobData = {
	query: string;
};
const name = appConfig.queue.basicReport || 'basicReport';

export const createBasicReportQueueInstance = () => {
	return new Queue<BasicReportJobData>(name, { redis: appConfig.queue.redis });
};

export const initBasicReportQueue = () => {
	const queue = createBasicReportQueueInstance();
	
	queue.process(async (job: Job<BasicReportJobData>) => {
		const mode: string = 'basic-report'
		await crawlBasicInfluencer(job.data.query, mode);
		await crawlBasicSentiment(job.data.query, mode)
	});

	queue.on('active', async (job: Job<BasicReportJobData>) => {
		Logger.info('queue active', job.data.query);
	});

	queue.on('completed', async (job: Job<BasicReportJobData>) => {
		Logger.info('queue completed', job.data.query);
		await finishLogQuery(job.data.query, LogQueryModes.BasicReport);
		await triggerBasicReport(job.data.query);
		await job.remove();
	});

	queue.on('failed', async (job: Job<BasicReportJobData>, error) => {
		Logger.warn('queue failed', job.data.query, error);

		let triggerMeta = TriggerMeta.UndefinedError;
		if (error instanceof QueryZeroResultException) {
			triggerMeta = TriggerMeta.ZeroResult;
		} else if (error instanceof QueryNotFoundException) {
			triggerMeta = TriggerMeta.NotFound;
		} else if (error instanceof IncompleteResourceDataException) {
			triggerMeta = TriggerMeta.IncompleteResource;
		} else if (error instanceof BadGatewayException) {
			triggerMeta = TriggerMeta.BadGateway;
		}

		await triggerBasicReport(job.data.query, triggerMeta);
		await job.remove();
	});

	queue.on('error', (error) => {
		Logger.err('error occur on queue worker!', error);
		captureException(error);
	});

	Logger.info('basic report queue initialized');
};

export const resetBasicReportQueue = async () => {
	if (!appConfig.queue.resetOnInit) return;

	const queue = createBasicReportQueueInstance();
	await queue.removeJobs('*');
	Logger.info('basic report queue reset');
};

export const addBasicReportQueue = async (data: BasicReportJobData) => {
	Logger.info('adding queue', data.query);
	const queue = createBasicReportQueueInstance();
	const job = await queue.add(data, { jobId: data.query });
	if (await job.isFailed()) await job.retry();

	await queueLogQuery(data.query, LogQueryModes.BasicReport);
};

export const getBasicReportJobById = async (jobId: string) => {
	const queue = createBasicReportQueueInstance();
	return await queue.getJob(jobId);
};
