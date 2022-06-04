/**
 * Picks an arbitrary item from the array passed.
 * @param array the array to choose the item from
 * @param rng method generating a random seed between 0 and 1
 * @returns the chosen item from the original array.
 */
function randomSelect<T>(array: T[], rng?: ((...args: any) => number) | null) {
  const myRng = (rng ?? Math.random)();
  const randomItem = array[Math.floor(myRng * array.length)];

  return randomItem;
}

export { randomSelect };
