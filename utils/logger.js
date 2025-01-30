const { EmbedBuilder } = require('discord.js');
const {
  GUILD_ERROR_CHANNEL_ID,
  GUILD_JOIN_CHANNEL_ID,
  GUILD_LEAVE_CHANNEL_ID,
  GUILD_LOGS_CHANNEL_ID,
} = require('../config');
const { DateTime } = require('luxon');

/**
 * Logs when the bot joins a new guild.
 * @param {Client} bot - The Discord client.
 * @param {Guild} guild - The guild the bot joined.
 */
async function guildJoin(bot, guild) {
  try {
    const channel = bot.channels.cache.get(GUILD_JOIN_CHANNEL_ID);
    if (!channel) {
      console.error(
        `Error: Unable to find GUILD_JOIN_CHANNEL_ID (${GUILD_JOIN_CHANNEL_ID}).`
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🟢 Scuttle has joined *'${guild.name}'*`)
      .setColor(0x00ff00)
      .addFields({
        name: 'Date/Time',
        value: DateTime.now()
          .setZone('America/New_York')
          .toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
        inline: false,
      });

    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error(`Failed to log guild join event: ${e.message}`);
  }
}

/**
 * Logs when the bot leaves a guild.
 * @param {Client} bot - The Discord client.
 * @param {Guild} guild - The guild the bot left.
 */
async function guildLeave(bot, guild) {
  try {
    const channel = bot.channels.cache.get(GUILD_LEAVE_CHANNEL_ID);
    if (!channel) {
      console.error(
        `Error: Unable to find GUILD_LEAVE_CHANNEL_ID (${GUILD_LEAVE_CHANNEL_ID}).`
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔴 Scuttle has left *'${guild.name}'*`)
      .setColor(0xff0000)
      .addFields({
        name: 'Date/Time',
        value: DateTime.now()
          .setZone('America/New_York')
          .toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
        inline: false,
      });

    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error(`Failed to log guild leave event: ${e.message}`);
  }
}

/**
 * Logs an error that occurred during an interaction.
 * @param {Client} bot - The Discord client.
 * @param {Interaction} interaction - The interaction where the error occurred.
 * @param {string} errorStack - The error stack trace.
 * @param {string} errorMessage - The error message.
 */
async function error(bot, interaction, errorStack, errorMessage) {
  try {
    const logChannel = bot.channels.cache.get(GUILD_ERROR_CHANNEL_ID);
    if (!logChannel) {
      console.error(
        `Error: Unable to find GUILD_ERROR_CHANNEL_ID (${GUILD_ERROR_CHANNEL_ID}).`
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Flagged Error!')
      .setDescription('An error occurred while executing a slash command.')
      .setColor(0xff0000)
      .addFields(
        {
          name: 'Error Command',
          value: `\`${interaction.commandName}\``,
          inline: false,
        },
        {
          name: 'Error Stack',
          value: `\`\`\`${errorStack}\`\`\``,
          inline: false,
        },
        { name: 'Error Message', value: `\`${errorMessage}\``, inline: false },
        {
          name: 'Error Timestamp',
          value: `\`${DateTime.now()
            .setZone('America/New_York')
            .toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')}\``,
          inline: false,
        },
        {
          name: 'Error Guild',
          value: `\`${interaction.guild?.name || 'N/A'}\` (${
            interaction.guild?.id || 'N/A'
          })`,
          inline: false,
        },
        {
          name: 'Error User',
          value: `\`${interaction.user.tag}\` (${interaction.user.id})`,
          inline: false,
        },
        {
          name: 'Error Command Channel',
          value: `\`${interaction.channel?.name || 'N/A'}\` (${
            interaction.channel?.id || 'N/A'
          })`,
          inline: false,
        }
      );

    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error(`Failed to log error: ${e.message}`);
  }
}

/**
 * Logs a command interaction.
 * @param {Client} bot - The Discord client.
 * @param {Interaction} interaction - The interaction where the command was used.
 * @param {EmbedBuilder} [outputEmbed] - Optional embed to log.
 * @param {EmbedBuilder[]} [outputEmbeds] - Optional array of embeds to log.
 */
async function command(
  bot,
  interaction,
  outputEmbed = null,
  outputEmbeds = null
) {
  try {
    const logChannel = bot.channels.cache.get(GUILD_LOGS_CHANNEL_ID);
    if (!logChannel) {
      console.error(
        `Error: Unable to find GUILD_LOGS_CHANNEL_ID (${GUILD_LOGS_CHANNEL_ID}).`
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🍀 Command Used')
      .setDescription('An interaction command has been used.')
      .setColor(0x00ff00)
      .addFields(
        {
          name: 'Command',
          value: `\`${interaction.commandName}\``,
          inline: false,
        },
        {
          name: 'Guild of Use',
          value: `\`${interaction.guild?.name || 'N/A'}\` (${
            interaction.guild?.id || 'N/A'
          })`,
          inline: false,
        },
        {
          name: 'Channel of Use',
          value: `\`${interaction.channel?.name || 'N/A'}\` (${
            interaction.channel?.id || 'N/A'
          })`,
          inline: false,
        },
        {
          name: 'Command User',
          value: `\`${interaction.user.tag}\` (${interaction.user.id})`,
          inline: false,
        }
      );

    await logChannel.send({ embeds: [embed] });

    if (outputEmbed) await logChannel.send({ embeds: [outputEmbed] });
    if (outputEmbeds) await logChannel.send({ embeds: outputEmbeds });
  } catch (e) {
    console.error(`Failed to log command usage: ${e.message}`);
  }
}

module.exports = { guildJoin, guildLeave, error, command };
