import { LogQueryStatuses } from '../interfaces/analytics/logquery';
import { TriggerMeta } from '../services/socketTriggerer';

export class BaseError extends Error {
	constructor(public name: string, public code: LogQueryStatuses | TriggerMeta | string, public statusCode: number, description?: string) {
		super(description || name);

		Object.setPrototypeOf(this, new.target.prototype);
		Error.captureStackTrace(this);
	}
}
