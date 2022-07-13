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
  MessagePayload,
  MessageOptions,
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

export interface CommandPayload {
  subcommand?: string;
  params?: any;
  requestor?: string;
}

export type CommandResponse =
  | string
  | MessagePayload
  | Omit<MessageOptions, 'avatarURL' | 'flags' | 'username'>;

export interface CommandConfig {
  readonly data: SlashCommandData;
  readonly guilds?: Snowflake[];
  readonly autocomplete?: (
    interaction: AutocompleteInteraction,
  ) => MaybePromise<ApplicationCommandOptionChoiceData[]>;
  readonly execute: (params: CommandPayload) => Promise<CommandResponse>;
  readonly parseInteraction?: (
    interaction: CommandInteraction,
  ) => CommandPayload;
  readonly parseMessage?: (message: Message) => CommandPayload;
  readonly prepare?: () => MaybePromise<void>;
}

export type CommandCollection = Collection<string, CommandConfig>;
