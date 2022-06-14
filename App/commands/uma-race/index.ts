import { SlashCommandBuilder, underscore } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';

import { Database } from '../../classes';
import type { CommandConfig } from '../../models';
import { endsWithJongSeong, fetchData } from '../../utils';
import { formatBasicInfo, formatCourseInfo } from './utils';
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
      const promises = ['umamusume/race.json', 'umamusume/racetrack.json'].map(
        (path) => fetchData(path),
      );
      const [raceList, raceTrackList] = await Promise.all(promises);

      races.addAll(raceList as Race[], 'name');
      tracks.addAll(raceTrackList as RaceTrack[], 'id');
    } catch (e) {
      console.debug(e);
      console.error('Failed to establish race list.');
    }
  },
  async execute(interaction) {
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

    const embed = new MessageEmbed()
      .setTitle(`${race.name} 경기장 정보`)
      .addFields(
        { name: '기본정보', value: formatBasicInfo(track) },
        { name: '코스', value: formatCourseInfo(track) },
      )
      .setImage(track.map);

    interaction.channel?.send({ embeds: [embed] });
  },
};

export default command;
