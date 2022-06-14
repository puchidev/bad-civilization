import { Collection } from 'discord.js';
import glob from 'glob';
import path from 'node:path';

import { logger } from '../devtools';
import type { CommandCollection, CommandConfig } from '../models';

/**
 * Loads and parses command files.
 * @returns a collection of the application commands
 */
async function fetchCommands() {
  const commands: CommandCollection = new Collection();
  // target .ts files starting with an uppercase letter.
  const filePattern = /\/[A-Z][^\/]+\.ts$/;
  let hasError = false;

  const promises = glob
    .sync('App/commands/**/*.ts')
    .filter((filePath) => filePattern.test(filePath))
    .map(async (filePath) => {
      try {
        const basePath = process.cwd();
        const fullPath = path.resolve(basePath, filePath);
        const command: CommandConfig = (await import(fullPath)).default;
        const commandName = command.data.name;

        if (commands.has(commandName)) {
          logger.error(`Duplicate command name ${command}`);
        }

        commands.set(commandName, command);
      } catch (error) {
        hasError = true;
        logger.error((error as Error).message);
      }
    });

  await Promise.all(promises);

  if (hasError) {
    throw new Error('Failed to load commands.');
  }

  return commands;
}

export { fetchCommands };
