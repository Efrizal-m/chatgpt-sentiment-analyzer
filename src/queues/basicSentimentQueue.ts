import { captureException } from '@sentry/node';
import Queue, { Job } from 'bull';
import { crawlBasicSentiment } from '../apps/basicSentimentApplication';
import { appConfig } from '../configs/app.config';
import { LogQueryModes } from '../interfaces/analytics/logquery';
import Logger from '../library/logger/Logger';
import { finishLogQuery, queueLogQuery } from '../services/logQuery';
import { TriggerMeta, triggerBasicSentiment } from '../services/socketTriggerer';
import { BadGatewayException } from '../errors/llmErrors/BadGatewayException';

export type BasicSentimentJobData = {
	query: string;
};
const name = appConfig.queue.basicSentiment || 'basicSentiment';

export const createBasicSentimentQueueInstance = () => {
	return new Queue<BasicSentimentJobData>(name, { redis: appConfig.queue.redis });
};

export const initBasicSentimentQueue = () => {
	const queue = createBasicSentimentQueueInstance();
	
	queue.process(async (job: Job<BasicSentimentJobData>) => {
		const mode: string = 'basic-sentiment'
		return await crawlBasicSentiment(job.data.query, mode);
	});

	queue.on('active', async (job: Job<BasicSentimentJobData>) => {
		Logger.info('queue active', job.data.query);
	});

	queue.on('completed', async (job: Job<BasicSentimentJobData>) => {
		Logger.info('queue completed', job.data.query);
		await finishLogQuery(job.data.query, LogQueryModes.BasicSentiment);
		await triggerBasicSentiment(job.data.query);
		await job.remove();
	});

	queue.on('failed', async (job: Job<BasicSentimentJobData>, error) => {
		Logger.warn('queue failed', job.data.query, error);

		let triggerMeta = TriggerMeta.UndefinedError;
		if (error instanceof BadGatewayException) {
			triggerMeta = TriggerMeta.BadGateway;
		}

		await triggerBasicSentiment(job.data.query, triggerMeta);
		await job.remove();
	});

	queue.on('error', (error) => {
		Logger.err('error occur on queue worker!', error);
		captureException(error);
	});

	Logger.info('basic sentiment queue initialized');
};

export const resetBasicSentimentQueue = async () => {
	if (!appConfig.queue.resetOnInit) return;

	const queue = createBasicSentimentQueueInstance();
	await queue.removeJobs('*');
	Logger.info('basic sentiment queue reset');
};

export const addBasicSentimentQueue = async (data: BasicSentimentJobData) => {
	Logger.info('adding queue', data.query);
	const queue = createBasicSentimentQueueInstance();
	const job = await queue.add(data, { jobId: data.query });
	if (await job.isFailed()) await job.retry();

	await queueLogQuery(data.query, LogQueryModes.BasicSentiment);
};

export const getBasicSentimentJobById = async (jobId: string) => {
	const queue = createBasicSentimentQueueInstance();
	return await queue.getJob(jobId);
};
