import { bold, SlashCommandBuilder } from 'discord.js';

import type { CommandConfig } from '#App/models';

const MIN_NUMBER_OF_SLIDES = 2;
const MAX_NUMBER_OF_SLIDES = Number.MAX_SAFE_INTEGER;

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('주사')
    .setDescription('주사위를 굴려보고 싶어')
    .addIntegerOption((option) =>
      option
        .setName('눈')
        .setDescription('주사위가 가진 눈의 갯수')
        .setRequired(true)
        .setMinValue(MIN_NUMBER_OF_SLIDES)
        .setMaxValue(MAX_NUMBER_OF_SLIDES),
    ),
  async execute({ params }) {
    if (!params) {
      return '몇 개의 눈을 가진 주사위를 던지고 싶어?';
    }

    const size = params[0];
    const result = getRandomInteger(1, size);

    return `${bold(size.toString())}개의 눈을 가진 주사위를 던져서 ${bold(
      result.toString(),
    )}의 눈이 나왔어.`;
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const size = interaction.options.getInteger('눈', true);

    return { params: [size] };
  },
  parseMessage(message) {
    const [, size] = message.content.trim().split(/ +/g);
    const sizeAsNumber = parseInt(size, 10);
    return { params: [sizeAsNumber] };
  },
};

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

export default command;
