import * as cron from 'node-cron';
import { addBasicReportQueue } from '../queues/basicReportQueue';
import { getFailedLogQueryByStatus, newLogQuery, refreshLogQueries } from '../services/logQuery';
import { LogQueryModes, LogQueryStatuses } from '../interfaces/analytics/logquery';
import { appConfig } from '../configs/app.config';
import Logger from '../library/logger/Logger';

export const startScheduler = () => {
  cron.schedule(appConfig.scheduler.basicReport, async () => {
    try {
      const logQueries = await getFailedLogQueryByStatus(LogQueryModes.BasicReport, LogQueryStatuses.BadGateway)
      if (logQueries.length > 0) {
        Logger.info(`Running failed query | query: ${logQueries[0].query} | mode: ${LogQueryModes.BasicReport}`);
        await refreshLogQueries(logQueries[0].query, LogQueryModes.BasicReport);
        await addBasicReportQueue({ query: logQueries[0].query });   
      }    
    } catch (error) {
      console.log(error)
    }
  });
};
