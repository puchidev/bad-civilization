import {
  bold,
  ChannelType,
  EmbedBuilder,
  SlashCommandBuilder,
  underscore,
} from 'discord.js';
import chunk from 'lodash/chunk';
import { endsWithJongSeong, getArguments } from '#App/utils';
import { games } from './partials/database';
import { roll } from './partials/roll';

import type {
  APIEmbedField,
  ChannelType as ChannelTypeType,
  User,
} from 'discord.js';
import type { CommandConfig } from '#App/models';
import type { GachaGame, GachaPull, GachaResult } from './partials/types';

interface Props {
  channelType?: ChannelTypeType | null;
  params: {
    name: string;
    times: number;
  };
  requestor: User;
}

const DEFAULT_PULL_SIZE = 10;
const MIN_PULL_SIZE = 1;
const MAX_PULL_SIZE = 200;
const MAX_PULL_SIZE_INSIDE_CHANNEL = 30;
const UNIT_PRICE = 150;

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
  async execute({ channelType, params: { name, times }, requestor }) {
    const isThread =
      channelType === ChannelType.GuildPrivateThread ||
      channelType === ChannelType.GuildPublicThread;
    const maxSize = isThread ? MAX_PULL_SIZE : MAX_PULL_SIZE_INSIDE_CHANNEL;

    if (!name) {
      return `돌릴 가챠를 입력해 줘. 지금은 이런 것들이 가능해. ${bold(
        [...games.keys()].join(', '),
      )}.`;
    }

    if (!Number.isInteger(times) || times < MIN_PULL_SIZE || maxSize < times) {
      return `돌릴 횟수는 ${MIN_PULL_SIZE} ~ ${maxSize} 사이의 정수를 입력해 줘.`;
    }

    const game = games.get(name);

    if (!game) {
      return '처음 듣는 가챠인데?';
    }

    const { pulls, topPullCount, topPullRates } = roll({ game, times });

    const title = createResultTitle({
      game,
      times,
      pulls,
      topPullCount,
      topPullRates,
      username: requestor.username,
    });
    const embed = createResultEmbed({ game, pulls });

    return { content: title, embeds: [embed] };
  },
  parseInteraction(interaction) {
    if (!interaction.isChatInputCommand()) {
      throw new Error('Expected a chat input command.');
    }

    const channelType = interaction.channel?.type;
    const requestor = interaction.user;

    const name = interaction.options.getString('종류', true);
    const times = interaction.options.getInteger('횟수') ?? DEFAULT_PULL_SIZE;

    return { channelType, params: { name, times }, requestor };
  },
  parseMessage(message) {
    const channelType = message.channel.type;
    const requestor = message.author;

    const { numbers, strings } = getArguments(message);
    const name = strings[0] ?? '';
    const times = numbers[0] ?? DEFAULT_PULL_SIZE;

    return { channelType, params: { name, times }, requestor };
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
  pulls,
  topPullCount,
  topPullRates,
  username,
}: GachaResult & {
  game: GachaGame;
  times: number;
  username: string;
}) {
  const topGroupName = game.groups[0].name;
  const topGroupRates = game.groups[0].rates;
  const pulledAboveAverage = topPullRates.isGreaterThan(topGroupRates);

  const topPulls = new Map<string, number>();

  pulls
    .filter((pull) => pull.group.name === topGroupName)
    .forEach((pull) => {
      const { name } = pull.member;
      const currentCount = topPulls.get(name) ?? 0;
      topPulls.set(name, currentCount + 1);
    });

  const line1 = [
    `${username}${endsWithJongSeong(username) ? '은' : '는'}`,
    `${game.name} ${times === 1 ? '단챠' : `${times}연챠`}에`,
    `${times * UNIT_PRICE}쥬얼을 사용해`,
    topPullCount === 0
      ? `의욕을 잃었다…😷`
      : `${topPullCount}개의 ${topGroupName}을 손에 넣었다${
          pulledAboveAverage ? '!✨' : '🤔'
        }`,
  ].join(' ');

  const line2 = [...topPulls.entries()]
    .map(([name, count]) => `・${name} ×${count}`)
    .join('\n');

  return [line1, line2].join('\n');
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
  const fields = chunk(pulls, game.rules.sessionSize).map<APIEmbedField>(
    (chunk, chunkIndex, chunks) => {
      const isLastChunk = chunkIndex === chunks.length - 1;
      const pullTimes = isLastChunk
        ? pulls.length
        : (chunkIndex + 1) * game.rules.sessionSize;

      const name = `${pullTimes}연째`;
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

  const embed = new EmbedBuilder();

  fields.forEach((field) => embed.addFields(field));

  return embed;
}

export default command;
