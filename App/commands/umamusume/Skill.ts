import { bold, SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';

import { Database } from '#App/classes';
import type { CommandConfig } from '#App/models';
import { endsWithJongSeong, fetchData } from '#App/utils';
import type { Skill } from './types';

const skills = new Database<Skill>();

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
  async prepare() {
    try {
      const uniqueSkillList: Skill[] = await fetchData(
        'database/umamusume/skills.json',
      );
      skills.addAll(uniqueSkillList, 'ja');
    } catch (e) {
      console.debug(e);
      console.error(`Failed to establish umamusume's skill list.`);
    }
  },
  async interact(interaction) {
    const uma = interaction.options.getString('스킬명', true);

    await interaction.reply(
      `'${uma}'${endsWithJongSeong(uma) ? '으' : ''}로 스킬을 검색할게.`,
    );

    const { match, suggestions } = skills.search(uma);

    if (!match) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    if (suggestions) {
      await interaction.followUp(dedent`
        찾는 건 ${bold(match.ja)}일까?
        이런 키워드는 어때? ${suggestions.join(', ')}
      `);
    }

    interaction.followUp(
      `일본어: ${bold(match.ja)} | 한국어: ${bold(match.ko)}`,
    );
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

    if (suggestions) {
      await message.reply(dedent`
        찾는 건 ${bold(match.ja)}일까?
        이런 키워드는 어때? ${suggestions.join(', ')}
      `);
    }

    message.reply(`일본어: ${bold(match.ja)} | 한국어: ${bold(match.ko)}`);
  },
};

export default command;
