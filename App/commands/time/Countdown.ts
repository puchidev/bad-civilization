import dedent from 'dedent';
import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { Collection, CommandInteraction, User } from 'discord.js';
import type { MessageReaction, Snowflake } from 'discord.js';

import type { CommandConfig, MaybePromise } from '#App/models';

const REQUEST_DURATION = 3 * 60 * 1000; // 3 min.
const REPROMPT_MEMBERS_IN = 1 * 60 * 1000; // 1 min.
const COUNT_START_FROM = 3; // count from this number
const COUNT_TEXT_REPEAT = 5; // count string's length
const DELAY_BEFORE_COUNT = 2 * 1000; // 2 sec.
const DELAY_BETWEEN_COUNT = 800; // 0.8 sec.

const OK = '🆗';

const requests = new Set<Snowflake>();

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('카운트')
    .setDescription('동시시청을 위해 카운트다운을 실행합니다.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('멤버')
        .setDescription('멤버들을 불러 카운트다운을 시작합니다.')
        .addUserOption((option) =>
          option
            .setName(`초대멤버1`)
            .setDescription(`카운트다운에 초대할 1번째 멤버`)
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName(`초대멤버2`)
            .setDescription(`카운트다운에 초대할 2번째 멤버`),
        )
        .addUserOption((option) =>
          option
            .setName(`초대멤버3`)
            .setDescription(`카운트다운에 초대할 3번째 멤버`),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('역할')
        .setDescription('역할에 속한 멤버들을 불러 카운트다운을 시작합니다.')
        .addRoleOption((option) =>
          option
            .setName('초대역할')
            .setDescription(
              '카운트다운에 초대할 역할 (소속된 모든 멤버를 부릅니다.)',
            )
            .setRequired(true),
        ),
    ),
  async interact(interaction) {
    const { channel } = interaction;

    if (!channel) {
      interaction.reply('채널을 특정하는 데 실패했어.');
      return;
    }

    if (requests.has(channel.id)) {
      interaction.reply('채널에서 이미 카운트다운이 진행중이야.');
      return;
    }

    const userIds = getUserIds(interaction);

    if (userIds.length === 0) {
      interaction.reply('카운트다운에 초대할 사람을 지정해줘.');
      return;
    }

    requests.add(channel.id);

    await interaction.reply(dedent`
      ${userIds.map((userId) => userMention(userId)).join(' ')}
      곧 카운트다운을 시작하려고 해.
    `);

    const startMessage = await channel.send(dedent`
      아래 ${OK} 버튼을 눌러 준비됐는지 알려줘.
      (도중에 버튼을 다시 누르면 준비 상태를 취소할 수 있어.)
    `);

    await startMessage.react(OK);

    const readiness = new Collection<string, boolean>();
    userIds.forEach((userId) => readiness.set(userId, true));

    const repromptTimeout = setTimeout(() => {
      const unreadyUserIds = [...readiness.filter((value) => !value).keys()];

      interaction.followUp(dedent`
        ${unreadyUserIds.map((userId) => userMention(userId)).join(' ')}
        카운트다운에 초대됐어. 준비되었는지 알려주겠어?
      `);
    }, REPROMPT_MEMBERS_IN);

    const filter = (reaction: MessageReaction, user: User) =>
      reaction.emoji.name === OK &&
      readiness.has(user.id) &&
      readiness.get(user.id) !== true;

    const collector = startMessage.createReactionCollector({
      filter,
      time: REQUEST_DURATION,
    });

    const handleUnready = () => {
      interaction.followUp(
        '멤버들이 준비되지 않은 것 같아. 카운트다운을 중단할게.',
      );
    };

    const handleReady = async () => {
      clearTimeout(repromptTimeout);

      collector.off('end', handleUnready);
      collector.off('collect', handleCollect);

      await interaction.followUp(dedent`
        ${userIds.map((userId) => userMention(userId)).join(' ')}
        모두들 준비된 모양이야. 카운트다운을 시작할게.
      `);

      startCountdown(COUNT_START_FROM, {
        onCount: async (currentCount) => {
          const message = String(currentCount || 'ㄱ').repeat(
            COUNT_TEXT_REPEAT,
          );
          channel.send(message);
        },
        onEnd: () => {
          requests.delete(channel.id);
        },
      });
    };

    const handleCollect = (_reaction: MessageReaction, user: User) => {
      const userId = user.id;

      readiness.set(userId, true);

      if (readiness.every((isReady) => isReady)) {
        handleReady();
      }
    };

    collector.on('end', handleUnready);
    collector.on('collect', handleCollect);
  },
};

/**
 * Finds all members to be invited to the countdown.
 * @param interaction interaction object
 * @returns collection of users to be invited
 */
function getUserIds(interaction: CommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case '역할': {
      const role = interaction.options.getRole('초대역할');

      if (!role || !('members' in role)) {
        return [] as string[];
      }

      const userIds = role.members.map((member) => member.user.id);
      return userIds;
    }

    case '멤버': {
      const userIds = [1, 2, 3]
        .map((number) => interaction.options.getUser(`초대멤버${number}`))
        .filter((user): user is User => user !== null)
        .map((user) => user.id);

      return userIds;
    }

    default:
      throw new Error(`Unhandled subcommand: ${subcommand}`);
  }
}

interface CountdownOptions {
  onCount: (currentCount: number) => MaybePromise<unknown>;
  onEnd: () => MaybePromise<unknown>;
}

/**
 * Counts down to zero and invoke callback on each tick.
 * @param currentCount current value of countdown
 * @param options additional parameters
 * @param options.onCount function to invoke on each count
 * @param options.onEnd function to invoke on end of countdown
 */
function countdown(currentCount: number, options: CountdownOptions) {
  options.onCount(currentCount);

  if (currentCount === 0) {
    options.onEnd();
    return;
  }

  setTimeout(() => {
    countdown(currentCount - 1, options);
  }, DELAY_BETWEEN_COUNT);
}

/**
 * Starts countdown ticks.
 * @param currentCount current value of countdown
 * @param options additional parameters
 */
function startCountdown(currentCount: number, options: CountdownOptions) {
  setTimeout(() => {
    countdown(currentCount, options);
  }, DELAY_BEFORE_COUNT);
}

export default command;
