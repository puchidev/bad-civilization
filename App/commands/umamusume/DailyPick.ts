import { bold, SlashCommandBuilder } from '@discordjs/builders';

import type { CommandConfig } from '#App/models';
import { endsWithJongSeong, getLocalDate } from '#App/utils';
import { umamusume } from './partials/database';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('애마')
    .setDescription('오늘의 오레노 아이바는? (매일 바뀜)'),
  async interact(interaction) {
    const username = interaction.user.username;
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
  const selected = umamusume.pseudoRandom(seed);

  return selected;
}

export default command;
