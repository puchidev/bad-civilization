import BigNumber from 'bignumber.js';

import type {
  GachaGame,
  GachaPull,
  GachaResult,
  GachaSortedGroup,
} from './types';

/**
 * Rolls gacha and returns the results.
 * @param arg.times times to pull in total
 * @param arg.game game data object
 * @returns formatted gacha result object
 */
function roll({ game, times }: { times: number; game: GachaGame }) {
  const { groups, rules } = game;

  const session = [...new Array(times)].map((_, index) => {
    const guarantee = isGuaranteePull(index, rules.guaranteeEvery);
    const seed = generateSeed();

    return { guarantee, seed };
  });

  const pulls: GachaPull[] = session.map(({ guarantee, seed }) =>
    pickMember({ groups, guarantee, seed }),
  );

  const topPullCount = pulls.filter(({ group }) => group.tier === 1).length;
  const topPullRates = new BigNumber(pulls.length).dividedBy(topPullCount);

  const result: GachaResult = {
    pulls,
    topPullCount,
    topPullRates,
  };

  return result;
}

/**
 * Generates a random seed for a single pull.
 * @returns generated seed.
 */
function generateSeed() {
  return BigNumber.random();
}

/**
 * Determines if the current pull is a guaranteed Nth pull.
 * @param pullIndex 0-based index of the pull
 * @param guaranteeEvery everfy number of pulls that guaratees a specific tier
 * @returns whether the current pull is guaranteed
 */
function isGuaranteePull(pullIndex: number, guaranteeEvery: number) {
  return pullIndex !== 0 && (pullIndex + 1) % guaranteeEvery === 0;
}

/**
 * Finds a member mathching provided seed.
 * @param arg.groups information about current pull
 * @param arg.guarantee whether the current pull is guaranteed
 * @param arg.seed randomized number used to procedurally create the pull
 * @returns found member
 */
function pickMember({
  groups,
  guarantee,
  seed,
}: {
  groups: GachaSortedGroup[];
  guarantee: boolean;
  seed: BigNumber;
}) {
  let cursor = new BigNumber(seed);
  let groupIndex = groups.length - 1;

  while (groupIndex >= 0) {
    const group = groups[groupIndex];
    const groupRates = guarantee ? group.ratesOnGuarantee : group.rates;

    if (cursor.isLessThanOrEqualTo(groupRates)) {
      const groupStep = groupRates.dividedBy(group.members.length);
      let memberIndex = 0;

      while (
        memberIndex < group.members.length &&
        cursor.isGreaterThan(groupStep)
      ) {
        cursor = cursor.minus(groupStep);
        memberIndex += 1;
      }

      const member = group.members[memberIndex];

      const pick: GachaPull = {
        member,
        group,
      };

      return pick;
    }

    cursor = cursor.minus(groupRates);
    groupIndex -= 1;
  }

  throw new Error(`Failed to find member matching seed: ${seed}`);
}

export { roll };
