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
  User,
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
  requestor?: User;
}

export type CommandResponse =
  | string
  | MessagePayload
  | Omit<MessageOptions, 'avatarURL' | 'flags' | 'username'>;

export interface CommandConfig<T = CommandPayload> {
  readonly data: SlashCommandData;
  readonly guilds?: Snowflake[];
  readonly autocomplete?: (
    interaction: AutocompleteInteraction,
  ) => MaybePromise<ApplicationCommandOptionChoiceData[]>;
  readonly execute: (params: T) => Promise<CommandResponse>;
  readonly parseInteraction?: (interaction: CommandInteraction) => T;
  readonly parseMessage?: (message: Message) => T;
  readonly prepare?: () => MaybePromise<void>;
}

export type CommandCollection = Collection<string, CommandConfig>;
