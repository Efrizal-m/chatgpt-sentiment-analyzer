import { NextFunction, Request, Response, Router } from 'express';
import { basicSentimentController } from './controllers/basicSentimentController';
import { cachedBasicSentimentQueryController } from './controllers/cachedReportController';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
	return Promise.resolve(fn(req, res)).catch(next);
};

export const initBasicSentimentRoutes = () => {
	const router = Router();
	router.get('/sentiment/basic', asyncHandler(basicSentimentController));
	return router;
};


export const initCachedReportRoutes = () => {
	const router = Router();
	router.get('/cached/basic-sentiment/:query', asyncHandler(cachedBasicSentimentQueryController));
	return router;
};