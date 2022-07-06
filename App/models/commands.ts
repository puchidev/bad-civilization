import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import type {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  Collection,
  CommandInteraction,
  Message,
  Snowflake,
} from 'discord.js';

import type { MaybePromise, PartialBy } from './utils';

export type SlashCommandData =
  | PartialBy<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  | SlashCommandSubcommandsOnlyBuilder;

export interface AutocompleteOption {
  readonly name: string;
  readonly value: string | number;
}

export interface CommandConfig {
  readonly data: SlashCommandData;
  readonly guilds?: Snowflake[];
  readonly autocomplete?: (
    interaction: AutocompleteInteraction,
  ) => MaybePromise<ApplicationCommandOptionChoiceData[]>;
  readonly interact: (interaction: CommandInteraction) => Promise<void>;
  readonly prepare?: () => MaybePromise<void>;
  readonly respond?: (message: Message, params: string[]) => Promise<void>;
}

export type CommandCollection = Collection<string, CommandConfig>;
