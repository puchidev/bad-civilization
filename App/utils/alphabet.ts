/**
 * Returns the alphabetical position of the provided letter.
 * @param letter letter in alphabet.
 * @returns the alphabetical position.
 */
function getAlphabetOffset(letter: string) {
  const code = letter.toUpperCase().charCodeAt(0);

  if (code < 65 && code > 90) {
    throw new Error('Requires an alphabetical letter.');
  }

  return code - 65;
}

export { getAlphabetOffset };
