import { bold, SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';

/**
 * Remove duplicate items from the array passed.
 *
 * @param {string} optionString
 * @return {string[]} Array of unique options.
 */
function parseOptions(optionString: string) {
  const options = optionString.split(',');
  const uniqueOptions = [...new Set(options)];

  return uniqueOptions;
}

/**
 * Choose an arbitrary item from the array passed.
 *
 * @param {string[]} array - The array to choose the item from
 * @param {number} rando - Method generating a random seed between 0 and 1
 * @return {string[]} The chosen item from the original array.
 */
function randomSelect(array: string[], rando = Math.random) {
  return array[Math.floor(rando() * array.length)];
}

export default {
  data: new SlashCommandBuilder()
    .setName('선택')
    .setDescription('주어진 선택지 중 하나를 골라줄게.')
    .addStringOption((option) =>
      option
        .setName('선택지')
        .setDescription('선택지 (쉼표로 구분)')
        .setRequired(true),
    ),
  async execute(interaction: CommandInteraction) {
    const options = interaction.options.getString('선택지');

    if (!options) {
      return;
    }

    const optionArray = parseOptions(options);

    if (optionArray.length < 2) {
      interaction.reply('두 개 이상의 선택지를 쉼표로 구분해서 적어주겠어?');
      return;
    }

    const chosen = randomSelect(optionArray);
    interaction.reply(
      `${bold(optionArray.join(', '))} 중 마스터가 원하는 것은 ${bold(
        chosen,
      )}일까?`,
    );
  },
};
