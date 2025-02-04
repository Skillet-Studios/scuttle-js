const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hours')
    .setDescription(
      'Check how much time a summoner has spent playing League of Legends.'
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('daily')
        .setDescription(
          "Displays a summoner's playtime for games played in the last 24 hours."
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
          "Displays a summoner's playtime for games played in the last 7 days."
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
          "Displays a summoner's playtime for games played in the last 30 days."
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
        subcommand === 'daily' ? 1 : subcommand === 'weekly' ? 7 : 31; // Default to monthly range

      const queueType = 'ranked_solo'; // Default to ranked solo queue
      const guildId = interaction.guildId;
      const summonerName = interaction.options.getString('summoner_name');
      const tag = interaction.options.getString('tag');
      const summonerRiotId = `${summonerName} #${tag}`;

      // Step 1: Get summoner's PUUID
      let puuid;
      try {
        const puuidResponse = await api.get(`/riot/puuid`, {
          params: { riotId: summonerRiotId },
        });
        puuid = puuidResponse.data.puuid;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(
            `Error getting playtime for summoner **${summonerRiotId}**. Make sure this user exists.`
          );
        }
        throw error;
      }

      // Step 2: Check if summoner exists in guild
      const guildSummonersResponse = await api.get(
        `/summoners/guild/${guildId}`
      );
      const summonersInGuild = guildSummonersResponse.data || [];

      if (summonersInGuild.length === 0) {
        throw new Error(
          'There are currently no summoners in your guild. Add a summoner with `/summoners add {RIOT ID}` to track their playtime.'
        );
      }

      const isSummonerInGuild = summonersInGuild.some(
        (summoner) => summoner.puuid === puuid
      );
      if (!isSummonerInGuild) {
        throw new Error(
          `Summoner **${summonerRiotId}** is not part of your guild. Add them with \`/summoners add {RIOT ID}\` to track their playtime.`
        );
      }

      // Step 3: Fetch summoner playtime
      let playtimeData;
      try {
        const playtimeResponse = await api.get(`/hours/${puuid}`, {
          params: { range, queueType },
        });
        playtimeData = playtimeResponse.data;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`No playtime data found for **${summonerRiotId}**.`);
        }
        throw error;
      }

      // Step 4: Create playtime embed
      const embed = new EmbedBuilder()
        .setTitle(
          `🕒 ${summonerRiotId}'s playtime for the past ${range} day(s)`
        )
        .setDescription(
          `This is the total time **${summonerRiotId}** has spent playing Ranked Solo Queue over the past ${range} days.`
        )
        .setColor(0x00ff00)
        .addFields(
          {
            name: 'Total Matches Played',
            value: `${playtimeData.matchesPlayed}`,
            inline: true,
          },
          {
            name: 'Total Playtime',
            value: `${playtimeData.pretty}`,
            inline: true,
          }
        )
        .setFooter({ text: '📝 Note: Match data updates hourly on the hour.' });

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Error fetching playtime:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Hours Command Error')
        .setDescription(error.message)
        .setColor(0xff0000);

      await interaction.followUp({ embeds: [errorEmbed] });
    }
  },
};
