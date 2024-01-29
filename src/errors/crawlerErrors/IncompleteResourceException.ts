import { LogQueryStatuses } from '../../interfaces/analytics/logquery';
import { BaseError } from '../BaseError';

export class IncompleteResourceDataException extends BaseError {
	constructor(message: string) {
		super('Incomplete Resource Data Exception', LogQueryStatuses.IncompleteResource, 500, message);
	}
}
