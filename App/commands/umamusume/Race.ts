import dedent from 'dedent';
import { SlashCommandBuilder, underscore } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';

import { Database } from '../../classes';
import type { CommandConfig } from '../../models';
import { endsWithJongSeong, fetchData } from '../../utils';
import type { Race, RaceTrack } from './types';

const races = new Database<Race>();
const tracks = new Database<RaceTrack>();

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
  async prepare() {
    try {
      const promises = [
        'database/umamusume/race.json',
        'database/umamusume/racetrack.json',
      ].map((path) => fetchData(path));

      const [raceList, raceTrackList] = await Promise.all(promises);

      races.addAll(raceList as Race[], 'name');
      tracks.addAll(raceTrackList as RaceTrack[], 'id');
    } catch (e) {
      console.debug(e);
      console.error('Failed to establish race list.');
    }
  },
  async interact(interaction) {
    const name = interaction.options.getString('이름', true);

    await interaction.reply(
      `'${name}'${endsWithJongSeong(name) ? '으' : ''}로 레이스를 검색할게.`,
    );

    let race = races.find(name);

    if (race instanceof Collection) {
      const [first, ...rest] = [...race.keys()];

      await interaction.followUp(
        `가장 가까운 ${underscore(
          first,
        )}의 결과를 보여줄게. 이런 데이터도 찾았어.\n${rest.join(', ')}`,
      );

      race = race.first()!;
    }

    if (!race) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    const track = tracks.find(race.trackId);

    if (!track || track instanceof Collection) {
      interaction.followUp(`${race.name} 경기장 데이터베이스에 문제가 있어.`);
      return;
    }

    const embed = createResultEmbed({ race, track });
    interaction.channel?.send({ embeds: [embed] });
  },
  async respond(message, [name]) {
    let race = races.find(name);

    if (race instanceof Collection) {
      const [first, ...rest] = [...race.keys()];

      await message.reply(
        `가장 가까운 ${underscore(
          first,
        )}의 결과를 보여줄게. 이런 데이터도 찾았어.\n${rest.join(', ')}`,
      );

      race = race.first()!;
    }

    if (!race) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    const track = tracks.find(race.trackId);

    if (!track || track instanceof Collection) {
      message.reply(`${race.name} 경기장 데이터베이스에 문제가 있어.`);
      return;
    }

    const embed = createResultEmbed({ race, track });
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
