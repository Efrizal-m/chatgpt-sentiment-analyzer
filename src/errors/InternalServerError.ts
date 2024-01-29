import { BaseError } from './BaseError';

export class InternalServerError extends BaseError {
	constructor(message: string) {
		super('Internal Server Error', 'internal-error', 500, message);
	}
}
