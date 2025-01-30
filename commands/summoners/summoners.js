const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/api');
const { API_URL } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summoners')
    .setDescription('Commands related to summoners')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('Displays a list of all summoners in your Guild.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Adds a summoner to your Guild.')
        .addStringOption((option) =>
          option
            .setName('summoner_name')
            .setDescription('The name of the summoner')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('tag').setDescription('Riot Tag').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Removes a summoner from your Guild.')
        .addStringOption((option) =>
          option
            .setName('summoner_name')
            .setDescription('The name of the summoner')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('tag').setDescription('Riot Tag').setRequired(true)
        )
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
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      const guildName = interaction.guild?.name || 'Unknown Guild';

      if (subcommand === 'list') {
        // Fetch summoners list
        let summoners;
        try {
          const response = await api.get(`/summoners/guild/${guildId}`);
          summoners = response.data;
        } catch (error) {
          if (error.response?.status === 404) {
            throw new Error(
              'There are currently no summoners in your guild. Add summoners using `/summoners add`.'
            );
          }
          throw error;
        }

        if (summoners.length === 0) {
          throw new Error(
            'This guild does not have any summoners. Add summoners using `/summoners add`.'
          );
        }

        const embed = new EmbedBuilder()
          .setTitle(`🎮 ${guildName}'s Summoners`)
          .setDescription(
            'This is a list of all the summoners added to this guild.'
          )
          .setColor(0x00ff00);

        embed.addFields({
          name: 'Summoners',
          value: summoners.map((summoner) => `🟢 ${summoner.name}`).join('\n'),
          inline: false,
        });

        await interaction.followUp({ embeds: [embed] });
      } else {
        // Common for both add and remove
        const summonerName = interaction.options.getString('summoner_name');
        const tag = interaction.options.getString('tag');
        const summonerRiotId = `${summonerName} #${tag}`;

        if (subcommand === 'add') {
          // Add summoner
          const body = { guildId: guildId.toString(), summonerRiotId };

          let success;
          try {
            const response = await api.post(`/summoners`, body);
            success = response.data.success;
          } catch (error) {
            throw new Error(
              `Failed to add **${summonerRiotId}** to **${guildName}**.`
            );
          }

          const embed = new EmbedBuilder()
            .setTitle(
              success ? '✅ Summoner Add Command' : '❌ Summoner Add Command'
            )
            .setDescription(
              success
                ? `**${summonerRiotId}** was successfully added to **${guildName}**.`
                : `Failed to add **${summonerRiotId}** to **${guildName}**.`
            )
            .setColor(success ? 0x00ff00 : 0xff0000);

          await interaction.followUp({ embeds: [embed] });
        } else if (subcommand === 'remove') {
          // Remove summoner
          let success;
          try {
            const response = await api.delete(`/summoners`, {
              params: { guildId: guildId.toString(), summonerRiotId },
            });
            success = response.data.success;
          } catch (error) {
            throw new Error(
              `Failed to remove **${summonerRiotId}** from **${guildName}**.`
            );
          }

          const embed = new EmbedBuilder()
            .setTitle(
              success
                ? '✅ Summoner Remove Command'
                : '❌ Summoner Remove Command'
            )
            .setDescription(
              success
                ? `**${summonerRiotId}** was successfully removed from **${guildName}**.`
                : `Failed to remove **${summonerRiotId}** from **${guildName}**.`
            )
            .setColor(success ? 0x00ff00 : 0xff0000);

          await interaction.followUp({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('❌ Error handling summoners command:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Summoners Command Error')
        .setDescription(error.message)
        .setColor(0xff0000);

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
};
