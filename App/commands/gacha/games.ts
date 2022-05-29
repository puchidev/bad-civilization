import BigNumber from 'bignumber.js';
import glob from 'glob';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '../../devtools';
import { nonNullable } from '../../utils';
import type { GachaGameConfig, GachaGame, GachaSortedGroup } from './types';

/**
 * Fetches game configuration data in JSON format.
 * @returns collection of game configurations
 */
async function fetchGameConfigs() {
  let hasError = false;

  const fetchPromises = glob
    .sync('App/commands/gacha/games/*.json')
    .map(async (filePath) => {
      try {
        const basePath = process.cwd();
        const fullPath = path.resolve(basePath, filePath);
        const json = await readFileAsync(fullPath, 'utf8');
        const config: GachaGameConfig = JSON.parse(json);

        return config;
      } catch (error) {
        hasError = true;
        logger.error((error as Error).message);
        return null;
      }
    });

  const configs = (await Promise.all(fetchPromises)).filter(nonNullable);

  if (hasError) {
    logger.error('Failed to load gacha games.');
  } else {
    logger.info('Successfully loaded gacha games');
  }

  return configs;
}

/**
 * Create a new game object using provided configuration.
 * (Numeric values are processed with bignumber.js for precise calculation of floating points.)
 * @param config Game configuration data (JSON)
 * @returns Processed game data
 */
function createGame(config: GachaGameConfig) {
  const { name, rules, groups, membersByGroup } = config;

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
    name,
    rules,
    groups: sortedGroups,
  };

  return game;
}

export { createGame, fetchGameConfigs };
