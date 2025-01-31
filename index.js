const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const events = require('./events');
const { startScheduledJobs } = require('./scheduler');

dotenv.config();

const token = process.env.DISCORD_TOKEN;

// Create a new Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Matches intents.guilds = True
    GatewayIntentBits.GuildMessages, // Matches intents.messages = True
  ],
});

// Initialize a collection for commands
client.commands = new Collection();

// Dynamically load commands from the `commands/` directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).flatMap((dir) =>
  fs
    .readdirSync(path.join(commandsPath, dir))
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join(dir, file))
);

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(
      `[⚠️ WARNING] The command at ${file} is missing a "data" or "execute" property.`
    );
  }
}

// Register event listeners
client.once(Events.ClientReady, async () => {
  console.log(`✅ ${client.user.tag} is now online!`);

  // Call the `execute` function from `events/index.js`
  await events.execute(client);

  // Start scheduled jobs after the bot is ready
  startScheduledJobs(client);
});

client.on(Events.GuildCreate, events.onGuildJoin);
client.on(Events.GuildDelete, events.onGuildLeave);
client.on(Events.InteractionCreate, events.onInteractionCreate);
client.on(Events.Error, events.onError);

// Log in to Discord
client.login(token);
