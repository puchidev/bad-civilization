import { bold, SlashCommandBuilder } from '@discordjs/builders';

import type { CommandConfig } from '#App/models';

const MIN_NUMBER_OF_SLIDES = 2;
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
        .setRequired(true)
        .setMinValue(MIN_NUMBER_OF_SLIDES)
        .setMaxValue(MAX_NUMBER_OF_SLIDES),
    ),
  async interact(interaction) {
    const size = interaction.options.getInteger('눈', true);
    const result = getRandomInteger(1, size);

    interaction.reply(
      `${bold(size.toString())}개의 눈을 가진 주사위를 던져서 ${bold(
        result.toString(),
      )}의 눈이 나왔어.`,
    );
  },
};

export default command;
