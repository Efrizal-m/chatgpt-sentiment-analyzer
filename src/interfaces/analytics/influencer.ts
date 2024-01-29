export type BasicInfluencerAnalytic = {
	keyword: string;
	influencer: NewsInfluencerData[];
	topContributor: NewsInfluencerData;
	createdAt: number;
	updatedAt: number;
};

export type NewsInfluencerData = {
	site: string;
	logo: string;
	mention: number;
};

export type GrouppedByDate = {
    date: Date;
	positive: number;
	negative: number;
	neutral: number
}