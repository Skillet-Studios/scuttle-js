const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const events = require('./events');

dotenv.config();

const token = process.env.DISCORD_TOKEN;

// Create a new Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Initialize a collection for commands
client.commands = new Collection();

// Dynamically load commands from the `commands/` directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .flatMap((dir) =>
    fs
      .readdirSync(path.join(commandsPath, dir))
      .map((file) => path.join(dir, file))
  );

for (const file of commandFiles) {
  if (!file.endsWith('.js')) continue;
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(
      `[WARNING] The command at ${file} is missing a required "data" or "execute" property.`
    );
  }
}

// Register event listeners
client.once(Events.ClientReady, events.execute);
client.on(Events.GuildCreate, events.onGuildJoin);
client.on(Events.GuildDelete, events.onGuildLeave);
client.on(Events.InteractionCreate, events.onInteractionCreate);
client.on(Events.Error, events.onError);

// Log in to Discord
client.login(token);
