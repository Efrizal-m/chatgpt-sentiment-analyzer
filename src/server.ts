import { Router } from 'express';
import { initApp } from './app';
import { appConfig } from './configs/app.config';
import Logger from './library/logger/Logger';
import { initBasicInfluencerQueue, resetBasicInfluencerQueue } from './queues/basicInfluencerQueue';
import {
	initBasicReportRoutes,
	initBasicInfluencerRoutes,
	initBasicSentimentRoutes,
	initCachedReportRoutes,
} from './routes';
import { initDatabase } from './services/database';
import { initBasicSentimentQueue, resetBasicSentimentQueue } from './queues/basicSentimentQueue';
import { initBasicReportQueue, resetBasicReportQueue } from './queues/basicReportQueue';

const initServer = async () => {
	const { workers, endpoints } = appConfig;
	const routers: Router[] = [];

	if (workers.includes('basic-report')) {
		routers.push(initBasicReportRoutes());
		initBasicReportQueue();
		resetBasicReportQueue();
	}

	if (workers.includes('basic-sentiment')) {
		routers.push(initBasicSentimentRoutes());
		initBasicSentimentQueue();
		resetBasicSentimentQueue();
	}

	if (workers.includes('basic-influencer')) {
		routers.push(initBasicInfluencerRoutes());
		initBasicInfluencerQueue();
		resetBasicInfluencerQueue();
	}


	routers.push(initCachedReportRoutes());

	await initDatabase();

	/** Running The App */
	const app = await initApp(routers);
	app.listen(appConfig.port, async () => {
		Logger.info(`app running on port ${appConfig.port}`);
	});
};

initServer();
