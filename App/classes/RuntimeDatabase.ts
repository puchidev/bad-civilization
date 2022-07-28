import { Collection } from 'discord.js';
import { compareTwoStrings, findBestMatch } from 'string-similarity';
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
   * @param key the key of the element
   * @param value the element to be added
   * @returns the collection to support chaining
   */
  public insert(key: string, value: V) {
    if (this.has(key)) {
      throw new Error(`Duplicate database key: ${key}`);
    }

    this.set(key, value);

    return this;
  }

  /**
   * Returns keys of records that satisfy the passed function
   * @param predicate function invoked on all iterations
   * @returns matching keys
   */
  public keysWith(predicate: (record: V, key: string) => boolean) {
    const keys = this.filter(predicate).keys();
    return keys;
  }

  /**
   * Finds all records in database that match the given keyword(s).
   * @example
   *  key `foo` matches `foo`, `fooo`, `foox`, `afoo`, etc.
   *  key `foo bar` matches `foo bar` `bar foo` ` afoo bbar ` ` xbar yfoo`
   * @param keyword a single search keyword, or multiple keywords seperated by spaces
   * @param options operation options
   * @param options.strategy search method
   * @param options.test predicate function to run before perform the search
   * @returns found records
   */
  public search(
    keyword: string,
    options: {
      strategy?: 'match' | 'similarity';
      test?: (record: V, key: string) => boolean;
    } = {},
  ) {
    const { strategy = 'match', test } = options;

    // get database keys remove symbols
    const keys = [...(test ? this.keysWith(test) : this.keys())];
    const _keyword = keyword.trim();
    const isMultiple = _keyword.includes(' ');

    if (!isMultiple && this.has(_keyword)) {
      const exactMatch = this.get(_keyword)!;
      return { match: exactMatch };
    }

    let matchingKeys: string[] = [];

    switch (strategy) {
      case 'match':
        {
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

          matchingKeys = keys.filter((key) => pattern.test(key));
        }
        break;

      case 'similarity':
        {
          matchingKeys = keys.filter((key) => {
            const similarity = compareTwoStrings(key, keyword);
            return similarity > 0;
          });
        }
        break;

      default:
        throw new Error(`Unhandled search strategy: ${strategy}.`);
    }

    if (matchingKeys.length === 0) {
      return { match: null };
    }

    if (matchingKeys.length === 1) {
      const matchingValue = this.get(matchingKeys[0])!;
      return { match: matchingValue };
    }

    const { bestMatchIndex } = findBestMatch(_keyword, matchingKeys);
    const bestMatchKey = matchingKeys[bestMatchIndex];
    const bestMatchValue = this.get(bestMatchKey)!;
    const suggestions = matchingKeys.filter((key) => key !== bestMatchKey);

    return { match: bestMatchValue, suggestions };
  }

  /**
   * Returns a record matching the given `seed`.
   * @param seed string used to trigger pseudo-random number generation
   * @param options operation options
   * @param options.test predicate function to run before perform the search
   * @returns selected record
   */
  public pseudoRandom(
    seed: string,
    options: {
      test?: (record: V, key: string) => boolean;
    } = {},
  ) {
    const { test } = options;

    const keys = [...(test ? this.keysWith(test) : this.keys())];
    const matchingKey = random(keys, seed);
    const matchingItem = this.get(matchingKey);

    if (!matchingItem) {
      throw new Error(`Failed to find matching item for seed: ${seed}`);
    }

    return matchingItem;
  }
}

export default RuntimeDatabase;
