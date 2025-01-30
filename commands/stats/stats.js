const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/api');
const { API_URL } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Commands related to summoner stats')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('daily')
        .setDescription(
          "Displays a summoner's stats for games played in the last 24 hours."
        )
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
        .setName('weekly')
        .setDescription(
          "Displays a summoner's stats for games played in the last 7 days."
        )
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
        .setName('monthly')
        .setDescription(
          "Displays a summoner's stats for games played in the last 30 days."
        )
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
      const range =
        subcommand === 'daily' ? 1 : subcommand === 'weekly' ? 7 : 30;
      const queueType = 'ranked_solo';
      const guildId = interaction.guildId;
      const summonerName = interaction.options.getString('summoner_name');
      const tag = interaction.options.getString('tag');
      const summonerRiotId = `${summonerName} #${tag}`;

      // Step 1: Get summoner's PUUID
      let puuid;
      try {
        const puuidResponse = await api.get(`${API_URL}/riot/puuid`, {
          params: { riotId: summonerRiotId },
        });
        puuid = puuidResponse.data.puuid;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(
            `Error getting stats for summoner **${summonerRiotId}**. Make sure this user exists.`
          );
        }
        throw error;
      }

      // Step 2: Check if summoner exists in guild
      const guildSummonersResponse = await api.get(
        `${API_URL}/summoners/guild/${guildId}`
      );
      const summonersInGuild = guildSummonersResponse.data || [];

      if (summonersInGuild.length === 0) {
        throw new Error(
          'There are currently no summoners in your guild. Add a summoner with `/summoners add {RIOT ID}` to view their stats.'
        );
      }

      const isSummonerInGuild = summonersInGuild.some(
        (summoner) => summoner.puuid === puuid
      );
      if (!isSummonerInGuild) {
        throw new Error(
          `Summoner **${summonerRiotId}** is not part of your guild. Add them with \`/summoners add {RIOT ID}\` to view their stats.`
        );
      }

      // Step 3: Check if summoner data is cached
      const cacheResponse = await api.get(
        `${API_URL}/summoners/cache/${puuid}`,
        {
          params: { range, name: summonerRiotId },
        }
      );

      if (!cacheResponse.data.isCached) {
        throw new Error(
          `Summoner **${summonerRiotId}** has been added recently and does not have match data yet. Please allow about 1 hour.`
        );
      }

      // Step 4: Fetch summoner stats
      let stats;
      try {
        const statsResponse = await api.get(
          `${API_URL}/stats/pretty/${puuid}`,
          {
            params: { range, queueType },
          }
        );
        stats = statsResponse.data.stats;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`No stats found for **${summonerRiotId}**.`);
        }
        throw error;
      }

      // Step 5: Create stats embed
      const embed = new EmbedBuilder()
        .setTitle(
          `📈 Summoner ${summonerRiotId}'s stats for the past ${range} day(s).`
        )
        .setDescription(
          `Collected stats for **${summonerRiotId}**'s Ranked Solo Queue matches over the past ${range} day(s).`
        )
        .setColor(0x00ff00);

      if (stats && Object.keys(stats).length > 0) {
        for (const [key, value] of Object.entries(stats)) {
          embed.addFields({ name: key, value: value.toString(), inline: true });
        }
      } else {
        throw new Error(
          `Error getting stats for summoner **${summonerRiotId}**. Make sure this user exists.`
        );
      }

      embed.setFooter({
        text: '📝 Note: match data is updated hourly on the hour.',
      });

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Stats Command Error')
        .setDescription(error.message)
        .setColor(0xff0000);

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
};
