const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const commands = [];
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
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      `🚀 Registering ${commands.length} application (/) commands...`
    );
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log('✅ Successfully registered application commands.');
  } catch (error) {
    console.error('❌ Failed to register application commands:', error);
  }
})();
