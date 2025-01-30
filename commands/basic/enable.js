const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enable')
    .setDescription(
      'Sets the text channel where automatic messages will be sent, such as reports.'
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
      const guildId = interaction.guildId;
      const channelId = interaction.channelId;

      const response = await api.post('/guilds/channel', {
        guildId: guildId.toString(),
        channelId: channelId.toString(),
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Enable Command')
        .setDescription('Scuttle is now enabled on this channel.')
        .setColor(0x00ff00);

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to enable channel:', error.message);

      let errorMessage = 'An error occurred while enabling the channel.';
      if (error.response?.status === 400) {
        errorMessage = 'Scuttle is already enabled on this channel.';
      }

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Enable Command Failed')
        .setDescription(errorMessage)
        .setColor(0xff0000);

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
};
