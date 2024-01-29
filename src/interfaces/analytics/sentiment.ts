export type BasicSentimentAnalytic = {
	keyword: string;
	sentiment: NewsSentimentData[];
	keyMetrics: SentimentMetric
	chartData: SentimentChartData;
	createdAt: number;
	updatedAt: number;
};

export type SentimentMetric = {
	totalCount: SentimentCalc;
	totalPercentage: SentimentCalc;
};

export type SentimentChartData = {
	sentimentByDate: GrouppedByDate[];
};

export type NewsSentimentData = {
	link: string;
	siteName: string;
	source: string;
	title: string;
	sentiment: string;
	datetime: Date;
	logoUrl: string;
};



export type SentimentCalc = {
	positive: number;
	negative: number;
	neutral: number
}

export type GrouppedByDate = {
    date: Date;
	positive: number;
	negative: number;
	neutral: number
}