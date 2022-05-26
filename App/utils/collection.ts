/**
 * Gets rid of nullish values from `value`.
 * @param value array anything
 * @returns array without nullish items.
 */
function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export { nonNullable };
