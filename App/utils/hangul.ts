/**
 * Tells if a text ends with a final consonant(JongSeong, 받침) of Korean language.
 * @param text text to test
 * @returns if the text ends with a character containing final consonant
 */
function endsWithJongSeong(text: string) {
  const lastLetter = text.slice(-1);
  const lastLetterHasJongSeong = hasJongSeong(lastLetter);
  return lastLetterHasJongSeong;
}

/**
 * Tells if a characater has final consonant(JongSeong, 받침) of Korean language.
 * @param character character to test
 * @returns if the character has final consonant
 */
function hasJongSeong(character: string) {
  const charCode = character.charCodeAt(0);
  if (!isHangul(character)) {
    return false;
  }
  return (charCode - 44032) % 28 !== 0;
}

/**
 * Tells if a character is in Hangul unicode range.
 * @param character character to test
 * @returns if the character is Hangul
 */
function isHangul(character: string) {
  const charCode = character.charCodeAt(0);
  return 44032 <= charCode || charCode <= 55203;
}

export { endsWithJongSeong, hasJongSeong, isHangul };
