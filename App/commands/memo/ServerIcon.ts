import dedent from 'dedent';
import { bold, SlashCommandBuilder } from 'discord.js';
import { getLocalDate } from '#App/utils';

import type { CommandConfig } from '#App/models';

const command: CommandConfig = {
  data: new SlashCommandBuilder()
    .setName('로테')
    .setDescription('서버 아이콘 설정권한 로테이션을 보여줘'),
  guilds: ['596322920771616786', '857587145039282186'],
  async execute() {
    const INTERVAL_MONTH = 1;

    const members = ['푸치모노', '룬a', 'appleple', '비가좋아', '치리'];

    const date = getLocalDate('Asia/Seoul');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const difference = getElapsedMonths({ year, month });
    const index = Math.floor(difference / INTERVAL_MONTH);
    const currentMember = members[index % members.length];

    const nextMonth = getNextMonth({ year, month });
    const nextMember = members[(index + 1) % members.length];

    // prettier-ignore
    const message = dedent`
      지금 ${year}년 ${month}월에는 ${bold(currentMember)}가 서버 아이콘을 등록할 수 있어.
      다음 로테이션이 되는 ${nextMonth.year}년 ${nextMonth.month}월에는 ${bold(nextMember)}가 등록할 수 있어.
    `;

    return message;
  },
};

interface YearMonth {
  year: number;
  month: number;
}

/**
 * Returns elapsed time in months from the beginning of the rotation.
 * @returns elapsed time in months.
 */
function getElapsedMonths({ year, month }: YearMonth) {
  const START_YEAR = 2022;
  const START_MONTH = 4;
  const difference = (year - START_YEAR) * 12 - START_MONTH + month;

  return difference;
}

/**
 * Returns next month object relative to the passed time.
 * @returns next month object
 */
function getNextMonth({ year, month }: YearMonth): YearMonth {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}

export default command;
