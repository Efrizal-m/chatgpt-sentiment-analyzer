import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import express, { Express, NextFunction, Request, Response, Router } from 'express';
import cors, { CorsOptions } from 'cors';
import 'ejs';
import { ZodError } from 'zod';
import { appConfig } from './configs/app.config';
import { BaseError } from './errors/BaseError';
import { ApiResponse } from './interfaces/apiResponse';
import Logger from './library/logger/Logger';
import { TriggerMeta } from './services/socketTriggerer';
import { startScheduler } from './scheduler/cron-job';

export const initApp = async (routers: Router[] = []) => {
	const app: Express = express();

	Sentry.init({
		dsn: appConfig.sentry.dsn,
		integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
		tracesSampleRate: 1.0,
		environment: appConfig.environment,
	});

	/** Middlewares */
	app.use(Sentry.Handlers.requestHandler());
	app.use(Sentry.Handlers.tracingHandler());
	  
	app.use(cors());
	  
	app.use(express.json());

	app.set('view engine', 'ejs');

	app.use((req: Request, res: Response, next: NextFunction) => {
		Logger.info('request', req.url, 'from', req.headers['x-forwarded-for'] || req.socket.remoteAddress);
		next();
	});

	/** Routes */
	app.get('/', (req: Request, res: Response) => res.json({ message: 'social-listening' }));
	app.use(...routers);

	/** Error Handlers */
	app.use(Sentry.Handlers.errorHandler());

	app.use((req: Request, res: Response<ApiResponse>, next: NextFunction) => {
		const error = new Error('not found');
		return res.status(404).json({ message: error.message });
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	app.use((error: any, req: Request, res: Response<ApiResponse>, next: NextFunction) => {
		if (error instanceof ZodError) {
			Logger.warn('Zod Validation Error', error);
			Sentry.captureException(error, (scope) => {
				scope.setContext('Zod Error Details', { ...error });
				return scope;
			});
			return res.status(422).json({
				message: 'Zod Validation Error',
				error: {
					message: error.message,
					code: TriggerMeta.UnprocessableEntity,
					details: appConfig.debug ? error.errors : error.flatten(),
					stack: appConfig.debug && error.stack ? error.stack.split('\n]\n    ')[1].split('\n    ') : undefined,
				},
			});
		} else if (error instanceof BaseError) {
			Logger.warn(error);
			if (['undefined-error', 'internal-error'].includes(error.code)) {
				Sentry.captureException(error, (scope) => {
					scope.setContext('Base Error Details', { ...error });
					return scope;
				});
			}
			return res.status(error.statusCode).json({
				message: error.name,
				error: {
					message: error.message,
					code: error.code,
					stack: appConfig.debug ? error.stack?.split('\n    ') : undefined,
				},
			});
		} else if (error instanceof Error) {
			Logger.err(error);
			Sentry.captureException(error);
			return res.status(500).json({
				message: error.name,
				error: {
					message: error.message,
					code: 'internal-error',
					stack: appConfig.debug ? error.stack?.split('\n    ') : undefined,
				},
			});
		} else {
			Logger.err('Unknwon Error!', error);
			return res.status(500).json({
				message: 'Unknwon Error',
				error: {
					message: 'Unknown Error',
					code: 'unknown-error',
					details: appConfig.debug ? error : undefined,
					stack: appConfig.debug ? error.stack?.split('\n    ') : undefined,
				},
			});
		}
	});

	//scheduler
	if (appConfig.scheduler.enabled) {
		startScheduler();
	}

	return app;
};
