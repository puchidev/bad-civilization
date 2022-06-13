import { bold, SlashCommandBuilder } from '@discordjs/builders';

import { Database } from '../../classes';
import type { CommandConfig } from '../../models';
import { endsWithJongSeong, getLocalDate } from '../../utils';
import umamusumeData from './umamusume.json';

interface Umamusume {
  name: string;
}

const umamusume = new Database<Umamusume>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('애마')
    .setDescription('오늘의 오레노 아이바는? (매일 바뀜)'),
  async prepare() {
    umamusume.addAll(umamusumeData, 'name');
  },
  async execute(interaction) {
    const username = interaction.member?.user.username;

    if (!username) {
      throw new Error('Unable to specify the requestor.');
    }

    const today = getLocalDate('Asia/Seoul');
    const seed = [
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      username,
    ].join('-');
    const selected = umamusume.random(seed);

    await interaction.reply(
      `오늘 ${bold(username)} 트레이너님의 애마는 ${bold(selected.name)}${
        endsWithJongSeong(selected.name) ? '이에' : '예'
      }요.`,
    );
  },
};

export default command;
