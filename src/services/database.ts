import { captureException } from '@sentry/node';
import mongoose from 'mongoose';
import { appConfig } from '../configs/app.config';
import Logger from '../library/logger/Logger';

export const initDatabase = async () => {
	try {
		await mongoose.connect(appConfig.db.connection);
		Logger.info('database connected');
	} catch (error) {
		Logger.err(error);
		captureException(error);
		process.exit(1);
	}
};
