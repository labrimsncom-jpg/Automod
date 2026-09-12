const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-logs')
    .setDescription('Configurer le salon où seront envoyés les logs de modération')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName('salon')
        .setDescription('Le salon textuel qui recevra les logs (ban, kick, warn, raid...)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');

    db.setGuildConfig(interaction.guild.id, { logChannelId: channel.id });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ Salon de logs configuré')
          .setDescription(`Les logs de modération seront désormais envoyés dans ${channel}.`)
      ]
    });
  }
};
