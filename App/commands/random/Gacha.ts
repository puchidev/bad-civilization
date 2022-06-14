import { bold, underscore, SlashCommandBuilder } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';
import type { EmbedFieldData } from 'discord.js';
import chunk from 'lodash/chunk';

import { logger } from '../../devtools';
import type { CommandConfig } from '../../models';
import { fetchAllData } from '../../utils';
import { createGame } from './Gacha/game';
import { roll } from './Gacha/roll';
import type { GachaGame, GachaGameConfig } from './Gacha/types';

const database = new Collection<string, GachaGame>();

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
          { name: '말', value: 'uma-character' },
          { name: '서폿', value: 'uma-support' },
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
      const configs = await fetchAllData<GachaGameConfig>('gacha/*.json');

      configs.forEach((config) => {
        const game = createGame(config);
        database.set(config.id, game);
      });
    } catch (e) {
      logger.debug(e);
      console.error(`Failed to establish gacha game list.`);
    }
  },
  async execute(interaction) {
    const gameName = interaction.options.getString('종류', true);
    const times = interaction.options.getInteger('횟수', true);
    const game = database.get(gameName);

    if (!game) {
      interaction.reply('처음 듣는 가챠인데?');
      return;
    }

    const { pulls, topPullCount, topPullRates } = roll({ game, times });

    const createTitle = () => {
      const username = interaction.member?.user.username;
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
    };

    const createFields = () => {
      return chunk(pulls, game.rules.sessionSize).map<EmbedFieldData>(
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
    };

    const embed = new MessageEmbed();

    createFields().forEach((field) => embed.addFields(field));

    await interaction.reply(createTitle());
    interaction.channel?.send({ embeds: [embed] });
  },
};

export default command;
