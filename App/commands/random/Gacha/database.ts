import { RuntimeDatabase } from '#App/classes';
import { logger } from '#App/devtools';
import { fetchAllData } from '#App/utils';

import { createGame } from './game';
import type { GachaGame, GachaGameConfig } from './types';

export const games = new RuntimeDatabase<GachaGame>();

/** Load gacha games */
async function loadGames() {
  try {
    const configs = await fetchAllData<GachaGameConfig>(
      'database/gacha/*.json',
    );

    configs.forEach((config) => {
      const game = createGame(config);
      games.insert(game.name, game);
    });
  } catch (e) {
    logger.debug(e);
    logger.error(`Failed to establish gacha game list.`);
  }
}

loadGames();
