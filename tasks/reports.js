const { EmbedBuilder } = require('discord.js');
const api = require('../utils/api');

/**
 * Sends weekly reports to all guilds that have a main channel set.
 * Runs every Sunday at 4:00 PM EST.
 * @param {import('discord.js').Client} client - The Discord bot client.
 */
async function sendWeeklyReports(client) {
  console.log(`\n📅 [Weekly Reports] Fetching all guilds...`);

  for (const guild of client.guilds.cache.values()) {
    console.log(`🏆 [${guild.name}] Fetching main reporting channel...`);

    let channelId;
    try {
      // Fetch the main channel ID from the API
      const channelResponse = await api.get(`/guilds/channel`, {
        params: { guildId: guild.id },
      });
      channelId = channelResponse.data?.mainChannelId || null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️ [${guild.name}] No main channel set. Skipping...`);
      } else {
        console.error(
          `❌ [${guild.name}] API Request Failed: /guilds/channel`,
          error.message
        );
      }
      continue;
    }

    if (!channelId) {
      console.log(
        `🚫 [${guild.name}] No valid main channel found. Skipping...`
      );
      continue;
    }

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.log(
        `🚫 [${guild.name}] Main channel ID exists but channel not found. Skipping...`
      );
      continue;
    }

    try {
      // Send a formatted "Loading Report" embed
      const loadingEmbed = new EmbedBuilder()
        .setTitle('📊 Generating Weekly Report...')
        .setDescription(
          'Please wait while the automated weekly report is being prepared...'
        )
        .setColor(0xffd700) // Gold color
        .setFooter({ text: 'This may take a few seconds.' });

      await channel.send({ embeds: [loadingEmbed] });

      let report;
      try {
        const reportResponse = await api.get(`/reports/pretty`, {
          params: { guildId: guild.id, range: 7, queueType: 'ranked_solo' },
        });
        report = reportResponse.data.report;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(
            `⚠️ [${guild.name}] No report found. Suggesting summoner addition.`
          );
          const noReportEmbed = new EmbedBuilder()
            .setTitle('❌ Weekly Report Not Available')
            .setDescription(
              'No report data found. Make sure summoners are added to your server using `/summoners add RiotName Tag`.'
            )
            .setColor(0xff0000);

          await channel.send({ embeds: [noReportEmbed] });
          continue;
        }
        throw error; // Rethrow any other errors
      }

      // Fetch the summoners in this guild
      let summoners = [];
      try {
        const summonersResponse = await api.get(`/summoners/guild/${guild.id}`);
        summoners = summonersResponse.data || [];
      } catch (error) {
        console.error(
          `❌ [${guild.name}] Error fetching summoners:`,
          error.message
        );
        continue;
      }

      let cachedSummoners = [];
      let nonCachedSummoners = [];

      for (const summoner of summoners) {
        try {
          const result = await api.get(`/summoners/cache/${summoner.puuid}`, {
            params: { name: summoner.name },
          });

          if (result.data.isCached) {
            cachedSummoners.push(summoner.name);
          } else {
            nonCachedSummoners.push(summoner.name);
          }
        } catch (error) {
          console.error(
            `❌ [${guild.name}] Error checking summoner cache:`,
            error.message
          );
        }
      }

      // Generate the main report embed
      const reportEmbed = new EmbedBuilder()
        .setTitle(`📊 ${guild.name}'s Ranked Solo Queue Report`)
        .setDescription(`Report for the past 7 days.`)
        .setColor(0x00ff00);

      for (const [metric, fields] of Object.entries(report)) {
        if (!fields?.['Max Value'] || !fields?.['Name']) continue; // Prevent empty fields

        reportEmbed.addFields({
          name: metric,
          value: `${fields['Max Value']} - ${fields['Name']}`,
          inline: true,
        });
      }

      // Summoners compared embed
      const comparedEmbed = new EmbedBuilder()
        .setTitle('🏆 Summoners Compared')
        .setDescription(
          'A list of all the summoners in your Guild whose stats have been compared.'
        )
        .setColor(0x00ff00);

      if (cachedSummoners.length > 0) {
        comparedEmbed.addFields({
          name: '🟢 Cached Summoners',
          value: cachedSummoners.map((name) => `🟢 ${name}`).join('\n'),
          inline: false,
        });
      } else {
        comparedEmbed.setDescription('No summoners have been cached yet.');
      }

      // Summoners not compared embed
      const notComparedEmbed = new EmbedBuilder()
        .setTitle('🔴 Summoners Not Compared')
        .setDescription(
          'A list of all the summoners in your Guild whose stats have not been retrieved yet.'
        )
        .setColor(0xff0000);

      if (nonCachedSummoners.length > 0) {
        notComparedEmbed.addFields({
          name: '🔴 Not Cached Summoners',
          value: nonCachedSummoners.map((name) => `🔴 ${name}`).join('\n'),
          inline: false,
        });
      } else {
        notComparedEmbed.setDescription('All summoners are cached.');
      }

      await channel.send({
        embeds: [reportEmbed, comparedEmbed, notComparedEmbed],
      });
      console.log(`✅ [${guild.name}] Report sent successfully.`);
    } catch (error) {
      console.error(`❌ [${guild.name}] Error sending report:`, error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Automatic Weekly Report Error')
        .setDescription(
          'An error occurred while generating the weekly report. Please check logs for details.'
        )
        .setColor(0xff0000);

      try {
        await channel.send({ embeds: [errorEmbed] });
      } catch (sendError) {
        console.error(
          `❌ [${guild.name}] Failed to send error embed:`,
          sendError.message
        );
      }
    }
  }
}

module.exports = { sendWeeklyReports };
