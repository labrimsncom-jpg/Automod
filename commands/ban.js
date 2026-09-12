const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un membre du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt.setName('utilisateur').setDescription('Le membre à bannir').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('raison').setDescription('Raison du ban').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({
        content: '❌ Je ne peux pas bannir ce membre (rôle trop haut ou permissions insuffisantes).',
        ephemeral: true
      });
    }

    try {
      await target.send(
        `Tu as été banni du serveur **${interaction.guild.name}**.\nRaison : ${raison}`
      ).catch(() => {});

      await interaction.guild.members.ban(target, { reason: raison });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('🔨 Membre banni')
            .addFields(
              { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
              { name: 'Modérateur', value: `${interaction.user.tag}` },
              { name: 'Raison', value: raison }
            )
        ]
      });

      await sendLog(interaction.guild, {
        title: '🔨 Ban',
        color: 0xED4245,
        fields: [
          { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
          { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Raison', value: raison }
        ]
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Une erreur est survenue lors du ban.', ephemeral: true });
    }
  }
};
