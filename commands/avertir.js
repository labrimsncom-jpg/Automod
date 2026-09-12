const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const { sendLog } = require('../utils/logs');

// Nombre d'avertissements au-delà duquel le membre est banni automatiquement
const AUTO_BAN_WARN_THRESHOLD = 3;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avertir')
    .setDescription('Donner un avertissement à un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName('utilisateur').setDescription('Le membre à avertir').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('raison').setDescription("Raison de l'avertissement").setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison');

    const warn = {
      raison,
      moderateur: `${interaction.user.tag} (${interaction.user.id})`,
      date: new Date().toISOString()
    };

    const warns = db.addWarn(interaction.guild.id, target.id, warn);

    await target.send(
      `⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}**.\nRaison : ${raison}`
    ).catch(() => {});

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFEE75C)
          .setTitle('⚠️ Avertissement donné')
          .addFields(
            { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
            { name: 'Modérateur', value: `${interaction.user.tag}` },
            { name: 'Raison', value: raison },
            { name: "Nombre total d'avertissements", value: `${warns.length}` }
          )
      ]
    });

    await sendLog(interaction.guild, {
      title: '⚠️ Warn',
      color: 0xFEE75C,
      fields: [
        { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
        { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})` },
        { name: 'Raison', value: raison },
        { name: 'Total warns', value: `${warns.length}` }
      ]
    });

    // ----- Ban automatique si le seuil d'avertissements est dépassé -----
    if (warns.length > AUTO_BAN_WARN_THRESHOLD) {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      if (!member || !member.bannable) {
        // Le bot ne peut pas bannir (rôle trop haut, permissions...), on prévient juste
        await interaction.followUp({
          content: `⚠️ ${target.tag} a dépassé ${AUTO_BAN_WARN_THRESHOLD} avertissements mais je ne peux pas le bannir automatiquement (permissions insuffisantes).`,
          ephemeral: true
        });
        return;
      }

      const raisonBan = `Ban automatique : plus de ${AUTO_BAN_WARN_THRESHOLD} avertissements`;

      await target.send(
        `Tu as été banni automatiquement du serveur **${interaction.guild.name}** pour avoir dépassé ${AUTO_BAN_WARN_THRESHOLD} avertissements.`
      ).catch(() => {});

      await interaction.guild.members.ban(target, { reason: raisonBan });

      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔨 Ban automatique')
            .setDescription(`${target.tag} a dépassé ${AUTO_BAN_WARN_THRESHOLD} avertissements et a été banni.`)
        ]
      });

      await sendLog(interaction.guild, {
        title: '🔨 Ban automatique (trop d\'avertissements)',
        color: 0xED4245,
        fields: [
          { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
          { name: 'Raison', value: raisonBan },
          { name: 'Total warns', value: `${warns.length}` }
        ]
      });
    }
  }
};
