const { EmbedBuilder } = require('discord.js');
const db = require('./database');

/**
 * Envoie un embed dans le salon de logs configuré pour ce serveur.
 * Ne fait rien (silencieusement) si aucun salon n'a été configuré.
 */
async function sendLog(guild, { title, color = 0xED4245, fields = [], description }) {
  const config = db.getGuildConfig(guild.id);
  if (!config.logChannelId) return;

  const channel = guild.channels.cache.get(config.logChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp();

  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Impossible d\'envoyer le log :', err.message);
  }
}

module.exports = { sendLog };
