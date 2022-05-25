import dotenv from 'dotenv';
import { initClient } from './client';

dotenv.config({ path: '.env' });

process.on('warning', (message) => {
  console.warn(`Node warning: ${message}`);
});

process.on('unhandledRejection', (reason) => {
  console.warn(`Node unhandled rejection: ${reason}`);
});

initClient();
