import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import dedent from 'dedent';
import { getArguments } from '#App/utils';
import { convertAliases } from './partials/aliases';
import { umamusumes } from './partials/database';

import type { CommandConfig } from '#App/models';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('적성')
    .setDescription('우마무스메의 적성을 알려줘')
    .addStringOption((option) =>
      option
        .setName('이름')
        .setDescription('찾는 말딸의 이름 일부')
        .setRequired(true),
    ),
  async execute({ params }) {
    const { name } = params;

    if (!name) {
      return `검색어를 입력해줘. \`적성 키타산\``;
    }

    const keyword: string = convertAliases(name);

    const { match: umamusume, suggestions } = umamusumes.search(keyword, {
      strategy: 'similarity',
    });

    if (!umamusume) {
      return '아무 것도 찾지 못했어…';
    }

    const [a, b, c, d, e, f, g, h, i, j] = umamusume.aptitude.split('');

    const aptitudeTemplate = dedent`
      잔디 ${a} 더트 ${b}
      단거리 ${c} 마일 ${d} 중거리 ${e} 장거리 ${f}
      도주 ${g} 선행 ${h} 선입 ${i} 추입 ${j}
    `;

    const embed = new EmbedBuilder()
      .setTitle(`${umamusume.name}의 적성`)
      .setDescription(aptitudeTemplate);

    if (suggestions) {
      embed.setFooter({ text: `유사한 검색어: ${suggestions.join(', ')}` });
    }

    return { embeds: [embed] };
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const name = interaction.options.getString('이름');

    return { params: { name } };
  },
  parseMessage(message) {
    const { strings } = getArguments(message);
    const [name] = strings;

    return { params: { name } };
  },
};

export default command;
