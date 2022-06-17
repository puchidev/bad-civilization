import seedrandom from 'seedrandom';

/**
 * Picks an arbitrary item from the array passed.
 * @param array the array to choose the item from
 * @param seed string used to trigger pseudo-random number generation
 * @returns the chosen item from the original array.
 */
function random<T>(array: T[], seed?: string) {
  const rng = seed ? seedrandom(seed) : Math.random;
  const randomItem = array[Math.floor(rng() * array.length)];
  return randomItem;
}

export { random };
