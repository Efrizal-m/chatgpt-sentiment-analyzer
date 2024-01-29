/* eslint-disable no-console */

import chalk from 'chalk';

export default class Logger {
	public static info = (...args: unknown[]) => console.log(chalk.blue(`[${new Date().toISOString()}] [INFO]`), ...args);
	public static warn = (...args: unknown[]) => console.log(chalk.yellow(`[${new Date().toISOString()}] [WARNING]`), ...args);
	public static err = (...args: unknown[]) => console.log(chalk.red(`[${new Date().toISOString()}] [ERROR]`), ...args);
}
