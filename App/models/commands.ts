import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import type {
  ApplicationCommandOptionChoiceData,
  CommandInteraction,
} from 'discord.js';
import type { PartialBy } from './utils';

export type SlashCommandData =
  | PartialBy<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  | SlashCommandSubcommandsOnlyBuilder;

export interface AutocompleteOption {
  name: string;
  value: string | number;
}

export interface CommandConfig {
  autocomplete?: () => ApplicationCommandOptionChoiceData[];
  data: SlashCommandData;
  execute: (interaction: CommandInteraction) => Promise<void>;
  prepare?: () => Promise<void>;
}
