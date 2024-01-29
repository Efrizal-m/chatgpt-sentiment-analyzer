import { TriggerMeta } from '../services/socketTriggerer';
import { LogQueryStatuses } from './analytics/logquery';

export type ApiResponse<T = unknown> = {
	message: string;
	data?: T;
	error?: ApiClientError;
};

export type ApiClientError = {
	code: LogQueryStatuses | TriggerMeta | string;
	message: string;
	details?: unknown;
	stack?: string[];
};
