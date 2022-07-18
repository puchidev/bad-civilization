import { bold, SlashCommandBuilder } from 'discord.js';
import { random } from '#App/utils';

import type { CommandConfig } from '#App/models';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('선택')
    .setDescription('선택지 중 하나를 골라줘')
    .addStringOption((option) =>
      option
        .setName('선택지')
        .setDescription('선택지 (띄어쓰기로 구분)')
        .setRequired(true),
    ),
  async execute({ params }) {
    if (!params) {
      throw new Error('Params expected');
    }

    const options: string[] = params;

    if (options.length < 2) {
      return '두 개 이상의 선택지를 띄어쓰기로 구분해서 적어줄래?';
    }

    const selected = random(options);

    return `${bold(options.join(', '))} 중 마스터가 원하는 것은 ${bold(
      selected,
    )}일까?`;
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const options = interaction.options.getString('선택지', true).split(/ +/g);
    const uniqueOptions = [...new Set(options)];

    return { params: uniqueOptions };
  },
  parseMessage(message) {
    const [, ...options] = message.content.trim().split(/ +/g);
    const uniqueOptions = [...new Set(options)];

    return { params: uniqueOptions };
  },
};

export default command;
