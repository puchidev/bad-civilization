import { Client } from 'discord.js';

import { logger } from '../devtools';
import { deployCommands, fetchCommands } from './commands';
import { intents } from './intents';

/**
 * Initializes Discord.js client
 */
async function initClient() {
  if (!process.env.APP_TOKEN) {
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

    const guilds = await client.guilds.fetch();

    guilds.forEach((guild) => {
      deployCommands({ commands, guild });
    });
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const command = commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);

      await interaction.reply({
        content: '명령을 수행할 수 없어요, 마스터.',
        ephemeral: true,
      });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isAutocomplete()) {
      return;
    }

    const command = commands.get(interaction.commandName);

    if (!command?.autocomplete) return;

    interaction.respond(command.autocomplete());
  });

  client.login(process.env.APP_TOKEN);
}

export { initClient };
