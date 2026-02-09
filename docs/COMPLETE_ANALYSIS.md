# 🏰 The Mighty Quest For Epic Loot - Rapport d'Analyse Complet

*Analyse réalisée le 9 février 2026 avec radare2 v6.0.7*

---

## 📋 Résumé Exécutif

**The Mighty Quest For Epic Loot** (MQEL) était un jeu F2P d'Ubisoft sorti en 2015 et fermé en 2016. C'est un hack-and-slash mélangé avec de la défense de donjon où les joueurs construisent leur château avec des pièges et des monstres, puis envahissent les châteaux d'autres joueurs.

### État actuel du projet de résurrection :
- ✅ **Exécutable du jeu** : `MightyQuest.exe` (8.2 MB) - Disponible
- ✅ **Documentation RE** : Analyse complète des endpoints API
- ✅ **Serveur offline existant** : [MQELOffline_cpp](https://github.com/Hedgehogscience/MQELOffline_cpp)
- ⚠️ **Fichier Game.ini** : À localiser (URLs serveur originales)
- ❌ **Serveur multijoueur** : À implémenter

---

## 🔬 Analyse Technique de MightyQuest.exe

### Informations binaire
```
Fichier: MightyQuest.exe
Type: PE32 GUI Executable
Taille: 8,158,440 bytes (8.2 MB)
CRC: 1315419961
Version: 0.36.1.34.0
PDB Path: D:\HQ\AG_BA073_01\hyperquest\Branches\Update3\Hyperquest\Startup\_Lib\HW_PC_MASTER\Startup\MightyQuest_original.pdb
Signataire: UBISOFT ENTERTAINMENT INC.
```

### Imports réseau clés (radare2)
| DLL | Fonction | Usage |
|-----|----------|-------|
| `WINHTTP.dll` | WinHttpCloseHandle | Requêtes HTTP REST |
| `WS2_32.dll` | getnameinfo | Sockets TCP/UDP |
| `steam_api.dll` | SteamUtils | Authentification Steam |
| `libcef.dll` | cef_string_utf16_to_utf8 | Chromium Embedded (UI) |

### Moteur de jeu : Opal Engine ("Hyperquest")
```
Composants identifiés dans Boot.tsc:
1  - General Engine Message
2  - Lib Curl (HTTP client)
3  - Storm (Network framework)
4  - HTTP Proxy
5  - Network Manager
6  - Bloomberg
7  - JSON Parser
8  - CEF (Chromium Embedded)
9  - Argo (Protocol?)
10 - CHAT
11 - BUILD
12 - GAMEPLAY
13 - SCRIPT
```

---

## 🌐 Architecture API REST

### Format des endpoints
```
POST /ServiceName.hqs/MethodName
Content-Type: application/json
```

### Services découverts et implémentés dans MQELOffline_cpp

| Service | Endpoint | Description | État |
|---------|----------|-------------|------|
| **AccountInformationService** | `/AccountInformationService.hqs/GetAccountInformation` | Info compte, wallet, héros, château | ✅ Implémenté |
| **AccountService** | `/AccountService.hqs/ChooseDisplayName` | Choix du pseudo | ✅ Implémenté |
| **HeroService** | `/HeroService.hqs/*` | Création/gestion des héros | ✅ Implémenté |
| **AttackService** | `/AttackService.hqs/StartAttack` | Démarrer une attaque | ✅ Implémenté |
| | `/AttackService.hqs/EndAttack` | Fin d'attaque avec récompenses | ✅ Implémenté |
| | `/AttackService.hqs/RateCastle` | Noter un château | ✅ Implémenté |
| | `/AttackService.hqs/Resurrect` | Résurrection du héros | ✅ Implémenté |
| **AttackSelectionService** | `/AttackSelectionService.hqs/*` | Sélection de cibles | ✅ Implémenté |
| **CastleForSaleService** | `/CastleForSaleService.hqs/*` | Châteaux à vendre | ✅ Implémenté |
| **SeasonalCompetitionService** | `/SeasonalCompetitionService.hqs/*` | Saisons/compétitions | ✅ Implémenté |
| **ServerCommandService** | `/ServerCommandService.hqs/*` | Commandes serveur | ✅ Implémenté |

### Exemple de réponse API (GetAccountInformation)
```json
{
  "Result": {
    "AccountId": 3123971,
    "DisplayName": "PlayerName",
    "CountryCode": "FR",
    "Privileges": 401,
    "SelectedHeroId": 1,
    "GamerScore": 15,
    "AvatarId": 10,
    "LeagueId": 1,
    "SubLeagueId": 1,
    "Wallet": {
      "InGameCoin": 1000,
      "LifeForce": 500,
      "InGameCoinStorageCapacity": 10000,
      "LifeForceStorageCapacity": 5000
    },
    "BuildInfo": {
      "Level": 1,
      "Draft": { /* Castle layout data */ },
      "CastleStats": {
        "TotalConstructionPoints": 55,
        "MaxConstructionPoints": 55,
        "WinRatio": 0.5
      }
    },
    "Heroes": [],
    "Inventory": { "InventoryTabCount": 2 },
    "ClientSettings": {
      "XmppInfo": {
        "Server": "chat.themightyquest.com",
        "Port": 80,
        "Domain": "mqel-live"
      },
      "PrimaryShopUrl": "https://www.themightyquest.com/%s/shop?..."
    }
  }
}
```

---

## 🔐 Authentification

### Flow Steam original
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Launcher (CEF)  │────▶│ steam_api.dll    │────▶│ Serveur Ubisoft │
│ mightyquest-ui  │     │ Steam Ticket     │     │ (FERMÉ)         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Tokens d'authentification (launcher.js)
```javascript
_buildUserInfoPayload: function() {
    return {
        LoginToken: this._getRemoteCookie("t"),           // Game token
        SGToken: this._getRemoteCookie("hyperquest_launcher_session"), // Session
        UserEmail: this._getRemoteCookie("email")
    };
}
```

### Solution de contournement Steam
**Goldberg Steam Emulator** + **Platformwrapper_cpp**
```bash
# Remplacer steam_api.dll par Platformwrapper
git clone https://github.com/Convery/Platformwrapper_cpp.git
# Créer steam_appid.txt avec: 239220
```

---

## 🚀 Guide de Lancement

### Arguments de ligne de commande
```bash
./MightyQuest.exe \
  -server_url https://YOUR_SERVER_URL \
  -environmentName mqel-live \
  -branchName mqel \
  -steamid 76561201696194782 \
  -steamticket "" \
  -token ""
```

### Dépendances requises
```bash
# 1. Platformwrapper (Steam emulator)
git clone https://github.com/Convery/Platformwrapper_cpp.git
mklink Gamedir/steam_api.dll Platformwrapper/Bin/steam_api.dll

# 2. Bootstrapmodule (DLL injection)
git clone https://github.com/AyriaPublic/Bootstrapmodule_cpp.git
mklink Gamedir/Localbootstrap.dll Bootstrapmodule_cpp/Bin/Nativebootstrap32.dll

# 3. Localnetworking (Network hook)
git clone https://github.com/Hedgehogscience/Localnetworking_cpp.git
mklink Gamedir/Plugins/Developerplugin.dll Localnetworking_cpp/Bin/Localnetworking.ayria32

# 4. MQELOffline (Server implementation)
git clone https://github.com/Hedgehogscience/MQELOffline_cpp.git
mklink Gamedir/Plugins/Developermodule.dll MQELOffline_cpp/Bin/MQELOffline.LN32
```

---

## 📊 Contenu du jeu

### Classes de héros
| ID | Classe | Description |
|----|--------|-------------|
| 1 | Archer | Attaque à distance |
| 2 | Knight | Tank mêlée |
| 3 | Mage | Magie/AoE |
| 4 | Runaway | Assassin |

### Worlds
```
- attack: Mode PvP
- build: Construction de château
- home: Hub principal
- inventory: Gestion d'équipement
- competition: Événements saisonniers
- friendszone: Social
```

### Données extraites
| Fichier | Contenu |
|---------|---------|
| `PackagesTOC.json` (2.1 MB) | Table des contenus des packages |
| `DataBinCRC.json` (2.5 MB) | Checksums de tous les fichiers |
| `oasis_fr.json` (580 KB) | Localisation française |
| `oasis_customText.json` (1.6 MB) | Textes personnalisés |
| `*.tsc` | Scripts de configuration Opal Engine |

---

## 🗄️ Architecture Serveur Proposée

### Option 1: Mode Offline (MQELOffline_cpp)
- ✅ Fonctionne en local
- ✅ Pas de dépendances cloud
- ❌ Pas de multijoueur réel
- ❌ Projet vieux de 8 ans (2018)

### Option 2: Backend Moderne (Cloudflare + Supabase)
```
┌─────────────────┐     ┌──────────────────────────────────────┐
│ Client modifié  │────▶│ Cloudflare Workers (API Gateway)     │
└─────────────────┘     │ • Routes /ServiceName.hqs/*           │
                        │ • Auth validation                     │
                        │ • Rate limiting                       │
                        └──────────────────────────────────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        ▼                ▼                ▼
                 ┌──────────┐   ┌──────────────┐   ┌──────────┐
                 │ Supabase │   │   Supabase   │   │ Supabase │
                 │   Auth   │   │   Database   │   │  Storage │
                 └──────────┘   └──────────────┘   └──────────┘
```

### Schema SQL suggéré
```sql
-- Comptes joueurs
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(32) UNIQUE,
  country_code VARCHAR(2) DEFAULT 'FR',
  avatar_id INTEGER DEFAULT 10,
  gamer_score INTEGER DEFAULT 0,
  privileges INTEGER DEFAULT 401,
  league_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet
CREATE TABLE wallets (
  account_id UUID REFERENCES accounts(id) PRIMARY KEY,
  in_game_coin INTEGER DEFAULT 1000,
  life_force INTEGER DEFAULT 0,
  igc_capacity INTEGER DEFAULT 10000,
  lf_capacity INTEGER DEFAULT 5000
);

-- Héros
CREATE TABLE heroes (
  id SERIAL PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  hero_class INTEGER NOT NULL, -- 1=Archer, 2=Knight, 3=Mage, 4=Runaway
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  equipment JSONB DEFAULT '{}',
  skills JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}'
);

-- Châteaux
CREATE TABLE castles (
  id SERIAL PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  level INTEGER DEFAULT 1,
  layout JSONB NOT NULL,
  construction_points INTEGER DEFAULT 55,
  win_ratio DECIMAL DEFAULT 0.5,
  theme_id INTEGER DEFAULT 22
);

-- Historique combats
CREATE TABLE battle_log (
  id SERIAL PRIMARY KEY,
  attacker_id UUID REFERENCES accounts(id),
  defender_id UUID REFERENCES accounts(id),
  result VARCHAR(10),
  loot_igc INTEGER DEFAULT 0,
  replay_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Prochaines Étapes

### Phase 1: Mode Offline (Court terme)
- [ ] Compiler MQELOffline_cpp avec les dépendances
- [ ] Installer Goldberg/Platformwrapper Steam Emulator
- [ ] Configurer les liens symboliques
- [ ] Tester le lancement basique

### Phase 2: Serveur Moderne (Moyen terme)
- [ ] Créer projet Supabase
- [ ] Implémenter tables SQL
- [ ] Créer Cloudflare Worker pour l'API
- [ ] Porter les endpoints de MQELOffline en TypeScript

### Phase 3: Multijoueur (Long terme)
- [ ] Intégrer Supabase Auth (Google OAuth)
- [ ] Implémenter matchmaking asynchrone
- [ ] Système de validation des replays
- [ ] Chat XMPP ou alternative moderne

---

## 📚 Ressources

| Projet | URL | Description |
|--------|-----|-------------|
| MQELOffline_cpp | https://github.com/Hedgehogscience/MQELOffline_cpp | Serveur C++ existant |
| Platformwrapper_cpp | https://github.com/Convery/Platformwrapper_cpp | Steam emulator |
| Localnetworking_cpp | https://github.com/Hedgehogscience/Localnetworking_cpp | Network hook |
| Bootstrapmodule_cpp | https://github.com/AyriaPublic/Bootstrapmodule_cpp | DLL loader |
| Steam Install | steam://install/239220 | ID Steam du jeu |

---

## 🎮 Téléchargement du jeu

Le jeu peut encore être téléchargé via Steam :
```
steam://install/239220
```
Ouvrir ce lien dans un navigateur ou terminal pour lancer le téléchargement.

---

*Ce document sera mis à jour au fur et à mesure des découvertes.*
