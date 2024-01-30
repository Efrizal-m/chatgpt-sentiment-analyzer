import { Router } from 'express';
import { initApp } from './app';
import { appConfig } from './configs/app.config';
import Logger from './library/logger/Logger';
import {
	initBasicSentimentRoutes,
	initCachedReportRoutes,
} from './routes';
import { initDatabase } from './services/database';
import { initBasicSentimentQueue, resetBasicSentimentQueue } from './queues/basicSentimentQueue';

const initServer = async () => {
	const { workers, endpoints } = appConfig;
	const routers: Router[] = [];

	if (workers.includes('basic-sentiment')) {
		routers.push(initBasicSentimentRoutes());
		initBasicSentimentQueue();
		resetBasicSentimentQueue();
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
