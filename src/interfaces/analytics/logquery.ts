export type LogQuery = {
	email: string;
	query: string;
	mode: LogQueryModes;
	status: LogQueryStatuses;
	message: string;
	createdAt: number;
	queuingAt: number;
	processingdAt: number; // TODO: need to fix this !!!
	finishedAt: number;
	updatedAt: number;
	refresh: boolean;
	redirect: boolean;
};

export enum LogQueryModes {
	BasicReport = 'basic-report',
	BasicSentiment = 'basic-sentiment',
	BasicInfluencer = 'basic-influencer',
}

export enum LogQueryStatuses {
	Processing = 'processing',
	Queuing = 'queuing',
	Inputted = 'inputted',
	Finish = 'finish',
	
	UndefinedError = 'undefined-error',
	NotFound = 'not-found',
	ZeroResult = 'zero-result',
	IncompleteResource = 'incomplete-resource',
	
	// InvalidAuth = 'invalid-auth',
	// RateLimit = 'rate-limit',
	// InsufficientQuota = 'insufficient-quota',
	BadGateway = 'bad-gateway',
	// ServiceOverloaded = 'service-overloaded',

	Forbidden = 'forbidden',
	Protected = 'protected',
	Suspended = 'suspended',
	Deleted = 'deleted',
}
