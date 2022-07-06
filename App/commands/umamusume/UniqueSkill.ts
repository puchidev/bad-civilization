import { bold, SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { MessageEmbed } from 'discord.js';

import { Database } from '#App/classes';
import type { CommandConfig } from '#App/models';
import { endsWithJongSeong, fetchData } from '#App/utils';
import type { UniqueSkill, SkillEffect } from './types';

const skills = new Database<UniqueSkill>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('고유')
    .setDescription('말딸의 고유스킬을 확인해 보자')
    .addStringOption((option) =>
      option
        .setName('말딸')
        .setDescription('말딸의 이름 일부 (ex. 네이처, 치어 네이처, …)')
        .setRequired(true),
    ),
  async prepare() {
    try {
      const uniqueSkillList: UniqueSkill[] = await fetchData(
        'database/umamusume/unique-skills.json',
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

    const { match, suggestions } = skills.search(uma);

    if (!match) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    if (suggestions) {
      await interaction.followUp(dedent`
        찾는 건 ${bold(match.umamusume)}일까?
        이런 키워드는 어때? ${suggestions.join(', ')}
      `);
    }

    const embed = createResultEmbed(match);
    interaction.channel?.send({ embeds: [embed] });
  },
  async respond(message, keywords) {
    if (keywords.length === 0) {
      message.reply(
        '찾는 말딸의 이름 일부를 입력해줘. 가령 `!고유 테이오` 처럼?',
      );
      return;
    }

    const { match, suggestions } = skills.search(keywords.join(' '));

    if (!match) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    if (suggestions) {
      await message.reply(dedent`
        찾는 건 ${bold(match.umamusume)}일까?
        이런 키워드는 어때? ${suggestions.join(', ')}
      `);
    }

    const embed = createResultEmbed(match);
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
    { key: 'currentSpeed', label: '현재속도' },
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
function createResultEmbed(skill: UniqueSkill) {
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
