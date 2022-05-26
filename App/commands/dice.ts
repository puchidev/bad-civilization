import { bold, SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';

import type { CommandConfig } from '../models';

const DEFAULT_NUMBER_OF_SLIDES = 6;
const MAX_NUMBER_OF_SLIDES = Number.MAX_SAFE_INTEGER;

/**
 * Generates a random integer between two numeric values.
 * @param min lower bound
 * @param max upper bound
 * @returns the generated integer
 */
function getRandomInteger(min: number, max: number): number {
  const $min = Math.ceil(min);
  const $max = Math.floor(max);

  return Math.floor(Math.random() * ($max - $min + 1)) + $min;
}

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('주사')
    .setDescription('주사위를 굴려볼 수 있어.')
    .addIntegerOption((option) =>
      option
        .setName('눈')
        .setDescription('주사위가 가진 눈의 갯수')
        .setRequired(true),
    ),
  async execute(interaction: CommandInteraction) {
    const size =
      interaction.options.getInteger('size') ?? DEFAULT_NUMBER_OF_SLIDES;

    if (size > MAX_NUMBER_OF_SLIDES) {
      interaction.reply('너무 많은 눈을 가진 주사위는 혼돈을 가져올 뿐이야.');
      return;
    }

    if (size < 2) {
      interaction.reply(
        `${bold(
          size.toString(),
        )}개의 눈을 가진 주사위가 이 세계에 존재할 수 있을까?`,
      );
      return;
    }

    const result = getRandomInteger(1, size);

    interaction.reply(
      `${bold(size.toString())}개의 눈을 가진 주사위를 던져서 ${bold(
        result.toString(),
      )}의 눈이 나왔어.`,
    );
  },
};

export default command;
