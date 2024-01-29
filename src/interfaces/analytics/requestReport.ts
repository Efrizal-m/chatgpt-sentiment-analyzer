export type RequestReport = {
	email: string;
	ip_address: string;
	name: string;
	phone: string;
	company: string;
	country: string;
	query: string;
	mode: RequestModes;
	status: QueryStatuses;
	sent: boolean;
	createdAt: number;
	updatedAt: number;
};

export enum RequestModes {
	BasicSentiment = 'basic-sentiment',
	BasicInfluencer = 'basic-influencer',
	BasicReport = 'basic-report',
	SampleReport = 'sample-report',
}

export enum QueryStatuses {
	Processing = 'processing',
	Queuing = 'queuing',
	Inputted = 'inputted',
	Finish = 'finish',
	UndefinedError = 'undefined-error',
	NotFound = 'not-found',
	ZeroResult = 'zero-result',
	BadGateway = 'bad-gateway',
	Forbidden = 'forbidden',
	Protected = 'protected',
	Suspended = 'suspended',
	Deleted = 'deleted',
}
