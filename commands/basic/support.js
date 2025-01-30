const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SUPPORT_GUILD_LINK } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Provides the link to join the support server.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛠️ Need Help? Join Our Support Server! 🎉')
      .setDescription(
        `If you need assistance, have questions, or just want to connect with other users, 
        you're welcome to join our **[Support Server](${SUPPORT_GUILD_LINK})**! 🛡️\n\n
        Our team and community members are here to help you with anything related to the bot. 
        Don't hesitate to drop by and say hi! 😊`
      )
      .setColor(0x5865f2)
      .setFooter({ text: "We're here to help! 🧡 | See you there!" });

    await interaction.reply({ embeds: [embed] });
  },
};
