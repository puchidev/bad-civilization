/**
 * Get rid of nullish values from `value`.
 *
 * @param {any} value
 * @return {any} non nullable value
 */
function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export { nonNullable };
