import { REST } from '@discordjs/rest';
import { Collection } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import glob from 'glob';
import path from 'node:path';
import type { Guild } from 'discord.js';

import { logger } from '../devtools';
import type { CommandConfig } from '../models';

type Commands = Collection<string, CommandConfig>;

/**
 * Loads and parses command files.
 * @returns a collection of the application commands
 */
async function fetchCommands() {
  const commands: Commands = new Collection();
  let hasError = false;

  const fetchPromises = glob
    .sync('App/commands/{*,**/index}.ts')
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

  await Promise.all(fetchPromises);

  if (hasError) {
    logger.error('Failed to load commands.');
  } else {
    logger.info('Successfully loaded commands.');
  }

  return commands;
}

interface DeployOptions {
  commands: Commands;
  guild: Pick<Guild, 'id' | 'name'>;
}

/**
 * Registers commands to a Discord server.
 * @param options options for the operation
 * @param options.commands collection of application commands
 * @param options.guild Discord server where the command should be deployed to
 */
async function deployCommands({ commands, guild }: DeployOptions) {
  if (!process.env.APP_ID) {
    throw new Error('App ID not found.');
  }
  if (!process.env.APP_TOKEN) {
    throw new Error('App token not found.');
  }
  if (commands.size === 0) {
    throw new Error('No command found.');
  }

  const rest = new REST({ version: '10' }).setToken(process.env.APP_TOKEN);
  const schema = commands.map((command) => command.data.toJSON());
  let hasError = false;

  try {
    rest.put(Routes.applicationGuildCommands(process.env.APP_ID, guild.id), {
      body: schema,
    });
  } catch (error) {
    hasError = true;
    logger.error(error);
  }

  if (hasError) {
    logger.error(`Failed to register commands to: ${guild.name}`);
  } else {
    logger.info(`Successfully registered commands to: ${guild.name}`);
  }

  return !hasError;
}

export { deployCommands, fetchCommands };
