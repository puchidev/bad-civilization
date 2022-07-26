import type {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  Collection,
  CommandInteraction,
  Message,
  MessageOptions,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
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
  | Omit<MessageOptions, 'avatarURL' | 'flags' | 'username'>;

export interface CommandConfig<T = CommandPayload> {
  readonly data: SlashCommandData;
  readonly ephemeral?: boolean;
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
