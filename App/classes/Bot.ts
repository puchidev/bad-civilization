import { REST } from '@discordjs/rest';
import { Client, Collection, Intents } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import glob from 'glob';
import path from 'node:path';
import type { Guild } from 'discord.js';

import { logger } from '#App/devtools';
import type { CommandConfig } from '#App/models';

/**
 * Creates a Discord bot client with custom options.
 * @class
 */
class Bot extends Client {
  public readonly commands = new Collection<string, CommandConfig>();

  /**
   * Returns an array of all keys in the database.
   */
  public constructor() {
    if (!process.env.APP_ID) {
      throw new Error('App ID not found.');
    }
    if (!process.env.APP_TOKEN) {
      throw new Error('App token not found.');
    }

    const intents = new Intents([
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ]);

    super({ intents });
  }

  /**
   * Prepares the bot and log into Discord.
   */
  public async init() {
    this.bindEvents();

    await this.loadCommands();

    const prepare = this.commands.map(async (command) => {
      if (command.prepare) {
        command.prepare();
      }
    });

    await Promise.all(prepare);

    super.login(process.env.APP_TOKEN);
  }

  /**
   * Fetches and parses commands.
   */
  private async loadCommands() {
    const { commands } = this;

    // target .ts files starting with an uppercase letter.
    const filePattern = /\/[A-Z][^\/]+\.ts$/;

    const promises = glob
      .sync('App/commands/**/*.ts')
      .filter((filePath) => filePattern.test(filePath))
      .map(async (filePath) => {
        const basePath = process.cwd();
        const fullPath = path.resolve(basePath, filePath);
        const command: CommandConfig = (await import(fullPath)).default;
        const commandName = command.data.name;

        if (commands.has(commandName)) {
          throw new Error(`Duplicate command name: ${commandName}`);
        }

        commands.set(commandName, command);
      });

    await Promise.all(promises);
  }

  /**
   * Registers commands to a Discord server.
   * @param guild Discord server where the command should be deployed to
   */
  private async deployCommands(guild: Pick<Guild, 'id' | 'name'>) {
    const { commands } = this;
    const appId = process.env.APP_ID!;
    const appToken = process.env.APP_TOKEN!;

    const guildCommands = commands.filter((command) =>
      command.guilds ? command.guilds.includes(guild.id) : true,
    );

    if (guildCommands.size === 0) {
      throw new Error('No command found.');
    }

    const rest = new REST({ version: '10' }).setToken(appToken);
    const schema = guildCommands.map((command) => command.data.toJSON());

    rest.put(Routes.applicationGuildCommands(appId, guild.id), {
      body: schema,
    });
  }

  /**
   * attaches events handlers.
   */
  private bindEvents() {
    this.once('ready', async () => {
      if (!this.user) {
        return;
      }
      logger.info(`Logged in as ${this.user.tag}!`);
    });

    this.on('guildCreate', async (guild) => {
      if (process.env.NODE_ENV === 'production') {
        try {
          this.deployCommands(guild);
        } catch (e) {
          logger.debug(e);
          logger.error(`Failed to deploy commands to ${guild.name}`);
        }
      }
    });

    this.on('messageCreate', async (message) => {
      if (!this.user || !message.guild || message.author.bot) {
        return;
      }

      // purge commands when someone mentions our bot
      if (!message.mentions.everyone && message.mentions.has(this.user.id)) {
        await message.reply('갱신한다 명령어. 조금 기다리면 반영될 거야.');
        this.deployCommands(message.guild);
        return;
      }

      const isCommand = message.content.startsWith('!');

      if (!isCommand) {
        return;
      }

      const [commandName, ...params] = message.content
        .slice(1)
        .trim()
        .split(/ +/);
      const command = this.commands.get(commandName);

      if (!command) {
        return;
      }

      if (!command.respond) {
        logger.error(`No respond handler found for: ${commandName}`);
        message.reply(`${commandName} 명령을 수행하지 못했어…`);
        return;
      }

      command.respond(message, params);
    });

    this.on('interactionCreate', async (interaction) => {
      const isCommand = interaction.isCommand();
      const isAutocomplete = interaction.isAutocomplete();

      if (!isCommand && !isAutocomplete) {
        return;
      }

      const { commandName } = interaction;
      const command = this.commands.get(commandName);

      if (!command) {
        return;
      }

      if (isAutocomplete) {
        if (!command.autocomplete) {
          logger.error(`No autocomplete handler found for: ${commandName}`);
          return;
        }

        try {
          const suggestions = await command.autocomplete(interaction);
          interaction.respond(suggestions);
        } catch (e) {
          logger.debug(e);
          logger.error(`Failed to autocomplete ${commandName}`);
        }
      }

      if (isCommand) {
        try {
          await command.interact(interaction);
        } catch (e) {
          logger.debug(e);
          logger.error(`Failed to execute ${commandName}`);

          interaction.reply({
            content: `${commandName} 명령을 수행하지 못했어…`,
            ephemeral: true,
          });
        }
      }
    });
  }
}

export default Bot;
