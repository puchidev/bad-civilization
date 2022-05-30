import { SlashCommandBuilder, underscore } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';
import type { CommandInteraction } from 'discord.js';
import skills from './skills.json';

import type { CommandConfig } from '../../models';
import { endsWithJongSeong } from '../../utils';
import { beautifyCondition, formatEffect } from './utils';
import type { Skill } from './types';

type Database = Collection<string, Skill>;

const database: Database = new Collection();

/**
 * Finds all keys that matches given keyword(s).
 * `foo` matches `foo`, `fooo`, `foox`, `afoo`, etc.
 * `foo bar` matches `foo bar` `bar foo` ` afoo bbar ` ` xbar yfoo`
 * @param keyword search keyword(s) string
 * @returns matching database key or keys
 */
function searchDatabase(keyword: string) {
  const _keyword = keyword.trim();
  const isMultipleKeywords = _keyword.includes(' ');

  let matches: Database;

  if (isMultipleKeywords) {
    const pattern = new RegExp(
      `^${_keyword
        .split(/ /g)
        .map((word) => `(?=.*${word})`)
        .join('')}.*$`,
    );
    matches = database.filter((_value, key) => pattern.test(key));
  } else {
    matches = database.filter((_value, key) => key.includes(_keyword));
  }

  if (matches.size === 0) {
    return null;
  }
  if (matches.size === 1) {
    return matches.first()!;
  }
  return matches;
}

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
    skills.forEach((skill) => {
      database.set(skill.umamusume, skill);
    });
  },
  async execute(interaction: CommandInteraction) {
    const uma = interaction.options.getString('말딸', true);

    await interaction.reply(
      `'${uma}'${endsWithJongSeong(uma) ? '으' : ''}로 고유 스킬을 검색할게.`,
    );

    const searchResults = searchDatabase(uma);
    let skill: Skill;

    if (!searchResults) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    if (searchResults instanceof Collection) {
      const [first, ...rest] = [...searchResults.keys()];

      await interaction.followUp(
        `가장 가까운 ${underscore(
          first,
        )}의 결과를 보여줄게. 이런 데이터도 찾았어.\n${rest.join(', ')}`,
      );

      skill = searchResults.first()!;
    } else {
      skill = searchResults;
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
