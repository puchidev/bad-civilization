import { SlashCommandBuilder, underscore } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';
import type { CommandInteraction } from 'discord.js';
import skillData from './skills.json';

import { Database } from '../../classes';
import type { CommandConfig } from '../../models';
import { endsWithJongSeong } from '../../utils';
import { beautifyCondition, formatEffect } from './utils';
import type { Skill } from './types';

const skills = new Database<Skill>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('고유')
    .setDescription('말딸의 고유스킬을 확인해 보자')
    .addStringOption((option) => {
      return option
        .setName('말딸')
        .setDescription('말딸의 이름 일부 (ex. 네이처, 치어 네이처, …)')
        .setRequired(true);
    }),
  async prepare() {
    skills.addAll(skillData, 'umamusume');
  },
  async execute(interaction: CommandInteraction) {
    const uma = interaction.options.getString('말딸', true);

    await interaction.reply(
      `'${uma}'${endsWithJongSeong(uma) ? '으' : ''}로 고유 스킬을 검색할게.`,
    );

    const foundSkills = skills.find(uma);
    let skill: Skill;

    if (!foundSkills) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    if (foundSkills instanceof Collection) {
      const [first, ...rest] = [...foundSkills.keys()];

      await interaction.followUp(
        `처음 찾은 ${underscore(
          first,
        )}의 결과를 보여줄게. 이런 데이터도 찾았어.\n${rest.join(', ')}`,
      );

      skill = foundSkills.first()!;
    } else {
      skill = foundSkills;
    }

    const { umamusume, description, effect, precondition, condition } = skill;

    const embed = new MessageEmbed()
      .setTitle(`${umamusume}의 고유 스킬`)
      .setDescription(description.join('\n'))
      .addField('효과', formatEffect(effect));

    if (precondition) {
      embed.addField('전제조건식', beautifyCondition(precondition));
    }

    if (Array.isArray(condition)) {
      embed.addField('조건식', condition.map(beautifyCondition).join('\n'));
    } else {
      embed.addField('조건식', beautifyCondition(condition));
    }

    interaction.channel?.send({ embeds: [embed] });
  },
};

export default command;
