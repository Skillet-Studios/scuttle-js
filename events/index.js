const { guildJoin, guildLeave, command } = require('../utils/logger');
const { ENVIRONMENT } = require('../config');
const api = require('../utils/api');

module.exports = {
  name: 'Events',
  once: false,

  /**
   * Executes when the bot is ready and logs its status.
   * If in production, it updates the external API with bot statistics.
   *
   * @param {import('discord.js').Client} client - The Discord bot client instance.
   */
  async execute(client) {
    try {
      console.log(`${client.user.tag} has connected to Discord!`);
      console.log(
        `${client.user.tag} is connected to ${client.guilds.cache.size} guilds.`
      );

      // Fetch application commands to ensure they are up-to-date
      await client.application.commands.fetch();
      console.log('Bot tree commands synced.');

      if (ENVIRONMENT === 'prod') {
        try {
          // Update guild count in the external API
          await api.put('/guilds/count', { count: client.guilds.cache.size });

          // Update Top.gg stats
          await api.put('/topgg/stats', {
            guildCount: client.guilds.cache.size,
            shardCount: client.shard?.count || 1,
          });
        } catch (apiError) {
          console.error('Failed to update external API:', apiError.message);
        }
      }
    } catch (error) {
      console.error('Error during bot initialization:', error.message);
    }
  },

  /**
   * Executes when the bot joins a new guild.
   * Sends data to the external API and logs the event.
   *
   * @param {import('discord.js').Guild} guild - The guild the bot joined.
   */
  async onGuildJoin(guild) {
    try {
      console.log(`Joined new guild: ${guild.name} with Guild ID: ${guild.id}`);

      // Notify external API about the new guild
      await api.post('/guilds', { guildId: guild.id, guildName: guild.name });

      // Update total guild count in the external API
      await api.put('/guilds/count', { count: guild.client.guilds.cache.size });

      // Log the guild join event
      await guildJoin(guild.client, guild);
    } catch (error) {
      console.error(
        `Failed to handle guild join event for ${guild.name}. It is likely this guild is already in database:`,
        error.message
      );
    }
  },

  /**
   * Executes when the bot leaves a guild.
   * Logs the event for tracking.
   *
   * @param {import('discord.js').Guild} guild - The guild the bot left.
   */
  async onGuildLeave(guild) {
    try {
      console.log(`Left guild: ${guild.name} with Guild ID: ${guild.id}`);

      // Log the guild leave event
      await guildLeave(guild.client, guild);
    } catch (error) {
      console.error(
        `Failed to handle guild leave event for ${guild.name}:`,
        error.message
      );
    }
  },

  /**
   * Executes when an interaction (e.g., a slash command) is created.
   * Logs the command usage and updates analytics in the external API.
   *
   * @param {import('discord.js').Interaction} interaction - The interaction that was triggered.
   */
  async onInteractionCreate(interaction) {
    if (!interaction.isCommand()) return;

    try {
      console.log(
        `\n[${interaction.guild?.name || 'DM'}]  [${
          interaction.user?.tag || 'Unknown User'
        }]  [/${interaction.commandName}]`
      );

      // Normalize command name by replacing spaces with underscores
      const commandName = interaction.commandName.replace(/ /g, '_');

      // Log command analytics to external API
      await api.post('/commands/analytics/count', { command: commandName });

      // Log the command usage for internal tracking
      await command(interaction.client, interaction);
    } catch (error) {
      console.error(
        `Failed to log command: /${interaction.commandName}`,
        error.message
      );
    }
  },

  /**
   * Executes when an error occurs.
   * Logs the error and sends it to the error tracking channel.
   *
   * @param {Error} error - The error object that was thrown.
   * @param {import('discord.js').Interaction} [interaction] - The interaction where the error occurred (if applicable).
   */
  async onError(error, interaction) {
    try {
      console.error('An error occurred:', error.message);

      if (!interaction || !interaction.client) {
        console.error('Error occurred outside of an interaction context.');
        return;
      }

      // Log the error in the error tracking channel
      await error(interaction.client, interaction, error.stack, error.message);
    } catch (logError) {
      console.error('Failed to log error:', logError.message);
    }
  },
};
