import glob from 'glob';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '../devtools';

/**
 * Fetches data from JSON files in `/database/*`.
 * @param subPath the JSON file's path.
 * @returns Fetched data.
 */
async function fetchData<T = any>(subPath: string): Promise<T> {
  const basePath = process.cwd();
  const fullPath = path.resolve(basePath, 'database', subPath);
  const json = await readFileAsync(fullPath, 'utf8');
  const data: T = JSON.parse(json);

  return data;
}

/**
 * Fetches data from JSON files in `/database/*`.
 * @param pattern the JSON file's path.
 * @returns Fetched data.
 */
async function fetchAllData<T = any>(pattern: string): Promise<T[]> {
  const collection: T[] = [];
  let hasError = false;

  glob.sync(pattern).map(async (subPath) => {
    try {
      const basePath = process.cwd();
      const fullPath = path.resolve(basePath, 'database', subPath);
      const json = await readFileAsync(fullPath, 'utf8');
      const data: T = JSON.parse(json);

      collection.push(data);
    } catch (error) {
      hasError = true;
      logger.debug(error);
      return null;
    }
  });

  if (hasError) {
    throw new Error(`Failed to fetch data from ${pattern}.`);
  }

  return collection;
}

export { fetchData, fetchAllData };
