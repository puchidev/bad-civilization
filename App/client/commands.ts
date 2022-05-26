import { REST } from '@discordjs/rest';
import { Collection } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import glob from 'glob';
import path from 'node:path';

import type { CommandConfig } from '../models';
import { nonNullable } from '../utils';

interface DeployOptions {
  guildId: string;
  onFailure?: () => void;
  onSuccess?: () => void;
}

/**
 * Registers commands to a Discord server.
 * @param options options for the operation
 * @param options.guildId ID of the server where the command should be deployed to
 * @param options.onFailure callback for a failed operation
 * @param options.onSuccess callback for a successful operation
 */
async function deployCommands({
  guildId,
  onFailure,
  onSuccess,
}: DeployOptions) {
  if (!process.env.APP_ID) {
    throw new Error('App ID not found.');
  }
  if (!process.env.APP_TOKEN) {
    throw new Error('App token not found.');
  }

  const fetchPromises = glob
    .sync('App/commands/{*,**/index}.ts')
    .map(async (filePath) => {
      try {
        const basePath = process.cwd();
        const fullPath = path.resolve(basePath, filePath);
        const command: CommandConfig = (await import(fullPath)).default;

        return command.data.toJSON();
      } catch (e) {
        console.error((e as Error).message);
        return null;
      }
    });

  const commands = (await Promise.all(fetchPromises)).filter(nonNullable);

  if (commands.length === 0) {
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.APP_TOKEN);

  rest
    .put(Routes.applicationGuildCommands(process.env.APP_ID, guildId), {
      body: commands,
    })
    .then(() => onSuccess && onSuccess())
    .catch((e) => {
      console.error(e);
      onFailure && onFailure();
    });
}

interface FetchOptions {
  onFailure?: () => void;
  onSuccess?: () => void;
}

/**
 * Loads and parses command files
 * @param options options for the operation
 * @param options.onFailure callback for a failed operation
 * @param options.onSuccess callback for a successful operation
 * @returns the command data
 */
async function fetchCommands({ onFailure, onSuccess }: FetchOptions = {}) {
  const commands = new Collection<string, CommandConfig>();
  let hasError = false;

  const files = glob
    .sync('App/commands/{*,**/index}.ts')
    .map(async (filePath) => {
      try {
        const basePath = process.cwd();
        const fullPath = path.resolve(basePath, filePath);
        const command: CommandConfig = (await import(fullPath)).default;

        commands.set(command.data.name, command);
      } catch (e) {
        hasError = true;
        console.error((e as Error).message);
      }
    });

  await Promise.all(files);

  if (hasError) {
    onFailure && onFailure();
  } else {
    onSuccess && onSuccess();
  }

  return commands;
}

export { deployCommands, fetchCommands };
