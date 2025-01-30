const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config'); // Pull environment variables from config.js

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

/**
 * Recursively load all command files from the commands directory.
 * @param {string} directory
 */
function loadCommands(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      loadCommands(filePath); // Recursively load subdirectories
    } else if (file.name.endsWith('.js')) {
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(
          `⚠️ Skipping ${file.name}: Missing "data" or "execute" property.`
        );
      }
    }
  }
}

// Load all commands
loadCommands(commandsPath);

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🚀 Registering ${commands.length} global (/) commands...`);

    await rest.put(Routes.applicationCommands(config.CLIENT_ID), {
      body: commands,
    });

    console.log('✅ Successfully registered global application commands.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
