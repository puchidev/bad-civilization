import { Client } from 'discord.js';

import { deployCommands, fetchCommands } from '../commands';
import { logger } from '../devtools';
import { intents } from './intents';

/**
 * Initializes Discord.js client
 */
async function initClient() {
  const appToken = process.env.APP_TOKEN;
  const isProductionEnv = process.env.NODE_ENV === 'production';

  if (!appToken) {
    throw new Error('App token not found.');
  }

  const client = new Client({ intents });
  const commands = await fetchCommands();

  // invoke 'prepare' methods of fetched commands
  await Promise.all(commands.map(({ prepare }) => prepare && prepare()));

  client.once('ready', async () => {
    if (client.user) {
      logger.info(`Logged in as ${client.user.tag}!`);
    }
  });

  client.on('guildCreate', async (guild) => {
    if (isProductionEnv) {
      deployCommands({ commands, guild });
    }
  });

  client.on('messageCreate', async (message) => {
    // type guard
    if (!client.user || !message.guild) {
      return;
    }
    // ignore
    // 1. @here, @everyone calls
    // 2. mentioned by bot
    if (message.mentions.everyone || message.author.bot) {
      return;
    }
    if (message.mentions.has(client.user.id)) {
      await message.reply('갱신한다 명령어');
      await deployCommands({ commands, guild: message.guild });
      await message.reply('명령어를 다시 등록했어. 조금 기다리면 반영될 거야.');
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName } = interaction;
    const command = commands.get(commandName);

    if (!command) {
      logger.error(`No such command found: ${commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);

      interaction.reply({
        content: `${interaction.commandName} 명령을 수행하지 못했어…`,
        ephemeral: true,
      });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isAutocomplete()) {
      return;
    }

    const { commandName } = interaction;
    const command = commands.get(commandName);

    if (!command?.autocomplete) {
      logger.error(`No autocomplete handler found for: ${commandName}`);
      return;
    }

    const suggestions = await command.autocomplete(interaction);
    interaction.respond(suggestions);
  });

  client.login(appToken);
}

export { initClient };
