import { LogQueryStatuses } from '../../interfaces/analytics/logquery';
import { BaseError } from '../BaseError';

export class QueryNotFoundException extends BaseError {
	constructor(message: string) {
		super('Query Not Found Exception', LogQueryStatuses.NotFound, 404, message);
	}
}
