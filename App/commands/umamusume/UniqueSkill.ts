import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getArguments } from '#App/utils';
import { convertAliases } from './partials/aliases';
import { umamusumes } from './partials/database';

import type { CommandConfig } from '#App/models';
import type { SkillEffect } from './partials/types';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('고유')
    .setDescription('말딸의 고유스킬을 보여줘')
    .addStringOption((option) =>
      option
        .setName('말딸')
        .setDescription('말딸의 이름 일부 (ex. 네이처, 치어 네이처, …)')
        .setRequired(true),
    ),
  ephemeral: true,
  async execute({ params }) {
    if (!params) {
      return '찾는 말딸의 이름 일부를 입력해줘';
    }

    const keyword = convertAliases(params.join(' '));

    const { match: umamusume, suggestions } = umamusumes.search(keyword, {
      strategy: 'similarity',
      test: (umamusume) => umamusume.presence !== null,
    });

    if (!umamusume) {
      return '아무 것도 찾지 못했어…';
    }

    const {
      name,
      uniqueSkillDescription,
      uniqueSkillEffect,
      uniqueSkillPrecondition,
      uniqueSkillCondition,
    } = umamusume;
    const embed = new EmbedBuilder().setTitle(`${name}의 고유 스킬`);

    if (suggestions) {
      embed.setFooter({ text: `유사한 검색어: ${suggestions.join(', ')}` });
    }

    embed.addFields([
      { name: '발동조건', value: uniqueSkillDescription.join('\n') },
      { name: '효과', value: formatEffect(uniqueSkillEffect) },
      ...(uniqueSkillPrecondition
        ? [
            {
              name: '전제조건식',
              value: beautifyCondition(uniqueSkillPrecondition),
            },
          ]
        : []),
      {
        name: '조건식',
        value: Array.isArray(uniqueSkillCondition)
          ? uniqueSkillCondition.map(beautifyCondition).join('\nOR\n')
          : beautifyCondition(uniqueSkillCondition),
      },
    ]);

    return { embeds: [embed] };
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const umaName = interaction.options.getString('말딸', true);

    return { params: [umaName] };
  },
  parseMessage(message) {
    const { strings: keywords } = getArguments(message);
    return { params: keywords };
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

export default command;
