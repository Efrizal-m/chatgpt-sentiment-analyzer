import { NewsInfluencerData, GrouppedByDate } from "./influencer";
import { SentimentMetric, SentimentChartData, NewsSentimentData } from "./sentiment";

export type BasicReportAnalytic = {
	keyword: string;
	influencer: NewsInfluencerData[];
	topContributor: NewsInfluencerData;
	sentiment: NewsSentimentData[];
	keyMetrics: SentimentMetric
	chartData: SentimentChartData;
};