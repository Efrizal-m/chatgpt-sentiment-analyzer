import { captureException } from '@sentry/node';
import Queue, { Job } from 'bull';
import { crawlBasicInfluencer} from '../apps/basicInfluencerApplication';
import { appConfig } from '../configs/app.config';
import { LogQueryModes } from '../interfaces/analytics/logquery';
import Logger from '../library/logger/Logger';
import { finishLogQuery, queueLogQuery } from '../services/logQuery';
import { TriggerMeta, triggerBasicInfluencer } from '../services/socketTriggerer';
import { QueryNotFoundException } from '../errors/crawlerErrors/QueryNotFoundException';
import { QueryZeroResultException } from '../errors/crawlerErrors/QueryZeroResultException';
import { IncompleteResourceDataException } from '../errors/crawlerErrors/IncompleteResourceException';

export type BasicInfluencerJobData = {
	query: string;
};
const name = appConfig.queue.basicInfluencer || 'basicInfluencer';

export const createBasicInfluencerQueueInstance = () => {
	return new Queue<BasicInfluencerJobData>(name, { redis: appConfig.queue.redis });
};

export const initBasicInfluencerQueue = () => {
	const queue = createBasicInfluencerQueueInstance();
	
	queue.process(async (job: Job<BasicInfluencerJobData>) => {
		const mode: string = 'basic-influencer'
		return await crawlBasicInfluencer(job.data.query, mode);
	});

	queue.on('active', async (job: Job<BasicInfluencerJobData>) => {
		Logger.info('queue active', job.data.query);
	});

	queue.on('completed', async (job: Job<BasicInfluencerJobData>) => {
		Logger.info('queue completed', job.data.query);
		await finishLogQuery(job.data.query, LogQueryModes.BasicInfluencer);
		await triggerBasicInfluencer(job.data.query);
		await job.remove();
	});

	queue.on('failed', async (job: Job<BasicInfluencerJobData>, error) => {
		Logger.warn('queue failed', job.data.query, error);

		let triggerMeta = TriggerMeta.UndefinedError;
		if (error instanceof QueryZeroResultException) {
			triggerMeta = TriggerMeta.ZeroResult;
		} else if (error instanceof QueryNotFoundException) {
			triggerMeta = TriggerMeta.NotFound;
		} else if (error instanceof IncompleteResourceDataException) {
			triggerMeta = TriggerMeta.IncompleteResource;
		}


		await triggerBasicInfluencer(job.data.query, triggerMeta);
		await job.remove();
	});

	queue.on('error', (error) => {
		Logger.err('error occur on queue worker!', error);
		captureException(error);
	});

	Logger.info('basic influencer queue initialized');
};

export const resetBasicInfluencerQueue = async () => {
	if (!appConfig.queue.resetOnInit) return;

	const queue = createBasicInfluencerQueueInstance();
	await queue.removeJobs('*');
	Logger.info('basic influencer queue reset');
};

export const addBasicInfluencerQueue = async (data: BasicInfluencerJobData) => {
	Logger.info('adding queue', data.query);
	const queue = createBasicInfluencerQueueInstance();
	const job = await queue.add(data, { jobId: data.query });
	if (await job.isFailed()) await job.retry();

	await queueLogQuery(data.query, LogQueryModes.BasicInfluencer);
};

export const getBasicInfluencerJobById = async (jobId: string) => {
	const queue = createBasicInfluencerQueueInstance();
	return await queue.getJob(jobId);
};
