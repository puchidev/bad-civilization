import { bold, underscore, SlashCommandBuilder } from '@discordjs/builders';
import type BigNumber from 'bignumber.js';
import { MessageEmbed } from 'discord.js';
import type { EmbedFieldData } from 'discord.js';
import chunk from 'lodash/chunk';

import { RuntimeDatabase } from '#App/classes';
import { logger } from '#App/devtools';
import type { CommandConfig } from '#App/models';
import { fetchAllData } from '#App/utils';
import { createGame } from './Gacha/game';
import { roll } from './Gacha/roll';
import type { GachaGame, GachaGameConfig, GachaPull } from './Gacha/types';

const MAX_PULL_SIZE = 60;

const database = new RuntimeDatabase<GachaGame>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('가챠')
    .setDescription('가챠아ㅏ 가챠다아아ㅏ앗 돌리고 또 돌리는거야아아')
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
  async prepare() {
    try {
      const configs = await fetchAllData<GachaGameConfig>(
        'database/gacha/*.json',
      );

      configs.forEach((config) => {
        const game = createGame(config);
        database.add(game, 'name');
      });
    } catch (e) {
      logger.debug(e);
      console.error(`Failed to establish gacha game list.`);
    }
  },
  async interact(interaction) {
    const gameName = interaction.options.getString('종류', true);
    const times = interaction.options.getInteger('횟수', true);
    const game = database.get(gameName);

    if (!game) {
      interaction.reply('처음 듣는 가챠인데?');
      return;
    }

    const { pulls, topPullCount, topPullRates } = roll({ game, times });

    const title = createResultTitle({
      game,
      times,
      topPullCount,
      topPullRates,
      username: interaction.member?.user.username ?? '트레이너',
    });
    const embed = createResultEmbed({ game, pulls });

    await interaction.reply(title);
    interaction.channel?.send({ embeds: [embed] });
  },
  async respond(message, [gameName, timesString]) {
    const times = parseInt(timesString, 10);

    if (!gameName) {
      message.reply(
        `돌릴 가챠를 입력해 줘. 지금은 이런 것들이 가능해. ${bold(
          [...database.keys()].join(', '),
        )}.`,
      );
      return;
    }

    if (isNaN(times)) {
      message.reply(`돌릴 가챠 횟수를 입력해 줘. 최대 60까지 가능해.`);
      return;
    }

    if (times > MAX_PULL_SIZE) {
      message.reply(`가챠는 ${MAX_PULL_SIZE}연챠까지만 가능해.`);
      return;
    }

    const game = database.get(gameName);

    if (!game) {
      message.reply('처음 듣는 가챠인데?');
      return;
    }

    const { pulls, topPullCount, topPullRates } = roll({ game, times });

    const title = createResultTitle({
      game,
      times,
      topPullCount,
      topPullRates,
      username: message.author.username,
    });
    const embed = createResultEmbed({ game, pulls });

    await message.reply(title);
    message.reply({ embeds: [embed] });
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
