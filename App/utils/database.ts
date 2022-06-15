import glob from 'glob';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '#App/devtools';

/**
 * Fetches data from JSON files in `/database/*`.
 * @param subPath the JSON file's path.
 * @returns Fetched data.
 */
async function fetchData<T = any>(subPath: string): Promise<T> {
  const basePath = process.cwd();
  const fullPath = path.resolve(basePath, subPath);
  const json = await readFileAsync(fullPath, 'utf8');
  const data: T = JSON.parse(json);

  return data;
}

/**
 * Fetches data from JSON files in `/database/*`.
 * @param subPath the JSON file's path.
 * @returns Fetched data.
 */
async function fetchAllData<T = any>(subPath: string): Promise<T[]> {
  const collection: T[] = [];

  const promises = glob.sync(subPath).map(async (filePath) => {
    try {
      const basePath = process.cwd();
      const fullPath = path.resolve(basePath, filePath);
      const json = await readFileAsync(fullPath, 'utf8');
      const data: T = JSON.parse(json);

      collection.push(data);
    } catch (e) {
      logger.debug(e);
      throw new Error(`Failed to fetch data from ${subPath}.`);
    }
  });

  await Promise.all(promises);

  return collection;
}

export { fetchData, fetchAllData };
