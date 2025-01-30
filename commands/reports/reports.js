const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/api');
const { OWNER_DISCORD_ID } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reports')
    .setDescription('Commands related to reports')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('weekly')
        .setDescription(
          'Displays a weekly report comparing the stats of all summoners in your Guild.'
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('monthly')
        .setDescription(
          'Displays a monthly report comparing the stats of all summoners in your Guild.'
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('admin')
        .setDescription('This command is only for the bot admin.')
        .addStringOption((option) =>
          option
            .setName('guild_id')
            .setDescription('The ID of the guild.')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (
      !interaction.guildId &&
      interaction.options.getSubcommand() !== 'admin'
    ) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('This command must be used in a server.')
        .setColor(0xff0000);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const subcommand = interaction.options.getSubcommand();
      const range = subcommand === 'weekly' ? 7 : 30;
      let guildId = interaction.guildId;
      let guildName = interaction.guild?.name || 'Unknown Guild';
      const queueType = 'ranked_solo';

      if (subcommand === 'admin') {
        if (interaction.user.id !== OWNER_DISCORD_ID) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Reports Command')
            .setDescription('This command is only for the bot admin.')
            .setColor(0xff0000);

          return interaction.followUp({ embeds: [errorEmbed] });
        }

        guildId = interaction.options.getString('guild_id');

        // Fetch the guild details
        const guildResponse = await api.get(`/guilds/filter`, {
          params: { guildId },
        });
        if (!guildResponse.data.guild) {
          throw new Error('The specified guild does not exist.');
        }

        guildName = guildResponse.data.guild.name || 'Unknown Guild';
      }

      let report;
      try {
        const reportResponse = await api.get(`/reports/pretty`, {
          params: { guildId, range, queueType },
        });
        report = reportResponse.data.report;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(
            'No report found. Please ensure summoners are added to your server using `/summoners add Name Tag`.'
          );
        }
        throw error; // Rethrow any other errors
      }

      // Fetch the summoners for the guild
      const summonersResponse = await api.get(`/summoners/guild/${guildId}`);
      const summoners = summonersResponse.data || [];

      let cachedSummoners = [];
      let nonCachedSummoners = [];

      for (const summoner of summoners) {
        const result = await api.get(`/summoners/cache/${summoner.puuid}`, {
          params: { name: summoner.name },
        });
        if (result.data.isCached) {
          cachedSummoners.push(summoner.name);
        } else {
          nonCachedSummoners.push(summoner.name);
        }
      }

      // Generate the main report embed
      const reportEmbed = new EmbedBuilder()
        .setTitle(`📊 ${guildName}'s Ranked Solo Queue Report`)
        .setDescription(`Report for the past ${range} days.`)
        .setColor(0x00ff00);

      for (const [metric, fields] of Object.entries(report)) {
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
          name: 'Cached Summoners',
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
          name: 'Not Cached Summoners',
          value: nonCachedSummoners.map((name) => `🔴 ${name}`).join('\n'),
          inline: false,
        });
      } else {
        notComparedEmbed.setDescription('All summoners are cached.');
      }

      await interaction.followUp({
        embeds: [reportEmbed, comparedEmbed, notComparedEmbed],
      });
    } catch (error) {
      console.error('❌ Error fetching report:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Reports Command Error')
        .setDescription(error.message)
        .setColor(0xff0000);

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
};
