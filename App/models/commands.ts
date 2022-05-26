import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import type { PartialBy } from './utils';

export type SlashCommandData =
  | PartialBy<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  | SlashCommandSubcommandsOnlyBuilder;

export interface CommandConfig {
  data: SlashCommandData;
  execute: (interaction: CommandInteraction) => Promise<void>;
  prepare?: () => Promise<void>;
}
