import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import type { Guild } from 'discord.js';

import { logger } from '../devtools';
import type { CommandCollection } from '../models';

interface DeployOptions {
  commands: CommandCollection;
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

export { deployCommands };
