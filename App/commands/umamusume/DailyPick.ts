import { bold, SlashCommandBuilder } from '@discordjs/builders';

import { Database } from '#App/classes';
import type { CommandConfig } from '#App/models';
import { endsWithJongSeong, fetchData, getLocalDate } from '#App/utils';
import type { Umamusume } from './types';

const umamusume = new Database<Umamusume>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('애마')
    .setDescription('오늘의 오레노 아이바는? (매일 바뀜)'),
  async prepare() {
    try {
      const umamusumeList: Umamusume[] = await fetchData(
        'database/umamusume/umamusume.json',
      );
      umamusume.addAll(umamusumeList, 'name');
    } catch (e) {
      console.debug(e);
      console.error('Failed to establish umamusume list.');
    }
  },
  async interact(interaction) {
    const username = interaction.member?.user.username;

    if (!username) {
      throw new Error('Unable to specify the requestor.');
    }

    const myUmamusume = getDailyUmamusumeFor(username);

    await interaction.reply(
      `오늘 ${bold(username)} 트레이너님의 애마는 ${bold(myUmamusume.name)}${
        endsWithJongSeong(myUmamusume.name) ? '이에' : '예'
      }요.`,
    );
  },
  async respond(message) {
    const username = message.author.username;
    const myUmamusume = getDailyUmamusumeFor(username);

    await message.reply(
      `오늘 ${bold(username)} 트레이너님의 애마는 ${bold(myUmamusume.name)}${
        endsWithJongSeong(myUmamusume.name) ? '이에' : '예'
      }요.`,
    );
  },
};

/**
 * Picks an arbitrary umamusume matching the given username.
 * @param username requestor's name.
 * @returns picked umamusume object.
 */
function getDailyUmamusumeFor(username: string) {
  const today = getLocalDate('Asia/Seoul');
  const seed = [
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
    username,
  ].join('-');
  const selected = umamusume.random(seed);

  return selected;
}

export default command;
