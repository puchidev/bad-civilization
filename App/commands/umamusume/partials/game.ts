import BigNumber from 'bignumber.js';

import type { GachaGameData, GachaGame, GachaSortedGroup } from './types';

/**
 * Create a new game object using provided configuration.
 * (Numeric values are processed with bignumber.js for precise calculation of floating points.)
 * @param config Game configuration data (JSON)
 * @returns Processed game data
 */
function createGame(config: GachaGameData) {
  const { id, name, rules, groups, membersByGroup } = config;

  // sort groups by highest tier
  groups.sort((a, z) => a.tier - z.tier);

  const groupIndexOfGurantee = groups.findIndex(
    (group) => group.name === rules.guaranteeGroup,
  );

  const sortedGroups: GachaSortedGroup[] = [];

  groups.forEach((group, groupIndex) => {
    const members = membersByGroup[group.name];

    if (!members) {
      return;
    }

    // drop rates for the group (normal pulls)
    const groupRates = new BigNumber(group.rates);
    // drop rates for the group (guaranteed Nth pulls)
    const groupRatesOnGuarantee = (() => {
      if (groupIndex < groupIndexOfGurantee) {
        return groupRates;
      }
      if (groupIndex === groupIndexOfGurantee) {
        return groups
          .map((group) => group.rates)
          .slice(groupIndex)
          .reduce((sum, groupRates) => sum.plus(groupRates), new BigNumber(0));
      }
      return new BigNumber(0);
    })();

    // split members by pickups and the rest
    const pickups = members.filter((member) => member.pickup);
    const pickupExists = pickups.length > 0;
    const normals = pickupExists
      ? members.filter((member) => !member.pickup)
      : members;

    // drop rates for pickups
    const pickupRatio = new BigNumber(pickupExists ? group.pickupRatio : 0);
    const pickupRates = groupRates.multipliedBy(pickupRatio);
    const pickupRatesOnGuarantee =
      groupRatesOnGuarantee.multipliedBy(pickupRatio);

    // drop rates for the rest
    const normalRatio = new BigNumber(1).minus(pickupRatio);
    const normalRates = groupRates.multipliedBy(normalRatio);
    const normalRatesOnGuarantee =
      groupRatesOnGuarantee.multipliedBy(normalRatio);

    const pickupGroup = {
      ...group,
      members: pickups,
      pickup: true,
      rates: pickupRates,
      ratesOnGuarantee: pickupRatesOnGuarantee,
    };
    const normalGroup = {
      ...group,
      members: normals,
      pickup: false,
      rates: normalRates,
      ratesOnGuarantee: normalRatesOnGuarantee,
    };

    sortedGroups.push(pickupGroup);
    sortedGroups.push(normalGroup);
  });

  const game: GachaGame = {
    id,
    name,
    rules,
    groups: sortedGroups,
  };

  return game;
}

export { createGame };
