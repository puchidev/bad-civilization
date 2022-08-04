import type { Message } from 'discord.js';

/**
 * Extracts text and numeric arguments of the command from a user message.
 * @param message user message containing a command
 * @returns parsed arguments
 */
function getArguments(message: Message) {
  const parts = message.content.trim().split(/ +/g).slice(1);

  const numbers: number[] = [];
  const strings: string[] = [];

  for (const part of parts) {
    const number = Number(part);
    const isNumber = !isNaN(number) && isFinite(number);

    if (isNumber) {
      numbers.push(number);
    } else {
      strings.push(part);
    }
  }

  return { numbers, strings };
}

export { getArguments };
