import { NextFunction, Request, Response, Router } from 'express';
import { basicInfluencerController } from './controllers/basicInfluencerController';
import { basicSentimentController } from './controllers/basicSentimentController';
import { cachedBasicInfluencerQueryController, cachedBasicReportQueryController, cachedBasicSentimentQueryController } from './controllers/cachedReportController';
import { basicReportController } from './controllers/basicReportController';

const asyncHandler = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
	return Promise.resolve(fn(req, res)).catch(next);
};

export const initBasicReportRoutes = () => {
	const router = Router();
	router.get('/report/basic', asyncHandler(basicReportController));
	return router;
};

export const initBasicInfluencerRoutes = () => {
	const router = Router();
	router.get('/influencer/basic', asyncHandler(basicInfluencerController));
	return router;
};

export const initBasicSentimentRoutes = () => {
	const router = Router();
	router.get('/sentiment/basic', asyncHandler(basicSentimentController));
	return router;
};


export const initCachedReportRoutes = () => {
	const router = Router();
	router.get('/cached/basic-influencer/:query', asyncHandler(cachedBasicInfluencerQueryController));
	router.get('/cached/basic-sentiment/:query', asyncHandler(cachedBasicSentimentQueryController));
	router.get('/cached/basic-report/:query', asyncHandler(cachedBasicReportQueryController));
	return router;
};