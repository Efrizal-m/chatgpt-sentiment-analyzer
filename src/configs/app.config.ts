import dotenv from 'dotenv';

dotenv.config({ path: `./${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}.env` });

const enableQueue = process.env.QUEUE_ENABLED === 'true';

export const appConfig = {
	port: process.env.PORT || 3000,

	debug: process.env.DEBUG === 'true',
	environment: process.env.ENVIRONMENT || 'local',
	sentry: {
		dsn: process.env.SENTRY_DSN || '',
	},

	db: {
		connection: process.env.DB_CONNECTION || '',
	},

	workers: (process.env.WORKERS || '').split(','),
	endpoints: (process.env.ENDPOINTS || '').split(','),

	socket: {
		url: process.env.SOCKET_URL || 'http://localhost:3600',
	},

	queue: {
		redis: {
			host: process.env.REDIS_HOST || '',
			port: Number(process.env.REDIS_PORT || 0),
			username: process.env.REDIS_USERNAME || '',
			password: process.env.REDIS_PASSWORD || '',
			db: Number(process.env.REDIS_DB || 0),
		},
		bull: {
			settings: {
				lockDuration: 600000,
				lockRenewTime: 15000,
				stalledInterval: 30000,
				maxStalledCount: 0,
				guardInterval: 5000,
				retryProcessDelay: 5000,
				backoffStrategies: {},
				drainDelay: 5,
			},
		},
		resetOnInit: process.env.QUEUE_RESET_ON_INIT === 'true',

		basicReport: enableQueue ? process.env.QUEUE_BASIC_REPORT || '' : '',
		basicInfluencer: enableQueue ? process.env.QUEUE_BASIC_INFLUENCER || '' : '',
		basicSentiment: enableQueue ? process.env.QUEUE_BASIC_SENTIMENT || '' : '',
	},

	cache: {
		analyticAge: Number(process.env.CACHE_ANALYTIC_AGE_IN_MINUTES || 60),
	},

	analytics: {
		basicReport: {
			postLimit: Number(process.env.BASIC_REPORT_POST_LIMIT || 5),
		},
		basicInfluencer: {
			postLimit: Number(process.env.BASIC_INFLUENCER_POST_LIMIT || 30),
		},
		basicSentiment: {
			postLimit: Number(process.env.BASIC_SENTIMENT_POST_LIMIT || 20),
		},
		fullReport: {
			postLimit: Number(process.env.FULL_REPORT_POST_LIMIT || 90),
		},
		fullInfluencer: {
			postLimit: Number(process.env.FULL_INFLUENCER_POST_LIMIT || 90),
		},
		fullSentiment: {
			postLimit: Number(process.env.FULL_SENTIMENT_POST_LIMIT || 90),
		},
	},

	playwright: {
		headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
		enableProxy: process.env.PLAYWRIGHT_PROXY_ENABLE === 'true',
		proxy: {
			server: process.env.PLAYWRIGHT_PROXY_SERVER || '',
			username: process.env.PLAYWRIGHT_PROXY_USERNAME || '',
			password: process.env.PLAYWRIGHT_PROXY_PASSWORD || '',
		}  
	},

	api: {
		twitter: process.env.TWITTER_SL_API || '',
		instagram: process.env.INSTAGRAM_SL_API || '',
	},

	whiteList: process.env.WHITELIST?.split(',') || [],

	llm: {
		enableSentiment: process.env.LLM_ENABLED === 'true',
		openAIModel: process.env.OPEN_AI_MODEL || 'gpt-3.5-turbo',
		openAIKey: process.env.OPEN_AI_KEY || '',
		maxTextLength: Number(process.env.OPEN_AI_MAX_TEXTLENGTH || 20000),
		delayTime: Number(process.env.LLM_DELAY_TIME || 15000),
		timeout: Number(process.env.LLM_TIMEOUT || 30000)
	},

	crawler: {
		maxScroll: Number(process.env.CRAWLER_MAX_SCROLL || 2),
		timeout: Number(process.env.CRAWLER_TIMEOUT || 15000),
		customSearch: process.env.IS_CUSTOM_SEARCH === 'true',
		news: {
			time_interval: process.env.NEWS_TIME_INTERVAL || '',
			tbm: process.env.NEWS_TBM || '',
			hl: process.env.NEWS_HL || '',
			gl: process.env.NEWS_GL || '',
			ceid: process.env.NEWS_CEID || ''
		}
	},

	scheduler: {
		enabled: process.env.SCHEDULER_ENABLED === 'true',
		basicReport: process.env.SCHEDULER_BASIC_REPORT || '* */1 * * * *'
	}
};
