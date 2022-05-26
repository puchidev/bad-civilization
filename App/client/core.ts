import { Client } from 'discord.js';
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

  const commands = await fetchCommands({
    onFailure: () => {
      console.error('Failed to load commands.');
    },
    onSuccess: () => {
      console.info('Successfully loaded commands.');
    },
  });

  client.once('ready', async () => {
    if (client.user) {
      console.log(`Logged in as ${client.user.tag}!`);
    }

    const guilds = await client.guilds.fetch();

    guilds.forEach((guild) => {
      deployCommands({
        guildId: guild.id,
        onFailure: () => {
          console.error(`Failed to deploy commands to: ${guild.name}`);
        },
        onSuccess: () => {
          console.info(
            `Successfully registered application commands to: ${guild.name}`,
          );
        },
      });
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
      console.error(error);

      await interaction.reply({
        content: '명령을 수행할 수 없어요, 마스터.',
        ephemeral: true,
      });
    }
  });

  const preparePromises = commands
    .filter((command) => 'prepare' in command)
    .map(({ prepare }) => prepare && prepare());

  await Promise.all(preparePromises);

  client.login(process.env.APP_TOKEN);
}

export { initClient };
