import { bold, SlashCommandBuilder } from 'discord.js';
import { endsWithJongSeong, getLocalDate } from '#App/utils';
import { umamusumes } from './partials/database';

import type { CommandConfig } from '#App/models';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('애마')
    .setDescription('오늘의 오레노 아이바는? (매일 자정에 바뀜)'),
  async execute({ requestor }) {
    if (!requestor) {
      throw new Error(`Unable to find requestor information.`);
    }

    const today = getLocalDate('Asia/Seoul');
    const seed = [
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      requestor.username,
    ].join('-');
    const myUmamusume = umamusumes.pseudoRandom(seed, {
      test: (umamusume) => !umamusume.name.includes('('),
    });

    return `오늘 ${bold(requestor.username)} 트레이너님의 애마는 ${bold(
      myUmamusume.name,
    )}${endsWithJongSeong(myUmamusume.name) ? '이에' : '예'}요.`;
  },
  parseInteraction(interaction) {
    const requestor = interaction.user;
    return { requestor };
  },
  parseMessage(message) {
    const requestor = message.author;
    return { requestor };
  },
};

export default command;
