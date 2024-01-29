import { News as INews } from '../../interfaces/news';
import Logger from '../../library/logger/Logger';
import News from '../../models/News';

export const saveNews = async (news: INews[]) => {
	Logger.info(`saving ${news.length} news ...`);
	for (const feed of news) {
		const newsModel = await News.findOne({ link: feed.link });

		if (newsModel) {
			newsModel.overwrite(feed);
			await newsModel.save();
		} else {
			feed.createdAt = new Date()
			const newTweet = new News(feed);
			await newTweet.save();
		}
	}
	Logger.info(`${news.length} news saved!`);
};

export const saveOneNews = async (feed: INews, idx: number) => {
	const newsModel = await News.findOne({ link: feed.link });
	if (newsModel) {
		newsModel.overwrite(feed);
		await newsModel.save();
	} else {
		feed.createdAt = new Date()
		const newTweet = new News(feed);
		await newTweet.save();
	}
	Logger.info(`news[${idx}] saved!`);
};
