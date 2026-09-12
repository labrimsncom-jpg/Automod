# Bot Discord de modération

Bot avec anti-spam, anti-raid, logs de modération et casier de warns.

## Fonctionnalités

- **Anti-spam automatique** (sans commande, ça tourne tout seul) :
  - Flood de messages → avertissement dans le salon
  - Spam de mentions/ping → message supprimé + averti + log
  - Spam de liens → message supprimé + averti + log
- **Anti-raid** : si trop de membres rejoignent en peu de temps, une alerte part dans le salon de logs.
- **Logs de modération** : chaque ban, unban, kick, warn et unwarn est envoyé dans un salon dédié.
- **Casier** : consulte tous les avertissements donnés sur le serveur ou pour un membre précis.

## Commandes slash

| Commande | Description | Permission requise |
|---|---|---|
| `/ban utilisateur raison` | Bannir un membre | Bannir les membres |
| `/unban id raison` | Débannir via son ID Discord | Bannir les membres |
| `/expulser utilisateur raison` | Expulser (kick) un membre | Expulser les membres |
| `/avertir utilisateur raison` | Donner un avertissement | Modérer les membres |
| `/unwarn utilisateur numero` | Retirer un avertissement (0 = tout effacer) | Modérer les membres |
| `/casier utilisateur cible` | Voir le casier d'un membre | Modérer les membres |
| `/casier tout` | Voir tous les warns du serveur | Modérer les membres |
| `/setup-logs salon` | Définir le salon de logs | Administrateur |

## Installation

1. **Créer l'application Discord**
   - Va sur https://discord.com/developers/applications
   - Crée une application, puis un Bot
   - Active l'intent **"Message Content Intent"** et **"Server Members Intent"** dans l'onglet Bot
   - Copie le **Token** et le **Client ID**

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   - Renomme `.env.example` en `.env`
   - Remplis `DISCORD_TOKEN`, `CLIENT_ID`, et optionnellement `GUILD_ID` (pour tester sur un seul serveur, plus rapide)

4. **Inviter le bot sur ton serveur**
   Remplace `CLIENT_ID` dans l'URL suivante et ouvre-la dans un navigateur :
   ```
   https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=1099780064470&scope=bot%20applications.commands
   ```

5. **Déployer les commandes slash**
   ```bash
   npm run deploy
   ```

6. **Lancer le bot**
   ```bash
   npm start
   ```

7. **Configurer le salon de logs**
   Une fois le bot en ligne, tape `/setup-logs salon:#tes-logs` sur ton serveur.

## Réglages de l'anti-spam / anti-raid

Les seuils sont modifiables en haut du fichier `utils/antiSpam.js` :

```js
const FLOOD_WINDOW_MS = 5000;      // fenêtre de temps
const FLOOD_MAX_MESSAGES = 5;      // nb de messages max avant avertissement
const PING_SPAM_THRESHOLD = 5;     // nb de mentions dans UN message
const LINK_SPAM_WINDOW_MS = 8000;  // fenêtre pour le spam de liens
const LINK_SPAM_MAX = 3;           // nb de liens max dans la fenêtre

const RAID_WINDOW_MS = 10000;      // fenêtre pour détecter un raid
const RAID_THRESHOLD = 6;          // nb d'arrivées déclenchant l'alerte
```

## Données stockées

Les avertissements et la config de chaque serveur sont stockés dans de simples
fichiers JSON (`data/warns.json` et `data/config.json`), créés automatiquement
au premier lancement. Pas besoin de base de données externe.

## Hébergement

Ce bot doit tourner en continu (Node.js). Tu peux l'héberger sur :
- Ton propre PC/serveur (avec `pm2` pour le garder actif)
- Un VPS
- Des plateformes comme Railway, Render, ou autres hébergeurs Node.js
