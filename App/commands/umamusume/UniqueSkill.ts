import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

import type { CommandConfig } from '#App/models';
import { uniqueSkills } from './partials/database';
import type { UniqueSkill, SkillEffect } from './partials/types';

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
  async interact(interaction) {
    const uma = interaction.options.getString('말딸', true);

    const { match, suggestions } = uniqueSkills.search(uma);

    if (!match) {
      interaction.reply({ content: '아무 것도 찾지 못했어…' });
      return;
    }

    interaction.reply({
      embeds: [createResultEmbed(match, suggestions)],
    });
  },
  async respond(message, keywords) {
    if (keywords.length === 0) {
      message.reply(
        '찾는 말딸의 이름 일부를 입력해줘. 가령 `!고유 테이오` 처럼?',
      );
      return;
    }

    const { match, suggestions } = uniqueSkills.search(keywords.join(' '));

    if (!match) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    message.reply({
      embeds: [createResultEmbed(match, suggestions)],
    });
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
 * @param suggestions other search result that the user might want
 * @returns created message embed
 */
function createResultEmbed(skill: UniqueSkill, suggestions?: string[] | null) {
  const { umamusume, description, effect, precondition, condition } = skill;

  const embed = new MessageEmbed().setTitle(`${umamusume}의 고유 스킬`);

  if (suggestions) {
    embed.setFooter({ text: `유사한 검색어: ${suggestions.join(', ')}` });
  }

  embed
    .addField('발동조건', description.join('\n'))
    .addField('효과', formatEffect(effect));

  if (precondition) {
    embed.addField('전제조건식', beautifyCondition(precondition));
  }

  embed.addField(
    '조건식',
    Array.isArray(condition)
      ? condition.map(beautifyCondition).join('\nOR\n')
      : beautifyCondition(condition),
  );

  return embed;
}

export default command;
