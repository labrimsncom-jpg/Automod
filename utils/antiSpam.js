const { sendLog } = require('./logs');

// ---------- RÉGLAGES (modifiables selon tes besoins) ----------
const FLOOD_WINDOW_MS = 5000;      // fenêtre de temps
const FLOOD_MAX_MESSAGES = 5;      // nb de messages max dans la fenêtre avant action
const PING_SPAM_THRESHOLD = 5;     // nb de mentions dans UN message avant action
const LINK_SPAM_WINDOW_MS = 8000;  // fenêtre pour le spam de liens
const LINK_SPAM_MAX = 3;           // nb de liens max dans la fenêtre

const RAID_WINDOW_MS = 10000;      // fenêtre pour détecter un raid
const RAID_THRESHOLD = 6;          // nb d'arrivées dans la fenêtre pour déclencher l'alerte
const RAID_ALERT_COOLDOWN_MS = 60000; // pour ne pas spam l'alerte de raid

const FLOOD_LOG_COOLDOWN_MS = 15000; // pour ne pas logger à chaque message pendant un flood
const WARNING_LIFETIME_MS = 3000;    // durée d'affichage du message d'avertissement du bot

const URL_REGEX = /(https?:\/\/[^\s]+)|(discord\.gg\/[^\s]+)/gi;

// Mémoire en RAM (par process) : suffisant pour un bot mono-serveur/mono-instance
const messageTimestamps = new Map(); // userId -> [timestamps]
const linkTimestamps = new Map();    // userId -> [timestamps]
const joinTimestamps = new Map();    // guildId -> [timestamps]
const lastRaidAlert = new Map();     // guildId -> timestamp
const lastFloodLog = new Map();      // userId -> timestamp
const activeWarnings = new Map();    // userId -> Message (avertissement actuellement affiché)

function pushAndPrune(map, key, now, windowMs) {
  const arr = (map.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  map.set(key, arr);
  return arr;
}

/**
 * Envoie un avertissement dans le salon (pas en reply, car le message fautif
 * est souvent déjà supprimé) et le supprime automatiquement après quelques secondes.
 */
async function sendSpamWarning(channel, user, raison) {
  try {
    // S'il y a déjà un avertissement affiché pour cette personne, on le supprime tout de suite
    const previous = activeWarnings.get(user.id);
    if (previous) {
      previous.delete().catch(() => {});
      activeWarnings.delete(user.id);
    }

    const warning = await channel.send({
      content: `⚠️ ${user}, arrête de spam (${raison}) ou tu risques une sanction.`
    });
    activeWarnings.set(user.id, warning);

    setTimeout(() => {
      warning.delete().catch(() => {});
      if (activeWarnings.get(user.id) === warning) {
        activeWarnings.delete(user.id);
      }
    }, WARNING_LIFETIME_MS);
  } catch (_) { /* ignore si le bot ne peut pas envoyer de message ici */ }
}

/**
 * À appeler sur chaque messageCreate. Retourne true si le message a été supprimé.
 */
async function handleMessageSpam(message) {
  if (!message.guild || message.author.bot) return false;
  const now = Date.now();

  // ----- 1. Flood de messages -----
  const msgTimes = pushAndPrune(messageTimestamps, message.author.id, now, FLOOD_WINDOW_MS);
  if (msgTimes.length > FLOOD_MAX_MESSAGES) {
    await message.delete().catch(() => {});
    await sendSpamWarning(message.channel, message.author, 'flood de messages');

    // On ne log qu'une fois toutes les FLOOD_LOG_COOLDOWN_MS pour ne pas spam le salon de logs
    const lastLog = lastFloodLog.get(message.author.id) || 0;
    if (now - lastLog > FLOOD_LOG_COOLDOWN_MS) {
      lastFloodLog.set(message.author.id, now);
      await sendLog(message.guild, {
        title: '🚨 Flood de messages détecté',
        color: 0xFEE75C,
        fields: [
          { name: 'Utilisateur', value: `${message.author} (${message.author.id})` },
          { name: 'Salon', value: `${message.channel}` },
          { name: 'Messages envoyés', value: `${msgTimes.length} en ${FLOOD_WINDOW_MS / 1000}s` }
        ]
      });
    }
    return true; // message déjà supprimé
  }

  // ----- 2. Spam de mentions (ping spam) -----
  const mentionCount = message.mentions.users.size + message.mentions.roles.size;
  if (mentionCount >= PING_SPAM_THRESHOLD) {
    await message.delete().catch(() => {});
    await sendSpamWarning(message.channel, message.author, 'spam de mentions/ping');
    await sendLog(message.guild, {
      title: '🚨 Spam de mentions détecté',
      color: 0xFEE75C,
      fields: [
        { name: 'Utilisateur', value: `${message.author} (${message.author.id})` },
        { name: 'Salon', value: `${message.channel}` },
        { name: 'Nb de mentions', value: `${mentionCount}` }
      ]
    });
    return true;
  }

  // ----- 3. Spam de liens -----
  if (URL_REGEX.test(message.content)) {
    const linkTimes = pushAndPrune(linkTimestamps, message.author.id, now, LINK_SPAM_WINDOW_MS);
    if (linkTimes.length > LINK_SPAM_MAX) {
      await message.delete().catch(() => {});
      await sendSpamWarning(message.channel, message.author, 'spam de liens');
      await sendLog(message.guild, {
        title: '🚨 Spam de liens détecté',
        color: 0xFEE75C,
        fields: [
          { name: 'Utilisateur', value: `${message.author} (${message.author.id})` },
          { name: 'Salon', value: `${message.channel}` }
        ]
      });
      return true;
    }
  }

  return false;
}

/**
 * À appeler sur chaque guildMemberAdd pour détecter un raid.
 */
async function handleRaidDetection(member) {
  const now = Date.now();
  const guildId = member.guild.id;
  const times = pushAndPrune(joinTimestamps, guildId, now, RAID_WINDOW_MS);

  if (times.length >= RAID_THRESHOLD) {
    const last = lastRaidAlert.get(guildId) || 0;
    if (now - last > RAID_ALERT_COOLDOWN_MS) {
      lastRaidAlert.set(guildId, now);
      await sendLog(member.guild, {
        title: '🛑 Raid potentiel détecté',
        color: 0xED4245,
        description: `${times.length} arrivées de membres en moins de ${RAID_WINDOW_MS / 1000}s.`,
        fields: [
          { name: 'Dernier membre arrivé', value: `${member.user.tag} (${member.id})` }
        ]
      });
    }
  }
}

module.exports = { handleMessageSpam, handleRaidDetection };
