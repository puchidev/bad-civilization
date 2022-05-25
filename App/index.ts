import dotenv from 'dotenv';
import { initClient } from './client';

dotenv.config({
  path:
    process.env.NODE_ENV === 'development'
      ? '.env.development'
      : '.env.production',
});

process.on('warning', (message) => {
  console.warn(`Node warning: ${message}`);
});

process.on('unhandledRejection', (reason) => {
  console.warn(`Node unhandled rejection: ${reason}`);
});

initClient();
