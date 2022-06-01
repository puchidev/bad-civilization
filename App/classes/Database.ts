import { Collection } from 'discord.js';

/**
 * @class
 * @description Stores & controls serializable data in a `Collection` instance.
 */
class Database<T extends { [key: string]: any }> {
  protected data = new Collection<keyof T, T>();

  /**
   * Adds a record in data.
   * @param record database record
   * @param idKey key used as record identifier
   */
  public add(record: T, idKey: keyof T) {
    const key = record[idKey];
    this.data.set(key, record);
  }

  /**
   * Adds multiple records in data.
   * @param records database records
   * @param idKey key used as record identifier
   */
  public addAll(records: T[], idKey: keyof T) {
    records.forEach((record) => {
      const key = record[idKey];
      this.data.set(key, record);
    });
  }

  /**
   * Finds all records in database that match the given keyword(s).
   * @example
   *  key `foo` matches `foo`, `fooo`, `foox`, `afoo`, etc.
   *  key `foo bar` matches `foo bar` `bar foo` ` afoo bbar ` ` xbar yfoo`
   * @param keywordOrKeywords a single search keyword, or multiple keywords seperated by spaces
   * @returns found records
   */
  public find(keywordOrKeywords: string) {
    const _keywordOrKeywords = keywordOrKeywords.trim();

    // `foo` -> /foo/i
    // `foo bar baz` -> /^(?=.*foo)(?=.*bar)(?=.*baz).*$/i
    const pattern = new RegExp(
      _keywordOrKeywords.includes(' ')
        ? `^${_keywordOrKeywords
            .split(/ /g)
            .map((word) => `(?=.*${word})`)
            .join('')}.*$`
        : _keywordOrKeywords,
      'i',
    );

    const matches = this.data.filter((_value, key) =>
      pattern.test(String(key)),
    );

    if (matches.size === 0) {
      return null;
    }
    if (matches.size === 1) {
      return matches.first()!;
    }

    return matches;
  }
}

export default Database;
