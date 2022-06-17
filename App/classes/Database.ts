import { Collection } from 'discord.js';
import { findBestMatch } from 'string-similarity';
import { random } from '#App/utils';

/**
 * @class
 * @description Stores & controls serializable data in a `Collection` instance.
 * @see https://discord.js.org/#/docs/collection/main/class/Collection (parent class `Collection`)
 */
class Database<V extends Record<string, any>> extends Collection<string, V> {
  /**
   * Adds a record in data.
   * @param record database record
   * @param idKey key used as record identifier
   */
  public add(record: V, idKey: keyof V) {
    const key = record[idKey];
    this.set(key, record);
  }

  /**
   * Adds multiple records in data.
   * @param records database records
   * @param idKey key used as record identifier
   */
  public addAll(records: V[], idKey: keyof V) {
    records.forEach((record) => this.add(record, idKey));
  }

  /**
   * Finds all records in database that match the given keyword(s).
   * @example
   *  key `foo` matches `foo`, `fooo`, `foox`, `afoo`, etc.
   *  key `foo bar` matches `foo bar` `bar foo` ` afoo bbar ` ` xbar yfoo`
   * @param keywordOrKeywords a single search keyword, or multiple keywords seperated by spaces
   * @returns found records
   */
  public search(keywordOrKeywords: string) {
    const allKeys = [...this.keys()];
    const _keywordOrKeywords = keywordOrKeywords.trim();
    const isMultiple = _keywordOrKeywords.includes(' ');

    if (!isMultiple && this.has(_keywordOrKeywords)) {
      const exactMatch = this.get(_keywordOrKeywords)!;
      return { match: exactMatch };
    }

    // Filter out keys that contain all search keywords
    // `foo` -> /foo/i
    // `foo bar baz` -> /^(?=.*foo)(?=.*bar)(?=.*baz).*$/i
    const pattern = new RegExp(
      isMultiple
        ? `^${_keywordOrKeywords
            .split(/ /g)
            .map((word) => `(?=.*${word})`)
            .join('')}.*$`
        : _keywordOrKeywords,
      'i',
    );
    const matchingKeys = allKeys.filter((key) => pattern.test(key));

    if (matchingKeys.length === 0) {
      return { match: null };
    }

    if (matchingKeys.length === 1) {
      const key = matchingKeys[0];
      const match = this.get(key) ?? null;
      return { match };
    }

    const { bestMatchIndex } = findBestMatch(_keywordOrKeywords, matchingKeys);
    const bestMatchKey = matchingKeys[bestMatchIndex];
    const bestMatchValue = this.get(bestMatchKey)!;
    const suggestions = matchingKeys.filter((key) => key !== bestMatchKey);

    return { match: bestMatchValue, suggestions };
  }

  /**
   * Returns a record in the database matching the given `seed`.
   * @param seed string used to trigger pseudo-random number generation
   * @returns the selected item
   */
  public randomWith(seed: string) {
    const keys = [...this.keys()];
    const matchingKey = random(keys, seed);
    const matchingItem = this.get(matchingKey);

    if (!matchingItem) {
      throw new Error(`Failed to find matching item for seed: ${seed}`);
    }

    return matchingItem;
  }
}

export default Database;
