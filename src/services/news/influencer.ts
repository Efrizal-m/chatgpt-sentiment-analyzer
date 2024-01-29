import moment from 'moment';
import { HydratedDocument } from 'mongoose';
import { BasicInfluencerAnalytic } from '../../interfaces/analytics/influencer';
import { BasicInfluencer } from '../../models/BasicInfluencer';

export const saveBasicInfluencer = async (basicInfluencer: BasicInfluencerAnalytic): Promise<HydratedDocument<BasicInfluencerAnalytic>> => {
	const onDb = await BasicInfluencer.findOne({ keyword: basicInfluencer.keyword });
	if (onDb) return await onDb.overwrite(basicInfluencer).save();
	else return await new BasicInfluencer(basicInfluencer).save();
};
