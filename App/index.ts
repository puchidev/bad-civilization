import dotenv from 'dotenv';
import { initClient } from './client';
import { logger } from './devtools';

dotenv.config({
  path:
    process.env.NODE_ENV === 'development'
      ? '.env.development'
      : '.env.production',
});

process.on('warning', (warning) => {
  logger.fatal(`Node warning: ${warning}`);
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.warn(`Node unhandled rejection: ${reason}`);
});

initClient();
