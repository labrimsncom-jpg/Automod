const fs = require('fs');
const path = require('path');

const WARNS_PATH = path.join(__dirname, '..', 'data', 'warns.json');
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');

function ensureFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

ensureFile(WARNS_PATH, {});
ensureFile(CONFIG_PATH, {});

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  // ---------- WARNS (le "casier") ----------
  getWarns(guildId, userId) {
    const warns = readJSON(WARNS_PATH);
    return warns[guildId]?.[userId] || [];
  },

  addWarn(guildId, userId, warn) {
    const warns = readJSON(WARNS_PATH);
    if (!warns[guildId]) warns[guildId] = {};
    if (!warns[guildId][userId]) warns[guildId][userId] = [];
    warns[guildId][userId].push(warn);
    writeJSON(WARNS_PATH, warns);
    return warns[guildId][userId];
  },

  getAllGuildWarns(guildId) {
    const warns = readJSON(WARNS_PATH);
    return warns[guildId] || {};
  },

  clearWarns(guildId, userId) {
    const warns = readJSON(WARNS_PATH);
    if (warns[guildId]) delete warns[guildId][userId];
    writeJSON(WARNS_PATH, warns);
  },

  // ---------- CONFIG PAR SERVEUR ----------
  getGuildConfig(guildId) {
    const config = readJSON(CONFIG_PATH);
    return config[guildId] || {};
  },

  setGuildConfig(guildId, updates) {
    const config = readJSON(CONFIG_PATH);
    config[guildId] = { ...(config[guildId] || {}), ...updates };
    writeJSON(CONFIG_PATH, config);
    return config[guildId];
  }
};
