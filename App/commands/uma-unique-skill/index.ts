import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';
import type { CommandInteraction } from 'discord.js';
import skills from './skills.json';

import type { CommandConfig } from '../../models';
import { endsWithJongSeong } from '../../utils';
import { beautifyCondition, formatEffect } from './utils';
import type { Skill } from './types';

const database = new Collection<string, Skill>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('고유')
    .setDescription('말딸의 고유스킬을 확인해 보자')
    .addStringOption((option) => {
      return option
        .setName('말딸')
        .setDescription('검색하려는 말딸의 이름 일부')
        .setRequired(true);
    }),
  async prepare() {
    skills.forEach((skill) => {
      database.set(skill.umamusume, skill);
    });
  },
  async execute(interaction: CommandInteraction) {
    const uma = interaction.options.getString('말딸', true);

    await interaction.reply(
      `'${uma}'${endsWithJongSeong(uma) ? '으' : ''}로 고유 스킬을 검색할게.`,
    );

    let skill = database.get(uma);

    if (!skill) {
      const matches = database.filter((_value, key) => key.includes(uma));

      switch (matches.size) {
        case 0:
          interaction.followUp('아무 것도 찾지 못했어…');
          return;

        case 1:
          const _skill = matches.first();
          if (!_skill) {
            return;
          }
          skill = _skill;
          break;

        default:
          interaction.followUp(
            `이 중에 무얼 찾아보고 싶어?\n${[...matches.keys()].join(', ')}`,
          );
          return;
      }
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
