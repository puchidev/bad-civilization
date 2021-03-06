/* eslint-disable no-irregular-whitespace */
import dayjs from 'dayjs';
import dedent from 'dedent';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getArguments } from '#App/utils';
import { convertAliases } from './partials/aliases';
import { pickupRefs, pickups } from './partials/database';

import type { CommandConfig } from '#App/models';

const SERVICE_START_JAPAN = '2021-02-24';
const SERVICE_START_KOREA = '2022-06-20';
const PICKUP_OFFSET_DAYS =
  dayjs(SERVICE_START_KOREA).diff(SERVICE_START_JAPAN, 'day') + 1; // 1 (초기 미래시 오차)
const DATE_OUTPUT_FORMAT = 'YYYY년 MM월 DD일 (ddd) A h:mm';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('픽업')
    .setDescription('말딸 픽업 일정을 보여줘')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('서폿')
        .setDescription('서포트 카드 픽업 일정을 보여줘')
        .addStringOption((option) =>
          option
            .setName('이름')
            .setDescription(
              '찾는 서포트 카드의 이름 일부 (ex. SSR 지능 세이운)',
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('말')
        .setDescription('육성 말딸 픽업 일정을 보여줘')
        .addStringOption((option) =>
          option
            .setName('이름')
            .setDescription('찾는 말딸의 이름 일부')
            .setRequired(true),
        ),
    ),
  async execute({ subcommand, params }) {
    if (!subcommand) {
      return '어떤 픽업을 원하는지 알려줘. `!픽업 말` `!픽업 서폿`';
    }

    if (!params) {
      return `검색어를 입력해줘. \`픽업 ${subcommand}\ 키타산\``;
    }

    const keyword: string = convertAliases(params.join(' '));

    const { match: pickupRef, suggestions } = pickupRefs.search(keyword, {
      strategy: 'match',
      test: (ref) => ref.type === subcommand,
    });

    if (!pickupRef) {
      return '아무 것도 찾지 못했어…';
    }

    const matches = [
      ...pickups
        .filter((_pickup, key) => pickupRef.pickupIds.has(key))
        .values(),
    ];

    const fields = matches.map((pickup) => {
      const { since, until, sinceKR, untilKR, umamusume, support } = pickup;

      const $since = dayjs(since);
      const $until = dayjs(until);
      const diff = $until.diff($since, 'day') + 1;

      const $sinceKR = sinceKR
        ? dayjs(sinceKR)
        : $since.add(PICKUP_OFFSET_DAYS, 'days');
      const $untilKR = untilKR
        ? dayjs(untilKR)
        : $until.add(PICKUP_OFFSET_DAYS, 'days');

      const period = `${$since.format(DATE_OUTPUT_FORMAT)} ~ ${$until.format(
        DATE_OUTPUT_FORMAT,
      )} (${diff}일간)`;
      const periodKR = `${$sinceKR.format(
        DATE_OUTPUT_FORMAT,
      )} ~ ${$untilKR.format(DATE_OUTPUT_FORMAT)} (${diff}일간)`;

      const name = (subcommand === '말' ? umamusume : support).join('\n');
      const value = dedent`
        🇯🇵 ${period}
        🇰🇷 ${periodKR}
      `;

      return { name, value };
    });

    const embed = new EmbedBuilder()
      .setTitle(`${subcommand} 픽업 정보`)
      .addFields(fields);

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

    const subcommand = interaction.options.getSubcommand();
    const keyword = interaction.options.getString('이름', true);

    return {
      subcommand,
      params: [keyword],
    };
  },
  parseMessage(message) {
    const {
      strings: [subcommand, ...keywords],
    } = getArguments(message);

    return {
      subcommand,
      params: keywords,
    };
  },
};

export default command;
