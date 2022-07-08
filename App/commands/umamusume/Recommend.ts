import { bold, SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

import type { CommandConfig } from '#App/models';
import { endsWithJongSeong, getAlphabetOffset, random } from '#App/utils';
import type { Umamusume } from './types';
import { umamusume } from './database';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('뭐키우지')
    .setDescription('키울 만한 말딸을 추천해줘'),
  async interact(interaction) {
    const character = umamusume
      .filter((uma) => uma.implemented !== false)
      .random();

    if (!character) {
      interaction.reply(`우마무스메 데이터를 찾지 못했어…`);
      return;
    }

    const aptitude = generateAptitude(character.aptitude);
    const sample = `${aptitude} ${bold(character.name)}`;
    const embed = createAptitudeEmbed(character);

    interaction.reply(
      `${sample}${endsWithJongSeong(character.name) ? '은' : '는'} 어때?`,
    );
    interaction.channel?.send({ embeds: [embed] });
  },
  async respond(message) {
    const character = umamusume
      .filter((uma) => uma.implemented !== false)
      .random();

    if (!character) {
      message.reply(`우마무스메 데이터를 찾지 못했어…`);
      return;
    }

    const aptitude = generateAptitude(character.aptitude);
    const sample = `${aptitude} ${bold(character.name)}`;
    const embed = createAptitudeEmbed(character);

    message.reply(
      `${sample}${endsWithJongSeong(character.name) ? '은' : '는'} 어때?`,
    );
    message.channel.send({ embeds: [embed] });
  },
};

/**
 * Picks an arbitrary umamusume matching the given username.
 * @param aptitude requestor's name.
 * @returns picked umamusume object.
 */
function generateAptitude(aptitude: Umamusume['aptitude']) {
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

  const factors = aptitude.map((rank, index) => ({
    name: names[index],
    factors: getRequiredFactors(rank),
  }));

  const trackLength = factors.slice(0, 2);
  const trackSurface = factors.slice(2, 6);
  const strategy = factors.slice(6, 10);

  const combinations = [];

  for (const x of trackLength) {
    for (const y of trackSurface) {
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

/**
 * Generate visually accessible aptitude map of given umamusume.
 * @param umamusume the uma musume
 * @returns umamusume's aptitude map
 */
function createAptitudeEmbed(umamusume: Umamusume) {
  const [a, b, c, d, e, f, g, h, i, j] = umamusume.aptitude;

  const aptitudeTemplate = `
    잔디 ${a} 더트 ${b}
    단거리 ${c} 마일 ${d} 중거리 ${e} 장거리 ${f}
    도주 ${g} 선행 ${h} 선입 ${i} 추입 ${j}
  `;

  const embed = new MessageEmbed()
    .setTitle(`${umamusume.name}의 적성`)
    .setDescription(aptitudeTemplate);

  return embed;
}

export default command;
