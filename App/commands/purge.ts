import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';

import { deployCommands, fetchCommands } from '../client/commands';
import type { CommandConfig } from '../models';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('갱신')
    .setDescription('서버에 명령어를 재등록합니다.'),
  async execute(interaction: CommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
      interaction.reply('서버를 특정하는 데 실패했어.');
      return;
    }

    const commands = await fetchCommands();
    await deployCommands({ commands, guild });

    interaction.reply({
      content: '명령어를 다시 등록했어. 조금 기다리면 반영될 거야.',
      ephemeral: true,
    });
  },
};

export default command;
