import dotenv from 'dotenv';
import { Bot } from './classes';
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

try {
  new Bot().init();
} catch (e) {
  logger.error(e);
}
