import { SlashCommandBuilder, underscore } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';

import { Database } from '../../classes';
import type { CommandConfig } from '../../models';
import { endsWithJongSeong, fetchData } from '../../utils';
import type { Skill, SkillEffect } from './types';

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
    try {
      const uniqueSkillList: Skill[] = await fetchData(
        'database/umamusume/unique-skill.json',
      );
      skills.addAll(uniqueSkillList, 'umamusume');
    } catch (e) {
      console.debug(e);
      console.error(`Failed to establish umamusume's unique skill list.`);
    }
  },
  async interact(interaction) {
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

    const embed = createResultEmbed(skill);
    interaction.channel?.send({ embeds: [embed] });
  },
  async respond(message, [uma]) {
    const foundSkills = skills.find(uma);
    let skill: Skill;

    if (!foundSkills) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    if (foundSkills instanceof Collection) {
      const [first, ...rest] = [...foundSkills.keys()];

      await message.reply(
        `처음 찾은 ${underscore(
          first,
        )}의 결과를 보여줄게. 이런 데이터도 찾았어.\n${rest.join(', ')}`,
      );

      skill = foundSkills.first()!;
    } else {
      skill = foundSkills;
    }

    const embed = createResultEmbed(skill);
    message.reply({ embeds: [embed] });
  },
};

/**
 * Beautify condition string
 * @param text skill condition written in one-liner style
 * @returns beautified condition
 */
function beautifyCondition(text: string) {
  return text.split(/[@&]/g).join('\n');
}

/**
 * Transforms skill effect object into human-friendly text.
 * @param effect information about the skill
 * @returns formatted skill effect
 */
function formatEffect(effect: SkillEffect) {
  const text = [
    { key: 'duration', label: '지속시간', unit: 's' },
    { key: 'speed', label: '속도' },
    { key: 'acceleration', label: '가속도' },
    { key: 'movement', label: '레인이동' },
    { key: 'heal', label: '체력회복' },
    { key: 'drain', label: '체력감소' },
  ]
    .map(({ key, label, unit }) => {
      const value: number | undefined = effect[key as keyof SkillEffect];

      if (typeof value === 'undefined') {
        return null;
      }

      const valueNumber =
        key === 'duration' ? value.toFixed(1) : value.toFixed(2);
      const text = `${label} ${valueNumber}${unit ?? ''}`;

      return text;
    })
    .filter((v): v is string => typeof v === 'string')
    .join('\n');

  return text;
}

/**
 * Creates a message embed containing information about the found race.
 * @param skill found skill
 * @returns created message embed
 */
function createResultEmbed(skill: Skill) {
  const { umamusume, description, effect, precondition, condition } = skill;

  const embed = new MessageEmbed()
    .setTitle(`${umamusume}의 고유 스킬`)
    .setDescription(description.join('\n'))
    .addField('효과', formatEffect(effect));

  if (precondition) {
    embed.addField('전제조건식', beautifyCondition(precondition));
  }

  if (Array.isArray(condition)) {
    embed.addField('조건식', condition.map(beautifyCondition).join('\nOR\n'));
  } else {
    embed.addField('조건식', beautifyCondition(condition));
  }

  return embed;
}

export default command;
