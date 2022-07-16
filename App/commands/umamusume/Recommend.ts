import { bold, SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { MessageEmbed, User } from 'discord.js';

import type { CommandConfig } from '#App/models';
import {
  endsWithJongSeong,
  getAlphabetOffset,
  nonNullable,
  random,
} from '#App/utils';
import { umamusumes } from './partials/database';
import type { Umamusume } from './partials/types';

interface Conditions {
  trackSurface?: string;
  trackLength?: string;
  strategy?: string;
}

interface Props {
  params: {
    conditions?: string[];
    factors: number;
    server: string;
  };
  requestor: User;
}

const DEFAULT_FACTORS = 10;
const DEFAULT_SERVER = 'japan';

const preset: Record<string, string[]> = {
  '270871717654691850': [
    '토카이 테이오',
    '오구리 캡',
    '골드 쉽',
    '보드카',
    '다이와 스칼렛',
    '그래스 원더',
    '에어 그루브',
    '마야노 탑건',
    '메지로 라이언',
    '위닝 티켓',
    '사쿠라 바쿠신 오',
    '하루우라라',
    '나이스 네이처',
    '킹 헤일로',
  ],
};

const command: CommandConfig<Props> = {
  data: new SlashCommandBuilder()
    .setName('뭐키우지')
    .setDescription('키울 만한 말딸을 추천해줘')
    .addStringOption((option) =>
      option
        .setName('조건')
        .setDescription('마장, 거리, 각질 조건 (띄어쓰기로 구분)'),
    )
    .addStringOption((option) =>
      option
        .setName('서버')
        .setDescription('플레이하는 말딸 서버의 종류')
        .addChoices(
          { name: '일본', value: 'japan' },
          { name: '한국', value: 'korea' },
        ),
    )
    .addIntegerOption((option) =>
      option.setName('인자').setDescription('개조에 사용할 인자 갯수 (0~10)'),
    ),
  async execute({ params, requestor }) {
    const { factors, server } = params;
    const conditions = parseConditions(params.conditions);

    const character = umamusumes
      .filter((uma) => {
        // use preset for predefined users
        if (requestor.id in preset) {
          return preset[requestor.id].includes(uma.name);
        }
        // skip unimplemented umamusumes
        if (!uma.presence) {
          return false;
        }
        // use server-specific umamusume list
        if (server === 'korea') {
          return uma.presence.includes('k');
        }
        return true;
      })
      .filter((uma) => meetsConditions({ umamusume: uma, conditions, factors }))
      .random();

    if (!character) {
      return '말딸 데이터를 찾지 못했어…';
    }

    const aptitude = generateAptitude({
      umamusume: character,
      conditions,
      factors,
    });
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
    const requestor = interaction.user;
    const conditions = interaction.options.getString('조건')?.split(/ +/g);
    const server = interaction.options.getString('서버') ?? DEFAULT_SERVER;
    const factors = interaction.options.getInteger('인자') ?? DEFAULT_FACTORS;

    return { params: { conditions, factors, server }, requestor };
  },
  parseMessage(message) {
    const requestor = message.author;
    const [, ...params] = message.content.trim().split(/ +/g);

    const conditions = params.filter((param) =>
      /^(?!japan|korea)(.+)$/.test(param),
    );
    const numericParam = params.find((param) =>
      Number.isInteger(parseInt(param, 10)),
    );
    const factors = numericParam ? parseInt(numericParam, 10) : DEFAULT_FACTORS;
    const server = params.includes('한국') ? 'korea' : DEFAULT_SERVER;

    return { params: { conditions, factors, server }, requestor };
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
 * @param options operation options
 * @param options.umamusume the umamusume
 * @param options.conditions aptitude restrictions
 * @param options.factors available number of factors
 * @returns if the umamusume can meet the aptitude conditions
 */
function meetsConditions(options: {
  conditions: Conditions;
  factors: number;
  umamusume: Umamusume;
}) {
  const { conditions, factors, umamusume } = options;

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
    .reduce((sum, requiredFactors) => sum + requiredFactors, 0);

  return totalRequiredFactors <= factors;
}

/**
 * Picks an arbitrary umamusume matching the given username.
 * @param options operation options
 * @param options.umamusume the umamusume
 * @param options.conditions aptitude restrictions
 * @param options.factors available number of factors
 * @returns picked umamusume object
 */
function generateAptitude(options: {
  conditions: Conditions;
  factors: number;
  umamusume: Umamusume;
}) {
  const { conditions, factors, umamusume } = options;

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

  const requiredFactors = umamusume.aptitude.map((rank, index) => ({
    name: names[index],
    factors: getRequiredFactors(rank),
  }));

  const trackSurface = conditions.trackSurface
    ? requiredFactors.filter(({ name }) => name === conditions.trackSurface)
    : requiredFactors.slice(0, 2);

  const trackLength = conditions.trackLength
    ? requiredFactors.filter(({ name }) => name === conditions.trackLength)
    : requiredFactors.slice(2, 6);

  const strategy = conditions.strategy
    ? requiredFactors.filter(({ name }) => name === conditions.strategy)
    : requiredFactors.slice(6, 10);

  const combinations = [];

  for (const x of trackSurface) {
    for (const y of trackLength) {
      if (x.factors + y.factors > factors) {
        continue;
      }
      for (const z of strategy) {
        if (x.factors + y.factors + z.factors > factors) {
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
