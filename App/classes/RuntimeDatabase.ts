import { Collection } from 'discord.js';
import { findBestMatch } from 'string-similarity';
import { random } from '#App/utils';

/**
 * @class
 * @description Stores & controls serializable data in a `Collection` instance.
 * @see https://discord.js.org/#/docs/collection/main/class/Collection (parent class `Collection`)
 */
class RuntimeDatabase<V extends Record<string, any>> extends Collection<
  string,
  V
> {
  /**
   * Adds a record in data.
   * @param record database record
   * @param idKey key used as record identifier
   */
  public add(record: V, idKey: keyof V) {
    const key = record[idKey];

    if (this.has(key)) {
      throw new Error(`Duplicate database key: ${key}`);
    }

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

  public search(keyword: string): {
    match: V | null;
    suggestions?: string[] | null;
  };
  public search(
    keyword: string,
    options: { all: boolean },
  ): { match: NonNullable<V>[] };
  /**
   * Finds all records in database that match the given keyword(s).
   * @example
   *  key `foo` matches `foo`, `fooo`, `foox`, `afoo`, etc.
   *  key `foo bar` matches `foo bar` `bar foo` ` afoo bbar ` ` xbar yfoo`
   * @param keyword a single search keyword, or multiple keywords seperated by spaces
   * @param options operation configuration
   * @param options.all return all matches instead of the best matchf
   * @returns found records
   */
  public search(
    keyword: string,
    options: { all?: boolean } = {},
  ):
    | { match: V | null; suggestions?: string[] | null }
    | { match: NonNullable<V>[] } {
    const allKeys = [...this.keys()];
    const _keyword = keyword.trim();
    const isMultiple = _keyword.includes(' ');

    if (!isMultiple && this.has(_keyword)) {
      const exactMatch = this.get(_keyword)!;
      return { match: exactMatch };
    }

    // Filter out keys that contain all search keywords
    // `foo` -> /foo/i
    // `foo bar baz` -> /^(?=.*foo)(?=.*bar)(?=.*baz).*$/i
    const pattern = new RegExp(
      isMultiple
        ? `^${_keyword
            .split(/ /g)
            .map((word) => `(?=.*${word})`)
            .join('')}.*$`
        : _keyword,
      'i',
    );
    const matchingKeys = allKeys.filter((key) => pattern.test(key));

    if (matchingKeys.length === 0) {
      return { match: null };
    }

    if (options.all) {
      const matchingValues = matchingKeys.map((key) => this.get(key)!);
      return { match: matchingValues };
    }

    const { bestMatchIndex } = findBestMatch(_keyword, matchingKeys);
    const bestMatchKey = matchingKeys[bestMatchIndex];
    const bestMatchValue = this.get(bestMatchKey)!;
    const suggestions =
      matchingKeys.length > 1
        ? matchingKeys.filter((key) => key !== bestMatchKey)
        : null;

    return { match: bestMatchValue, suggestions };
  }

  /**
   * Returns a record matching the given `seed`.
   * @param seed string used to trigger pseudo-random number generation
   * @returns selected record
   */
  public pseudoRandom(seed: string) {
    const keys = [...this.keys()];
    const matchingKey = random(keys, seed);
    const matchingItem = this.get(matchingKey);

    if (!matchingItem) {
      throw new Error(`Failed to find matching item for seed: ${seed}`);
    }

    return matchingItem;
  }
}

export default RuntimeDatabase;
