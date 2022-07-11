/* eslint-disable no-irregular-whitespace */
import { SlashCommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import dedent from 'dedent';
import { MessageEmbed } from 'discord.js';

import type { CommandConfig } from '#App/models';
import { pickupRefs, pickups } from './partials/database';
import type { Pickup } from './partials/types';

const SERVICE_START_JAPAN = '2021-02-24';
const SERVICE_START_KOREA = '2022-06-20';
const PICKUP_OFFSET_DAYS =
  dayjs(SERVICE_START_KOREA).diff(SERVICE_START_JAPAN, 'day') + 1; // 1 (초기 미래시 오차)
const DATE_OUTPUT_FORMAT = 'YYYY년 MM월 DD일 (ddd) A h:mm';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('픽업')
    .setDescription('우마무스메 픽업 일본/한국 일정을 찾아보자')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('서폿')
        .setDescription('서포트 카드 픽업 일정을 보여줘')
        .addStringOption((option) =>
          option
            .setName('이름')
            .setDescription(
              '찾는 서포트 카드의 이름 일부 (ex. SSR 스피드 키타산)',
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
  async interact(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const keyword = interaction.options.getString('이름', true);

    const { match: matchingRef, suggestions } = pickupRefs.search(keyword, {
      test: (record) => record.type === subcommand,
    });

    if (!matchingRef) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    const match = [
      ...pickups
        .filter((_pickup, key) => matchingRef.pickupIds.has(key))
        .values(),
    ];

    interaction.followUp({
      embeds: [
        createResultEmbed({
          pickups: match,
          category: subcommand,
          suggestions,
        }),
      ],
    });
  },
  async respond(message, [subcommand, ...keywords]) {
    if (!/^(?:말|서폿)$/.test(subcommand)) {
      message.reply('어떤 픽업을 원하는지 알려줘. `!픽업 말` `!픽업 서폿`');
      return;
    }

    if (keywords.length === 0) {
      message.reply(`검색어를 입력해줘. \`픽업 ${subcommand}\ 키타산\``);
      return;
    }

    const keyword = keywords.join(' ');

    const { match: matchingRef, suggestions } = pickupRefs.search(keyword, {
      test: (record) => record.type === subcommand,
    });

    if (!matchingRef) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    const match = [
      ...pickups
        .filter((_pickup, key) => matchingRef.pickupIds.has(key))
        .values(),
    ];

    message.reply({
      embeds: [
        createResultEmbed({
          pickups: match,
          category: subcommand,
          suggestions,
        }),
      ],
    });
  },
};

/**
 * Generate a human friendly text describing the pickup gacha passed.
 * @param options option object
 * @param options.pickups list of pickup gacha
 * @param options.category pickup category
 * @param options.suggestions other search result that the user might want
 * @returns formatted gacha pickup
 */
function createResultEmbed(options: {
  pickups: Pickup[];
  category: string;
  suggestions?: string[];
}) {
  const { pickups, category, suggestions } = options;

  const fields = pickups.map((pickup) => {
    const { since, until, sinceKR, untilKR, umamusume, support } = pickup;

    const sinceDate = dayjs(since);
    const untilDate = dayjs(until);
    const sinceDateKR = sinceKR
      ? dayjs(sinceKR)
      : sinceDate.add(PICKUP_OFFSET_DAYS, 'days');
    const untilDateKR = untilKR
      ? dayjs(untilKR)
      : untilDate.add(PICKUP_OFFSET_DAYS, 'days');

    const period = [
      sinceDate.format(DATE_OUTPUT_FORMAT),
      untilDate.format(DATE_OUTPUT_FORMAT),
    ].join(' ~ ');
    const periodKR = [
      sinceDateKR.format(DATE_OUTPUT_FORMAT),
      untilDateKR.format(DATE_OUTPUT_FORMAT),
    ].join(' ~ ');

    const name = (category === '말' ? umamusume : support).join('\n');
    const value = dedent`
      🇯🇵 ${period}
      🇰🇷 ${periodKR}
    `;

    return { name, value };
  });

  const embed = new MessageEmbed()
    .setTitle(`${category} 픽업 정보`)
    .addFields(fields);

  if (suggestions) {
    embed.setFooter({ text: `유사한 검색어: ${suggestions.join(', ')}` });
  }

  return embed;
}

export default command;
