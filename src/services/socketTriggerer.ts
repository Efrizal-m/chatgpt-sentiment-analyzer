import { captureException } from '@sentry/node';
import axios, { AxiosError } from 'axios';
import Logger from '../library/logger/Logger';
import { appConfig } from '../configs/app.config';

const socketUrl = appConfig.socket.url;

export enum TriggerMeta {
	Finish = 'finish',
	NotFound = 'not-found',
	ZeroResult = 'zero-result',
	IncompleteResource = 'incomplete-resource',

	InvalidAuth = 'invalid-auth',
	RateLimit = 'rate-limit',
	InsufficientQuota = 'insufficient-quota',
	BadGateway = 'bad-gateway',
	ServiceOverloaded = 'service-overloaded',

	Forbidden = 'forbidden',
	Protected = 'protected',
	Suspended = 'suspended',
	UndefinedError = 'undefined-error',
	UnprocessableEntity = 'unprocessable-entity',
}

export const triggerBasicInfluencer = async (keyword: string, code = TriggerMeta.Finish) => {
	try {
		console.log('socket basic influencer')
		await axios.get(`${socketUrl}/trigger/news/influencer/basic`, {
			params: { keyword, code },
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
	} catch (error) {
		if (error instanceof AxiosError) Logger.warn(error.message, error.response);
		else Logger.err(error);

		captureException(error);
	}
};


export const triggerBasicSentiment = async (keyword: string, code = TriggerMeta.Finish) => {
	try {
		console.log('socket basic sentiment')
		await axios.get(`${socketUrl}/trigger/news/sentiment/basic`, {
			params: { keyword, code },
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
	} catch (error) {
		if (error instanceof AxiosError) Logger.warn(error.message, error.response);
		else Logger.err(error);

		captureException(error);
	}
};


export const triggerBasicReport = async (keyword: string, code = TriggerMeta.Finish) => {
	try {
		console.log('socket basic report')
		await axios.get(`${socketUrl}/trigger/news/report/basic`, {
			params: { keyword, code },
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
	} catch (error) {
		if (error instanceof AxiosError) Logger.warn(error.message, error.response);
		else Logger.err(error);

		captureException(error);
	}
};
