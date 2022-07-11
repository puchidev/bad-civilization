import { bold, SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { MessageEmbed } from 'discord.js';

import type { CommandConfig } from '#App/models';
import {
  endsWithJongSeong,
  getAlphabetOffset,
  nonNullable,
  random,
} from '#App/utils';
import type { Umamusume } from './partials/types';
import { umamusume } from './partials/database';

interface Conditions {
  trackSurface?: string;
  trackLength?: string;
  strategy?: string;
}

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('뭐키우지')
    .setDescription('키울 만한 말딸을 추천해줘')
    .addStringOption((option) =>
      option
        .setName('조건')
        .setDescription('마장, 거리, 각질 조건 (띄어쓰기로 구분)'),
    ),
  async execute({ params }) {
    const conditions = parseConditions(params);

    const character = umamusume
      .filter((uma) => {
        return uma.implemented !== false && meetsConditions(uma, conditions);
      })
      .random();

    if (!character) {
      return '말딸 데이터를 찾지 못했어…';
    }

    const aptitude = generateAptitude(character, conditions);
    const sample = `${aptitude} ${bold(character.name)}`;

    const [a, b, c, d, e, f, g, h, i, j] = character.aptitude;

    const aptitudeTemplate = dedent`
      잔디 ${a} 더트 ${b}
      단거리 ${c} 마일 ${d} 중거리 ${e} 장거리 ${f}
      도주 ${g} 선행 ${h} 선입 ${i} 추입 ${j}
    `;

    const embed = new MessageEmbed()
      .setTitle(`${character.name}의 적성`)
      .setDescription(aptitudeTemplate);

    const message = `${sample}${
      endsWithJongSeong(character.name) ? '은' : '는'
    } 어때?`;

    return { content: message, embeds: [embed] };
  },
  parseInteraction(interaction) {
    const conditions = interaction.options.getString('조건')?.split(/ +/g);
    return { params: conditions };
  },
  parseMessage(message) {
    const [, ...conditions] = message.content.trim().split(/ +/g);
    return { params: conditions };
  },
};

/**
 * Regroup user-provided conditions to accessible condition object.
 * @param userConditions enumerable aptitude conditions
 * @returns grouped aptitude conditions
 */
function parseConditions(userConditions?: string[]): Conditions {
  if (!userConditions) {
    return {};
  }

  const conditions: Conditions = {};

  const schema: Record<keyof Conditions, string[]> = {
    trackSurface: ['잔디', '더트'],
    trackLength: ['단거리', '마일', '중거리', '장거리'],
    strategy: ['도주', '선행', '선입', '추입'],
  };

  const joined = userConditions.join(' ');

  for (const [key, value] of Object.entries(schema)) {
    const filter = new RegExp(`(?:${value.join('|')})`, 'g');
    const matches = joined.match(filter);

    if (!matches) {
      continue;
    }
    if (matches.length > 1) {
      throw new Error('Conflicting conditions.');
    }

    conditions[key as keyof Conditions] = matches[0];
  }

  return conditions;
}

/**
 * Returns whether the umamusume satisfies passed aptitude restrictions
 * on initial inheritance event.
 * @param umamusume the umamusume
 * @param conditions aptitude restrictions
 * @returns if the umamusume can meet the aptitude conditions
 */
function meetsConditions(umamusume: Umamusume, conditions: Conditions) {
  if (!conditions) {
    return true;
  }

  const names = [
    '잔디',
    '더트',
    '단거리',
    '마일',
    '중거리',
    '장거리',
    '도주',
    '선행',
    '선입',
    '추입',
  ];

  const map = new Map<string, number>();

  umamusume.aptitude.forEach((rank, index) => {
    const name = names[index];
    const factors = getRequiredFactors(rank);
    map.set(name, factors);
  });

  const totalRequiredFactors = Object.values(conditions)
    .map((name) => map.get(name))
    .filter(nonNullable)
    .reduce((sum, factors) => sum + factors, 0);

  return totalRequiredFactors <= 10;
}

/**
 * Picks an arbitrary umamusume matching the given username.
 * @param umamusume the umamusume
 * @param conditions aptitude restrictions
 * @returns picked umamusume object
 */
function generateAptitude(umamusume: Umamusume, conditions: Conditions) {
  const names = [
    '잔디',
    '더트',
    '단거리',
    '마일',
    '중거리',
    '장거리',
    '도주',
    '선행',
    '선입',
    '추입',
  ];

  const factors = umamusume.aptitude.map((rank, index) => ({
    name: names[index],
    factors: getRequiredFactors(rank),
  }));

  const trackSurface = conditions.trackSurface
    ? factors.filter(({ name }) => name === conditions.trackSurface)
    : factors.slice(0, 2);

  const trackLength = conditions.trackLength
    ? factors.filter(({ name }) => name === conditions.trackLength)
    : factors.slice(2, 6);

  const strategy = conditions.strategy
    ? factors.filter(({ name }) => name === conditions.strategy)
    : factors.slice(6, 10);

  const combinations = [];

  for (const x of trackSurface) {
    for (const y of trackLength) {
      if (x.factors + y.factors > 10) {
        continue;
      }
      for (const z of strategy) {
        if (x.factors + y.factors + z.factors > 10) {
          continue;
        }
        combinations.push([x, y, z]);
      }
    }
  }

  const randomAptitude = random(combinations)
    .map(({ name }) => name)
    .filter((name) => name !== '잔디') // skip `turf` which can easily be implied.
    .join(' ');

  return randomAptitude;
}

/**
 * Returns how many factor(star)s are required to reach the rank A aptitude.
 * @param rank aptitude rank letter described by an alphabet between A-G.
 * @returns required number of factor stars
 */
function getRequiredFactors(rank: string) {
  const offset = getAlphabetOffset(rank);
  const factors = offset === 0 ? 0 : (offset - 1) * 3 + 1;
  return factors;
}

export default command;
