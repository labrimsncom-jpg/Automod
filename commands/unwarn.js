const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const { sendLog } = require('../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription("Retirer un avertissement du casier d'un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName('utilisateur').setDescription('Le membre concerné').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('numero')
        .setDescription("Numéro de l'avertissement à retirer (voir /casier), ou 0 pour tout effacer")
        .setRequired(true)
        .setMinValue(0)),

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const numero = interaction.options.getInteger('numero');
    const warns = db.getWarns(interaction.guild.id, target.id);

    if (warns.length === 0) {
      return interaction.reply({
        content: `ℹ️ ${target.tag} n'a aucun avertissement.`,
        ephemeral: true
      });
    }

    // 0 = tout effacer
    if (numero === 0) {
      db.clearWarns(interaction.guild.id, target.id);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('🧹 Casier vidé')
            .setDescription(`Tous les avertissements de ${target.tag} ont été supprimés.`)
        ]
      });

      await sendLog(interaction.guild, {
        title: '🧹 Casier vidé',
        color: 0x57F287,
        fields: [
          { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
          { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Avertissements supprimés', value: `${warns.length}` }
        ]
      });
      return;
    }

    const index = numero - 1; // affichage 1-based pour l'utilisateur, tableau 0-based en interne
    if (index < 0 || index >= warns.length) {
      return interaction.reply({
        content: `❌ Numéro invalide. ${target.tag} a ${warns.length} avertissement(s) (utilise /casier pour voir les numéros).`,
        ephemeral: true
      });
    }

    const removed = warns[index];
    warns.splice(index, 1);
    db.clearWarns(interaction.guild.id, target.id);
    warns.forEach((w) => db.addWarn(interaction.guild.id, target.id, w));

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ Avertissement retiré')
          .addFields(
            { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
            { name: 'Avertissement retiré', value: removed.raison },
            { name: 'Avertissements restants', value: `${warns.length}` }
          )
      ]
    });

    await sendLog(interaction.guild, {
      title: '✅ Unwarn',
      color: 0x57F287,
      fields: [
        { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
        { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})` },
        { name: 'Avertissement retiré', value: removed.raison }
      ]
    });
  }
};
