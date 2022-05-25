import { Intents } from 'discord.js';

const intents = new Intents([
  Intents.FLAGS.DIRECT_MESSAGES,
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.GUILD_PRESENCES,
]);

export { intents };
export default intents;
