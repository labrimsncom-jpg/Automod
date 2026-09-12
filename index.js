require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { handleMessageSpam, handleRaidDetection } = require('./utils/antiSpam');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel]
});

// ---------- Chargement des commandes ----------
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// ---------- Prêt ----------
client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

// ---------- Commandes slash ----------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const reply = { content: '❌ Une erreur est survenue en exécutant cette commande.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// ---------- Anti-spam (flood, ping spam, liens) ----------
client.on('messageCreate', async (message) => {
  try {
    await handleMessageSpam(message);
  } catch (err) {
    console.error('Erreur anti-spam :', err);
  }
});

// ---------- Anti-raid ----------
client.on('guildMemberAdd', async (member) => {
  try {
    await handleRaidDetection(member);
  } catch (err) {
    console.error('Erreur anti-raid :', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
