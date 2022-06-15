import { bold, SlashCommandBuilder } from '@discordjs/builders';

import type { CommandConfig } from '#App/models';
import { randomSelect } from '#App/utils';

/**
 * Removes duplicate items from the array passed.
 * @param optionString user typed option
 * @returns array of unique options.
 */
function parseOptions(optionString: string) {
  const options = optionString.split(/ +/g);
  const uniqueOptions = [...new Set(options)];

  return uniqueOptions;
}

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('선택')
    .setDescription('주어진 선택지 중 하나를 골라줄게.')
    .addStringOption((option) =>
      option
        .setName('선택지')
        .setDescription('선택지 (띄어쓰기로 구분)')
        .setRequired(true),
    ),
  async interact(interaction) {
    const options = interaction.options.getString('선택지', true);
    const optionArray = parseOptions(options);

    if (optionArray.length < 2) {
      interaction.reply('두 개 이상의 선택지를 띄어쓰기로 구분해서 적어줄래?');
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

export default command;
