import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getArguments } from '#App/utils';
import { convertAliases } from './partials/aliases';
import { races, raceTracks } from './partials/database';

import type { CommandConfig } from '#App/models';
import type { RaceTrackRange } from './partials/types';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('레이스')
    .setDescription('경마장 맵 정보를 알려줘')
    .addStringOption((option) =>
      option
        .setName('이름')
        .setDescription('레이스 이름의 일부 (ex. 아리마, 야스, …)')
        .setRequired(true),
    ),
  ephemeral: true,
  async execute({ params }) {
    if (!params) {
      return `검색할 경마장의 이름 일부를 입력해줘.`;
    }

    const keywords = convertAliases(params.join(' '));
    const { match: race, suggestions } = races.search(keywords, {
      strategy: 'similarity',
    });

    if (!race) {
      return '아무 것도 찾지 못했어…';
    }

    const track = raceTracks.get(race.trackId);

    if (!track) {
      throw new Error(`No matching race track of id: ${race.trackId}`);
    }

    const trackInfo = [
      track.racetrack,
      track.terrain,
      `${track.length}m (${getLengthType(track.length)})`,
      `${[track.direction, track.course].filter(Boolean).join(', ')}`,
      `${track.statusRef ? track.statusRef.join(', ') + ' 보정' : '무보정'}`,
    ].join(' | ');

    const legs = track.legs.map(formatRange).join('\n');
    const slopes = track.slopes.map(formatRange).join('\n') || '없음';
    const segments = track.segments.map(formatRange).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`${race.name} 경기장 정보`)
      .setDescription(trackInfo)
      .addFields(
        { name: '구분', value: legs },
        { name: '언덕', value: slopes },
        { name: '시퀀스', value: segments },
      )
      .setImage(track.map);

    if (suggestions) {
      embed.setFooter({ text: `유사한 검색어: ${suggestions.join(', ')}` });
    }

    return {
      embeds: [embed],
    };
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const name = interaction.options.getString('이름', true);

    return { params: [name] };
  },
  parseMessage(message) {
    const { strings: keywords } = getArguments(message);
    return { params: keywords };
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
 * Transforms a track range to human-readable text.
 * @param range course range object
 * @returns human-readable range string
 */
function formatRange(range: RaceTrackRange) {
  return `${range.type} ― ${range.from}~${range.to}m`;
}

export default command;
