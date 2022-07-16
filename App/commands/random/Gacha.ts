import { bold, underscore, SlashCommandBuilder } from '@discordjs/builders';
import type BigNumber from 'bignumber.js';
import { MessageEmbed } from 'discord.js';
import type { EmbedFieldData } from 'discord.js';
import chunk from 'lodash/chunk';

import type { CommandConfig } from '#App/models';
import { games } from './Gacha/database';
import { roll } from './Gacha/roll';
import type { GachaGame, GachaPull } from './Gacha/types';

const MAX_PULL_SIZE = 60;

const command: CommandConfig = {
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
        .setDescription('가챠를 돌릴 횟수')
        .setRequired(true)
        .addChoices(
          { name: '10연챠', value: 10 },
          { name: '20연챠', value: 20 },
          { name: '30연챠', value: 30 },
          { name: '40연챠', value: 40 },
          { name: '50연챠', value: 50 },
          { name: '60연챠', value: 60 },
        ),
    ),
  async execute({ params, requestor }) {
    if (!params || !requestor) {
      throw new Error('Params expected');
    }

    const [gameName, times] = params;
    const { username } = requestor;

    if (!gameName) {
      return `돌릴 가챠를 입력해 줘. 지금은 이런 것들이 가능해. ${bold(
        [...games.keys()].join(', '),
      )}.`;
    }

    if (isNaN(times)) {
      return `돌릴 가챠 횟수를 입력해 줘. 최대 60까지 가능해.`;
    }

    if (times > MAX_PULL_SIZE) {
      return `가챠는 ${MAX_PULL_SIZE}연챠까지만 가능해.`;
    }

    const game = games.get(gameName);

    if (!game) {
      return '처음 듣는 가챠인데?';
    }

    const { pulls, topPullCount, topPullRates } = roll({ game, times });

    const title = createResultTitle({
      game,
      times,
      topPullCount,
      topPullRates,
      username,
    });
    const embed = createResultEmbed({ game, pulls });

    return { content: title, embeds: [embed] };
  },
  parseInteraction(interaction) {
    const gameName = interaction.options.getString('종류', true);
    const times = interaction.options.getInteger('횟수', true);
    const requestor = interaction.user;

    return { params: [gameName, times], requestor };
  },
  parseMessage(message) {
    const [, name, times] = message.content.trim().split(/ +/g);
    const timesAsNumber = parseInt(times, 10);
    const requestor = message.author;

    return { params: [name, timesAsNumber], requestor };
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
