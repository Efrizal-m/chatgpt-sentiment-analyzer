import moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { BasicSentimentAnalytic } from '../../interfaces/analytics/sentiment';
import { BasicSentiment } from '../../models/BasicSentiment';

export const saveBasicSentiment = async (basicSentiment: BasicSentimentAnalytic): Promise<HydratedDocument<BasicSentimentAnalytic>> => {
	const onDb = await BasicSentiment.findOne({ keyword: basicSentiment.keyword });
	if (onDb) return await onDb.overwrite(basicSentiment).save();
	else return await new BasicSentiment(basicSentiment).save();
};
