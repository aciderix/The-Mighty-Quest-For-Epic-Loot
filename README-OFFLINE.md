# 🏰 The Mighty Quest For Epic Loot - Offline Server

[![Version](https://img.shields.io/badge/version-0.36.1.34--offline-gold)](https://github.com/aciderix/The-Mighty-Quest-For-Epic-Loot)
[![Supabase](https://img.shields.io/badge/backend-Supabase-green)](https://supabase.com)
[![License](https://img.shields.io/badge/license-Educational-blue)](LICENSE)

> Faites revivre MQEL en mode hors-ligne avec votre propre serveur !

## 📦 Contenu du projet

```
📁 The-Mighty-Quest-For-Epic-Loot/
├── 📁 server/                    # Serveur Node.js
│   ├── server-v2.js              # Serveur principal (Supabase)
│   └── package.json
├── 📁 game_mods/                 # Fichiers modifi\u00e9s pour offline
│   ├── launcher-offline.js       # Launcher JS modifi\u00e9
│   ├── offline-login.html        # Page de login
│   ├── custombf.tsc             # Config bigfile
│   ├── user.tsc                 # Script utilisateur
│   ├── NetworkConfig.ini        # Config r\u00e9seau
│   ├── Game.ini                 # Config jeu
│   └── hosts_additions.txt      # Entr\u00e9es hosts
├── 📁 scripts/                   # Scripts de lancement
│   ├── QUICK-START.bat          # Lanceur rapide
│   ├── 1-install-dependencies.bat
│   ├── 2-start-server.bat
│   └── 3-launch-game.bat
└── 📁 sql/                       # Sch\u00e9ma base de donn\u00e9es
```

## 🚀 Installation rapide

### Pr\u00e9requis
- **Windows 10/11**
- **Node.js 18+** ([t\u00e9l\u00e9charger](https://nodejs.org/))
- **Les fichiers du jeu** (MightyQuest.exe + data)

### \u00c9tape 1: Obtenir les fichiers du jeu

```bash
# Via Steam (si install\u00e9)
steam://install/239220
```

### \u00c9tape 2: Configuration

```bash
git clone https://github.com/aciderix/The-Mighty-Quest-For-Epic-Loot.git
cd The-Mighty-Quest-For-Epic-Loot/server
npm install
```

### \u00c9tape 3: Lancement

**Option rapide:** Double-cliquez sur `scripts/QUICK-START.bat`

**Manuel:**
```bash
cd server
node server-v2.js
```

## 🔧 Configuration

### Fichier hosts (optionnel)

Ajoutez \u00e0 `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 mightyquest-lnch.ubi.com
127.0.0.1 mightyquest-gc.ubi.com
127.0.0.1 mightyquest-wss.ubi.com
```

### Fichiers de jeu

Copiez de `game_mods/` vers votre installation:
- `custombf.tsc` \u2192 `Game\Data\Scripts\`
- `user.tsc` \u2192 `Game\Data\Scripts\`
- `Game.ini` \u2192 `Game\Config\Synergy\`

## 🗄\ufe0f Base de donn\u00e9es Supabase

| Table | Description |
|-------|-------------|
| `accounts` | Comptes joueurs |
| `wallets` | Or, blings, gemmes |
| `heroes` | H\u00e9ros |
| `items` | Inventaire |
| `castles` | Ch\u00e2teaux |
| `castle_rooms` | Salles |
| `castle_creatures` | Monstres |
| `castle_traps` | Pi\u00e8ges |
| `player_stats` | Statistiques |
| `attacks` | Historique PvP |

## 📡 API Endpoints

```
POST /api/auth/register    - Cr\u00e9er un compte
POST /api/auth/login       - Se connecter
POST /auth/google          - Auth Google
GET  /api/health           - Status serveur
```

## \u26a0\ufe0f Avertissement

Ce projet est \u00e0 but **\u00e9ducatif uniquement**. MQEL est une propri\u00e9t\u00e9 d'Ubisoft.

---

**Fait avec \u2764\ufe0f pour pr\u00e9server MQEL** - *"For Epic Loot!"* 🏆