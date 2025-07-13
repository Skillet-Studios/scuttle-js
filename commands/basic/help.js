const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows a list of commands.'),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🪴 Scuttle is brought to you by Skillet Studios')
        .setDescription(
          'I am a bot that provides quick and detailed **League of Legends** statistics.'
        )
        .setColor(0x00ff00);

      const commands = {
        '✅ /enable':
          'Sets the main channel where the bot will send automated messages',
        'ℹ️ /support': 'Provides the link to join the support server.',
        '📈 /stats daily {RIOT ID}':
          'Displays daily stats for Riot ID specified\nExample: `/stats Username NA1`',
        '📈 /stats weekly {RIOT ID}':
          'Displays weekly stats for Riot ID specified\nExample: `/stats weekly Username NA1`',
        '📈 /stats monthly {RIOT ID}':
          'Displays monthly stats for Riot ID specified\nExample: `/stats monthly Username NA1`',
        '💼 /reports weekly':
          'Displays weekly stat comparison for all summoners in your Guild',
        '💼 /reports monthly':
          'Displays monthly stat comparison for all summoners in your Guild',
        '🎮 /summoners list': 'Displays all summoners in your Guild',
        '🎮 /summoners add {RIOT ID}':
          'Adds a summoner to your Guild\nExample: `/summoners add Username NA1`',
        '🎮 /summoners remove {RIOT ID}':
          'Removes a summoner from your Guild\nExample: `/summoners remove Username NA1`',
      };

      for (const [command, description] of Object.entries(commands)) {
        embed.addFields({ name: command, value: description, inline: false });
      }

      embed.setFooter({
        text: '📝 Note: match data is updated hourly on the hour. If you add a new summoner to your Guild, expect to see stats at the next hour.',
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Error executing /help:', error);

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'An error occurred while executing the command.',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: 'An error occurred while executing the command.',
            ephemeral: true,
          });
        }
      } catch (replyError) {
        console.error('❌ Failed to send error response:', replyError);
      }
    }
  },
};
