const { Client, GatewayIntentBits, Events } = require('discord.js');
const dotenv = require('dotenv');
const events = require('./events');

dotenv.config();

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Register event listeners
client.once(Events.ClientReady, events.execute);
client.on(Events.GuildCreate, events.onGuildJoin);
client.on(Events.GuildDelete, events.onGuildLeave);
client.on(Events.InteractionCreate, events.onInteractionCreate);
client.on(Events.Error, events.onError);

client.login(token);
