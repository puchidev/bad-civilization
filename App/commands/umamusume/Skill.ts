import { bold, SlashCommandBuilder } from 'discord.js';
import { skills } from './partials/database';

import type { CommandConfig } from '#App/models';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('스킬')
    .setDescription('말딸의 스킬에 대해 간단히 알려줘')
    .addStringOption((option) =>
      option
        .setName('스킬명')
        .setDescription('찾으려는 스킬명을 일본어로(!) 적어 주세요.')
        .setRequired(true),
    ),
  async execute({ params }) {
    if (!params || params.length === 0) {
      return '찾는 스킬의 이름 일부를 입력해줘. 가령 `!스킬 全身` 처럼?';
    }

    const name = params[0];
    const { match, suggestions } = skills.search(name);

    if (!match) {
      return '아무 것도 찾지 못했어…';
    }

    let result = `일본어: ${bold(match.ja)} | 한국어: ${bold(match.ko)}`;

    if (suggestions) {
      result += `\n유사한 검색어: ${suggestions.join(', ')}`;
    }

    return result;
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const name = interaction.options.getString('스킬명', true);

    return { params: [name] };
  },
  parseMessage(message) {
    const [, ...keywords] = message.content.trim().split(/ +/g);
    return { params: keywords };
  },
};

export default command;
