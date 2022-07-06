import { bold, SlashCommandBuilder } from '@discordjs/builders';
import dedent from 'dedent';
import { MessageEmbed } from 'discord.js';

import type { CommandConfig } from '#App/models';
import { endsWithJongSeong } from '#App/utils';
import { races, raceTracks } from './database';
import type { Race, RaceTrack } from './types';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('레이스')
    .setDescription('경마장 맵을 검색해 보자')
    .addStringOption((option) =>
      option
        .setName('이름')
        .setDescription('레이스 이름의 일부 (ex. 아리마, 야스, …)')
        .setRequired(true),
    ),
  async interact(interaction) {
    const name = interaction.options.getString('이름', true);

    await interaction.reply(
      `'${name}'${endsWithJongSeong(name) ? '으' : ''}로 레이스를 검색할게.`,
    );

    const { match: matchingRace, suggestions } = races.search(name);

    if (!matchingRace) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    if (suggestions) {
      await interaction.followUp(dedent`
        찾는 건 ${bold(matchingRace.name)}일까?
        다른 검색결과: ||${suggestions.join(', ')}||
      `);
    }

    const matchingTrack = raceTracks.get(matchingRace.trackId);

    if (!matchingTrack) {
      throw new Error(`No matching race track of id: ${matchingRace.trackId}`);
    }

    const embed = createResultEmbed({
      race: matchingRace,
      track: matchingTrack,
    });
    interaction.channel?.send({ embeds: [embed] });
  },
  async respond(message, keywords) {
    const { match: matchingRace, suggestions } = races.search(
      keywords.join(' '),
    );

    if (!matchingRace) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    if (suggestions) {
      await message.reply(dedent`
        찾는 건 ${bold(matchingRace.name)}일까?
        다른 검색결과: ||${suggestions.join(', ')}||
      `);
    }

    const matchingTrack = raceTracks.get(matchingRace.trackId);

    if (!matchingTrack) {
      throw new Error(`No matching race track of id: ${matchingRace.trackId}`);
    }

    const embed = createResultEmbed({
      race: matchingRace,
      track: matchingTrack,
    });
    message.reply({ embeds: [embed] });
  },
};

/**
 * Transforms a race track length to human-readable text.
 * @param length length of race track
 * @returns text representing the type of race
 */
function getLengthType(length: number) {
  if (length > 2400) {
    return '장거리';
  }
  if (length > 1800) {
    return '중거리';
  }
  if (length > 1400) {
    return '마일';
  }
  return '단거리';
}

/**
 * Creates basic info text of a race track.
 * @param track information about the track
 * @returns basic information text
 */
function formatBasicInfo(track: RaceTrack) {
  const { racetrack, statusRef, terrain, length } = track;
  const lengthType = getLengthType(length);
  let output = `${racetrack} | ${terrain} | ${length}m (${lengthType})`;

  if (statusRef) {
    output += ` | ${statusRef.join(', ')} 보정`;
  }

  return output;
}

/**
 * Creates detailed course info text of a race track.
 * @param track information about the track
 * @returns course information text
 */
function formatCourseInfo(track: RaceTrack) {
  const {
    course: {
      straight,
      corner,
      finalCorner,
      finalStraight,
      uphill,
      downhill,
      openingLeg,
      middleLeg,
      finalLeg,
    },
  } = track;

  const output = dedent`
    직선 — ${formatCourseRange(straight)}
    코너 — ${formatCourseRange(corner)}
    최종 코너 — ${formatCourseRange(finalCorner)}
    최종 직선 — ${formatCourseRange(finalStraight)}
    오르막 — ${formatCourseRange(uphill)}
    내리막 — ${formatCourseRange(downhill)}
    초반 — ${formatCourseRange(openingLeg)}
    중반 — ${formatCourseRange(middleLeg)}
    종반 — ${formatCourseRange(finalLeg)}
  `.trim();

  return output;
}

/**
 * Reformats a string representing course range(s) to be more readable.
 * @param ranges a course range or multiple ranges (or nothing if non-existant)
 * @returns formatted range
 */
function formatCourseRange(ranges: string | null) {
  if (!ranges) {
    return '없음';
  }

  return ranges
    .split(',')
    .map((range) => `${range}m`)
    .join(', ');
}

/**
 * Creates a message embed containing information about the found race.
 * @param option option object
 * @param option.race race
 * @param option.track race track
 * @returns created message embed
 */
function createResultEmbed({ race, track }: { race: Race; track: RaceTrack }) {
  const embed = new MessageEmbed()
    .setTitle(`${race.name} 경기장 정보`)
    .addFields(
      { name: '기본정보', value: formatBasicInfo(track) },
      { name: '코스', value: formatCourseInfo(track) },
    )
    .setImage(track.map);

  return embed;
}

export default command;
