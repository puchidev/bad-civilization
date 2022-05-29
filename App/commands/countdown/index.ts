import dedent from 'dedent';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { Collection, User } from 'discord.js';
import type { MessageReaction, Snowflake } from 'discord.js';

import type { CommandConfig } from '../../models';
import * as config from './config';
import { startCountdown } from './countdown';

const OK = '🆗';

const requests = new Set<Snowflake>();

const command: CommandConfig = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('카운트')
      .setDescription(
        '멤버를 모으고 카운트다운을 실행합니다. (현재 4명까지 지원)',
      );

    [...Array(4)].map((_, index) => {
      builder.addUserOption((option) =>
        option
          .setName(`멤버${index + 1}`)
          .setDescription(`초대할 ${index + 1}번째 멤버`),
      );
    });

    return builder;
  })(),
  async execute(interaction) {
    const { channel } = interaction;

    if (!channel) {
      interaction.reply('채널을 특정하는 데 실패했어.');
      return;
    }

    if (requests.has(channel.id)) {
      interaction.reply('채널에서 이미 카운트다운이 진행중이야.');
      return;
    }

    const memberIds = [...Array(4)]
      .map((_, index) => interaction.options.getUser(`멤버${index + 1}`))
      .filter((user): user is User => user !== null)
      .map((user) => user.id);

    if (memberIds.length === 0) {
      interaction.reply('카운트다운에 초대할 사람을 지정해줘.');
      return;
    }

    requests.add(channel.id);

    await interaction.reply(dedent`
      ${memberIds.map((userId) => userMention(userId)).join(' ')}
      곧 카운트다운을 시작하려고 해.
    `);

    const startMessage = await channel.send(dedent`
      아래 ${OK} 버튼을 눌러 준비됐는지 알려줘.
      (도중에 버튼을 다시 누르면 준비 상태를 취소할 수 있어.)
    `);

    await startMessage.react(OK);

    const readiness = new Collection<string, boolean>();
    memberIds.forEach((memberId) => readiness.set(memberId, true));

    const repromptTimeout = setTimeout(() => {
      const unreadyMembers = [...readiness.filter((value) => !value).keys()];

      interaction.followUp(dedent`
        ${unreadyMembers.map((memberId) => userMention(memberId)).join(' ')}
        카운트다운에 초대됐어. 준비되었는지 알려주겠어?
      `);
    }, config.REPROMPT_MEMBERS_IN);

    const filter = (reaction: MessageReaction, user: User) => {
      return memberIds.includes(user.id) && reaction.emoji.name === OK;
    };

    const collector = startMessage.createReactionCollector({
      filter,
      time: config.REQUEST_DURATION,
    });

    const handleUnready = () => {
      interaction.followUp(
        '멤버들이 준비되지 않은 것 같아. 카운트다운을 중단할게.',
      );
    };

    const handleReady = async () => {
      clearTimeout(repromptTimeout);
      collector.off('end', handleUnready);

      await interaction.followUp(dedent`
        ${memberIds.map((userId) => userMention(userId)).join(' ')}
        모두들 준비된 모양이야. 카운트다운을 시작할게.
      `);

      startCountdown(config.COUNT_START_FROM, {
        onCount: async (currentCount) => {
          const message = String(currentCount || 'ㄱ').repeat(
            config.COUNT_TEXT_REPEAT,
          );
          channel.send(message);
        },
        onEnd: () => {
          requests.delete(channel.id);
        },
      });
    };

    collector.on('end', handleUnready);

    collector.on('collect', (_reaction, user) => {
      const userId = user.id;

      if (readiness.has(userId)) {
        readiness.set(userId, true);
      }
      if (readiness.every((isReady) => isReady)) {
        handleReady();
      }
    });
  },
};

export default command;
