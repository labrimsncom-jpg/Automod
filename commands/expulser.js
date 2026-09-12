const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('expulser')
    .setDescription('Expulser (kick) un membre du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) =>
      opt.setName('utilisateur').setDescription('Le membre à expulser').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('raison').setDescription("Raison de l'expulsion").setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('utilisateur');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: "❌ Ce membre n'est pas sur le serveur.", ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({
        content: '❌ Je ne peux pas expulser ce membre (rôle trop haut ou permissions insuffisantes).',
        ephemeral: true
      });
    }

    try {
      await target.send(
        `Tu as été expulsé du serveur **${interaction.guild.name}**.\nRaison : ${raison}`
      ).catch(() => {});

      await member.kick(raison);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFAA61A)
            .setTitle('👢 Membre expulsé')
            .addFields(
              { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
              { name: 'Modérateur', value: `${interaction.user.tag}` },
              { name: 'Raison', value: raison }
            )
        ]
      });

      await sendLog(interaction.guild, {
        title: '👢 Kick',
        color: 0xFAA61A,
        fields: [
          { name: 'Utilisateur', value: `${target.tag} (${target.id})` },
          { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Raison', value: raison }
        ]
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "❌ Une erreur est survenue lors de l'expulsion.", ephemeral: true });
    }
  }
};
