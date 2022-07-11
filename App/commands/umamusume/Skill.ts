import { bold, SlashCommandBuilder } from '@discordjs/builders';

import type { CommandConfig } from '#App/models';
import { skills } from './partials/database';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('스킬')
    .setDescription('말딸의 스킬을 확인해 보자')
    .addStringOption((option) =>
      option
        .setName('스킬명')
        .setDescription('찾으려는 스킬명을 "일본어로" 적어 주세요.')
        .setRequired(true),
    ),
  async interact(interaction) {
    const uma = interaction.options.getString('스킬명', true);
    const { match, suggestions } = skills.search(uma);

    if (!match) {
      interaction.reply('아무 것도 찾지 못했어…');
      return;
    }

    let result = `일본어: ${bold(match.ja)} | 한국어: ${bold(match.ko)}`;

    if (suggestions) {
      result += `\n유사한 검색어: ${suggestions.join(', ')}`;
    }

    interaction.reply(result);
  },
  async respond(message, keywords) {
    if (keywords.length === 0) {
      message.reply('찾는 스킬의 이름 일부를 입력해줘. 가령 `!스킬 左` 처럼?');
      return;
    }

    const { match, suggestions } = skills.search(keywords.join(' '));

    if (!match) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    let result = `일본어: ${bold(match.ja)} | 한국어: ${bold(match.ko)}`;

    if (suggestions) {
      result += `\n유사한 검색어: ${suggestions.join(', ')}`;
    }

    message.reply(result);
  },
};

export default command;
