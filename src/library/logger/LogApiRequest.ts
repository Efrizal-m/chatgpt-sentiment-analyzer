import { NextFunction, Request, Response } from 'express';
import Logger from './Logger';

export const logApiRequest = (req: Request, res: Response, next: NextFunction) => {
	Logger.info(`${req.socket.remoteAddress} requesting ${req.method} ${req.url}`);
	next();
};
