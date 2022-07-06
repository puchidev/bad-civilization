/* eslint-disable no-irregular-whitespace */
import { SlashCommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import dedent from 'dedent';
import { MessageEmbed } from 'discord.js';

import { Database } from '#App/classes';
import type { CommandConfig } from '#App/models';
import { endsWithJongSeong, fetchData } from '#App/utils';

interface PickupPeriod {
  since: string;
  until: string;
  sinceKR?: string;
  untilKR?: string;
}

interface PickupRawData extends PickupPeriod {
  umamusume: string[];
  support: string[];
}

interface Pickup extends PickupPeriod {
  members: string[];
}

const SERVICE_START_JAPAN = '2021-02-24';
const SERVICE_START_KOREA = '2022-06-20';
const PICKUP_OFFSET_DAYS =
  dayjs(SERVICE_START_KOREA).diff(SERVICE_START_JAPAN, 'day') + 1; // 1 (초기 미래시 오차)
const DATE_OUTPUT_FORMAT = 'YYYY년 MM월 DD일 (ddd) A h:mm';

const umaPickups = new Database<Pickup>();
const supportPickups = new Database<Pickup>();

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
  async prepare() {
    try {
      const pickupList: PickupRawData[] = await fetchData(
        'database/umamusume/pickups.json',
      );

      pickupList.forEach(
        ({ since, until, sinceKR, untilKR, umamusume, support }) => {
          const umamusumeKey = umamusume.slice().join(' ');
          const supportKey = support.slice().join(' ');

          umaPickups.set(umamusumeKey, {
            since,
            until,
            sinceKR,
            untilKR,
            members: umamusume,
          });

          supportPickups.set(supportKey, {
            since,
            until,
            sinceKR,
            untilKR,
            members: support,
          });
        },
      );
    } catch (e) {
      console.debug(e);
      console.error('Failed to establish umamusume pickup list.');
    }
  },
  async interact(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const name = interaction.options.getString('이름', true);

    await interaction.reply(
      `'${name}'${endsWithJongSeong(name) ? '으' : ''}로 픽업을 검색할게.`,
    );

    const { match } =
      subcommand === '말'
        ? umaPickups.search(name, { all: true })
        : supportPickups.search(name, { all: true });

    if (!match) {
      interaction.followUp('아무 것도 찾지 못했어…');
      return;
    }

    const embed = createResultEmbed(match, subcommand);
    interaction.channel?.send({ embeds: [embed] });
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
    const { match } =
      subcommand === '말'
        ? umaPickups.search(keyword, { all: true })
        : supportPickups.search(keyword, { all: true });

    if (!match) {
      message.reply('아무 것도 찾지 못했어…');
      return;
    }

    const embed = createResultEmbed(match, subcommand);
    message.reply({ embeds: [embed] });
  },
};

/**
 * Generate a human friendly text describing the pickup gacha passed.
 * @param pickups list of pickup gacha
 * @param category pickup category
 * @returns formatted gacha pickup
 */
function createResultEmbed(pickups: Pickup[], category: string) {
  const fields = pickups.map((pickup) => {
    const { since, until, sinceKR, untilKR, members } = pickup;

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

    const name = members.join('\n');
    const value = dedent`
      🇯🇵 ${period}
      🇰🇷 ${periodKR}
    `;

    return { name, value };
  });

  const embed = new MessageEmbed()
    .setTitle(`${category} 픽업 정보`)
    .addFields(fields);

  return embed;
}

export default command;
