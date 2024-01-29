import { LogQueryStatuses } from '../../interfaces/analytics/logquery';
import { BaseError } from '../BaseError';

export class BadGatewayException extends BaseError {
	constructor(message: string) {
		super('Bad Gateway Exception', LogQueryStatuses.BadGateway, 502, message);
	}
}
