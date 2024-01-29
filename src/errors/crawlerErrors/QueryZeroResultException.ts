import { LogQueryStatuses } from '../../interfaces/analytics/logquery';
import { BaseError } from '../BaseError';

export class QueryZeroResultException extends BaseError {
	constructor(message = 'Given query not have any Results.') {
		super('Query Zero Result Exception', LogQueryStatuses.ZeroResult, 404, message);
	}
}
