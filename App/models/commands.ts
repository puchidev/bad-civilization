import type { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';

export interface CommandConfig {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => void | Promise<void>;
}
