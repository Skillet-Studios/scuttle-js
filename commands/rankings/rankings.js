const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rankings')
    .setDescription('Commands related to rankings')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('weekly')
        .setDescription('Displays weekly rankings for the top 5 summoners.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('monthly')
        .setDescription('Displays monthly rankings for the top 5 summoners.')
    ),

  async execute(interaction) {
    if (!interaction.guildId) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('This command must be used in a server.')
        .setColor(0xff0000);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const now = new Date();
      let startDate;
      const queueType = 'ranked_solo';
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'weekly') {
        // Find the most recent Sunday
        const mostRecentSunday = new Date(now);
        mostRecentSunday.setDate(now.getDate() - now.getDay() + 1); // Sunday is day 0
        startDate = mostRecentSunday.toISOString().split('T')[0];
      } else if (subcommand === 'monthly') {
        // First day of the current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
      }

      // Fetch rankings from API
      const response = await api.get('/rankings/pretty', {
        params: {
          guildId: interaction.guildId,
          startDate: startDate,
          queueType: queueType,
        },
      });

      const rankings = response.data.rankings || null;

      if (rankings) {
        const today = now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const startDateObj = new Date(startDate);
        const formattedStartDate = startDateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const embed = new EmbedBuilder()
          .setTitle(`🏆 Top Summoners (${formattedStartDate} - ${today})`)
          .setDescription(
            `Top rankings in ${interaction.guild?.name || 'this guild'}`
          )
          .setColor(0xffd700); // Gold color

        for (const [statName, topEntries] of Object.entries(rankings)) {
          const formattedEntries = topEntries
            .map((entry, i) => `${i + 1}. ${entry.value} - ${entry.name}`)
            .join('\n');

          embed.addFields({
            name: statName,
            value: formattedEntries,
            inline: true,
          });
        }

        embed.setFooter({ text: 'Data is updated hourly.' });

        await interaction.followUp({ embeds: [embed] });
      } else {
        const noDataEmbed = new EmbedBuilder()
          .setTitle('❌ Rankings Command')
          .setDescription('No rankings data available yet.')
          .setColor(0xff0000)
          .setFooter({ text: 'Data is updated hourly.' });

        await interaction.followUp({ embeds: [noDataEmbed] });
      }
    } catch (error) {
      console.error('❌ Error fetching rankings:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Rankings Command Error')
        .setDescription('An error occurred while retrieving rankings.')
        .setColor(0xff0000);

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
};
