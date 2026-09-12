const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casier')
    .setDescription('Voir les avertissements attribués')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('utilisateur')
        .setDescription("Voir le casier d'un membre précis")
        .addUserOption((opt) =>
          opt.setName('cible').setDescription('Le membre à consulter').setRequired(true)))
    .addSubcommand((sub) =>
      sub
        .setName('tout')
        .setDescription('Voir tous les avertissements donnés sur le serveur')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'utilisateur') {
      const target = interaction.options.getUser('cible');
      const warns = db.getWarns(interaction.guild.id, target.id);

      if (warns.length === 0) {
        return interaction.reply({
          content: `✅ ${target.tag} n'a aucun avertissement.`,
          ephemeral: true
        });
      }

      const description = warns
        .map((w, i) => {
          const date = new Date(w.date).toLocaleDateString('fr-FR');
          return `**#${i + 1}** — ${w.raison}\nPar ${w.moderateur} • ${date}`;
        })
        .join('\n\n');

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle(`📋 Casier de ${target.tag}`)
            .setDescription(description)
            .setFooter({ text: `${warns.length} avertissement(s)` })
        ]
      });
    }

    if (sub === 'tout') {
      const allWarns = db.getAllGuildWarns(interaction.guild.id);
      const userIds = Object.keys(allWarns);

      if (userIds.length === 0) {
        return interaction.reply({
          content: '✅ Aucun avertissement enregistré sur ce serveur.',
          ephemeral: true
        });
      }

      const lines = await Promise.all(
        userIds.map(async (userId) => {
          const user = await interaction.client.users.fetch(userId).catch(() => null);
          const name = user ? user.tag : userId;
          return `**${name}** — ${allWarns[userId].length} avertissement(s)`;
        })
      );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('📋 Casier du serveur')
            .setDescription(lines.join('\n'))
            .setFooter({ text: `${userIds.length} membre(s) averti(s)` })
        ]
      });
    }
  }
};
