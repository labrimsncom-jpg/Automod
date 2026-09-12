const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannir un utilisateur via son ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) =>
      opt.setName('id').setDescription("L'ID Discord de l'utilisateur à débannir").setRequired(true))
    .addStringOption((opt) =>
      opt.setName('raison').setDescription('Raison du unban').setRequired(false)),

  async execute(interaction) {
    const userId = interaction.options.getString('id');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    // Vérifie que l'utilisateur est bien banni
    const bans = await interaction.guild.bans.fetch().catch(() => null);
    const banEntry = bans?.get(userId);

    if (!banEntry) {
      return interaction.reply({
        content: "❌ Cet ID n'apparaît pas dans la liste des bannis de ce serveur.",
        ephemeral: true
      });
    }

    try {
      await interaction.guild.members.unban(userId, raison);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Utilisateur débanni')
            .addFields(
              { name: 'Utilisateur', value: `${banEntry.user.tag} (${userId})` },
              { name: 'Modérateur', value: `${interaction.user.tag}` },
              { name: 'Raison', value: raison }
            )
        ]
      });

      await sendLog(interaction.guild, {
        title: '✅ Unban',
        color: 0x57F287,
        fields: [
          { name: 'Utilisateur', value: `${banEntry.user.tag} (${userId})` },
          { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Raison', value: raison }
        ]
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Une erreur est survenue lors du unban.', ephemeral: true });
    }
  }
};
