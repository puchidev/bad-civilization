import { bold, underscore, SlashCommandBuilder } from '@discordjs/builders';
import type BigNumber from 'bignumber.js';
import { MessageEmbed } from 'discord.js';
import type { EmbedFieldData, User } from 'discord.js';
import chunk from 'lodash/chunk';

import type { CommandConfig } from '#App/models';
import { getArguments } from '#App/utils';
import { games } from './partials/database';
import { roll } from './partials/roll';
import type { GachaGame, GachaPull } from './partials/types';

interface Props {
  params: {
    name: string;
    times: number;
  };
  requestor: User;
}

const DEFAULT_PULL_SIZE = 10;
const MIN_PULL_SIZE = 1;
const MAX_PULL_SIZE = 60;

const command: CommandConfig<Props> = {
  data: new SlashCommandBuilder()
    .setName('가챠')
    .setDescription('가챠아ㅏ가챠다아아ㅏ앗 돌리고 또 돌린다아아')
    .addStringOption((option) =>
      option
        .setName('종류')
        .setDescription('돌리려는 가챠의 종류')
        .setRequired(true)
        .addChoices(
          { name: '말', value: '말' },
          { name: '서폿', value: '서폿' },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName('횟수')
        .setDescription(`가챠를 돌릴 횟수 (기본 ${DEFAULT_PULL_SIZE}회)`)
        .setMinValue(MIN_PULL_SIZE)
        .setMaxValue(MAX_PULL_SIZE),
    ),
  async execute({ params: { name, times }, requestor }) {
    if (!name) {
      return `돌릴 가챠를 입력해 줘. 지금은 이런 것들이 가능해. ${bold(
        [...games.keys()].join(', '),
      )}.`;
    }

    if (
      !Number.isInteger(times) ||
      times < MIN_PULL_SIZE ||
      MAX_PULL_SIZE < times
    ) {
      return `돌릴 횟수는 ${MIN_PULL_SIZE}~${MAX_PULL_SIZE} 사이의 수를 입력해 줘.`;
    }

    const game = games.get(name);

    if (!game) {
      return '처음 듣는 가챠인데?';
    }

    const { pulls, topPullCount, topPullRates } = roll({ game, times });

    const title = createResultTitle({
      game,
      times,
      topPullCount,
      topPullRates,
      username: requestor.username,
    });
    const embed = createResultEmbed({ game, pulls });

    return { content: title, embeds: [embed] };
  },
  parseInteraction(interaction) {
    const name = interaction.options.getString('종류', true);
    const times = interaction.options.getInteger('횟수') ?? DEFAULT_PULL_SIZE;
    const requestor = interaction.user;

    return { params: { name, times }, requestor };
  },
  parseMessage(message) {
    const requestor = message.author;

    const { numbers, strings } = getArguments(message);
    const name = strings[0] ?? '';
    const times = numbers[0] ?? DEFAULT_PULL_SIZE;

    return { params: { name, times }, requestor };
  },
};

/**
 * Creates the title for gacha result message.
 * @param arg options
 * @returns result message's title
 */
function createResultTitle({
  game,
  times,
  topPullCount,
  topPullRates,
  username,
}: {
  game: GachaGame;
  times: number;
  topPullCount: number;
  topPullRates: BigNumber;
  username: string;
}) {
  const topGroupName = game.groups[0].name;
  const topGroupRates = game.groups[0].rates;
  const pulledAboveAverage = topPullRates.isGreaterThan(topGroupRates);

  const timesText = times === 1 ? '단챠' : `${times}연챠`;
  const resultText =
    topPullCount === 0
      ? `의욕을 잃었다…😷`
      : `${topPullCount}개의 ${topGroupName}을 손에 넣었다${
          pulledAboveAverage ? '!✨' : '🤔'
        }`;

  return `${username}는 ${game.name} ${timesText}로 ${resultText}`;
}

/**
 * Creates a message embed containing detailed gacha result.
 * @param arg options
 * @returns created message embed
 */
function createResultEmbed({
  game,
  pulls,
}: {
  game: GachaGame;
  pulls: GachaPull[];
}) {
  const fields = chunk(pulls, game.rules.sessionSize).map<EmbedFieldData>(
    (chunk, chunkIndex) => {
      const name = `${(chunkIndex + 1) * game.rules.sessionSize}연째`;
      const value = chunk
        .map(({ member, group }) => {
          if (!group) {
            throw new Error('no group');
          }
          if (!member) {
            throw new Error('no member');
          }
          const pullText = `${group.name} ${member.name}`;

          switch (group.tier) {
            case 1:
              return bold(underscore(pullText));

            case 2:
              return bold(pullText);

            default:
              return pullText;
          }
        })
        .join('\n');

      return { name, value, inline: true };
    },
  );

  const embed = new MessageEmbed();

  fields.forEach((field) => embed.addFields(field));

  return embed;
}

export default command;
