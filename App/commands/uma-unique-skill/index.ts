import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, MessageEmbed } from 'discord.js';
import type { CommandInteraction } from 'discord.js';
import skills from './skills.json';

import type { CommandConfig } from '../../models';

interface Skill {
  umamusume: string;
  precondition?: string;
  condition: string | string[];
  effect: string;
}

const database = new Collection<string, Skill>();

/**
 * Beautify condition string
 * @param text skill condition written in one-liner style.
 * @returns beautified multiline text.
 */
function beautifyCondition(text: string) {
  return text.split(/[@&]/g).join('\n');
}

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('고유')
    .setDescription('말딸의 고유스킬을 확인해 보자')
    .addStringOption((option) => {
      return option
        .setName('말딸')
        .setDescription('검색하려는 말딸의 이름 일부')
        .setRequired(true);
    }),
  async prepare() {
    skills.forEach((skill) => {
      database.set(skill.umamusume, skill);
    });
  },
  async execute(interaction: CommandInteraction) {
    const uma = interaction.options.getString('말딸');

    if (!uma) {
      interaction.reply('어떤 말딸의 고유스킬이 알고 싶어?');
      return;
    }

    let skill = database.get(uma);

    if (!skill) {
      const matches = database.filter((_value, key) => key.includes(uma));

      switch (matches.size) {
        case 0:
          interaction.reply(`흠터레스팅… ${uma}라는 말딸은 처음 듣는걸.`);
          return;

        case 1:
          const _skill = matches.first();
          if (!_skill) {
            return;
          }
          skill = _skill;
          break;

        default:
          interaction.reply(`${[...matches.keys()].join(', ')}`);
          return;
      }
    }

    const { umamusume, effect, precondition, condition } = skill;

    const embed = new MessageEmbed()
      .setTitle(`${umamusume}의 고유 스킬`)
      .addField('조건', effect);

    if (precondition) {
      embed.addField('전제조건식', beautifyCondition(precondition));
    }

    if (Array.isArray(condition)) {
      embed.addField('조건식', condition.map(beautifyCondition).join('\n'));
    } else {
      embed.addField('조건식', beautifyCondition(condition));
    }

    await interaction.reply(`${uma}의 고유 스킬`);
    interaction.channel?.send({ embeds: [embed] });
  },
};

export default command;
