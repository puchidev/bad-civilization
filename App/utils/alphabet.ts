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

/**
 * Removes all instance of special characters inside the given text.
 * @param text text to replace
 * @returns replaced string
 */
function removeSpecialCharacters(text: string) {
  return text.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
}

export { getAlphabetOffset, removeSpecialCharacters };
