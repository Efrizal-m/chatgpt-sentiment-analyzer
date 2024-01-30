import { Request, Response } from 'express';
import { BasicSentiment } from '../models/BasicSentiment';
	
export const cachedBasicSentimentQueryController = async (req: Request, res: Response) => {
	const query = req.params.query
	const report = await BasicSentiment.findOne({ keyword: query });
	return res.json({ message: 'success', data: report ?? null });
};

