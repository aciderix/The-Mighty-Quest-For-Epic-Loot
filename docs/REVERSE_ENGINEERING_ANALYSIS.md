# 🏰 Analyse Reverse Engineering - The Mighty Quest For Epic Loot

## 📦 Contenu de l'Archive

| Fichier | Type | Taille | Rôle |
|---------|------|--------|------|
| `MightyQuest.exe` | PE32 GUI | 8.2 MB | ✅ **EXÉCUTABLE PRINCIPAL DU JEU** |
| `mightyquest-ui.exe` | PE32 GUI | 142 KB | Launcher UI (CEF) |
| `steam_api.dll` | PE32 DLL | 107 KB | Interface Steam authentique Valve |
| `launcher.js` | JavaScript | 16 KB | Logique de connexion/authentification |
| `*.tsc` | Scripts Opal Engine | - | Configuration boot/init du jeu |
| `*.json` | Config | - | Packages, localisations, checksums |

---

## 🔬 ANALYSE MightyQuest.exe (radare2)

### Imports réseau clés
```
WINHTTP.dll    → WinHttpCloseHandle (requêtes HTTP)
WS2_32.dll     → getnameinfo (sockets TCP/UDP)
steam_api.dll  → SteamUtils
libcef.dll     → cef_string_utf16_to_utf8 (Chromium)
```

### Chemin PDB trouvé
```
D:\HQ\AG_BA073_01\hyperquest\Branches\Update3\Hyperquest\Startup\_Lib\HW_PC_MASTER\Startup\MightyQuest_original.pdb
```
→ Le moteur s'appelle **"Hyperquest"** en interne!

### Certificat de signature
```
UBISOFT ENTERTAINMENT INC.
```

---

## 🎮 1. LANCEMENT SANS STEAM

### Constat
Le jeu utilise **Steam** pour l'authentification via `steam_api.dll`. Le launcher (`launcher.js`) récupère un **Steam Ticket** pour l'envoyer au serveur d'authentification.

### Code clé trouvé dans `launcher.js`:
```javascript
_updateSteamTicket: function() {
    var callback_function = 'submitFormWithSteamTicket';
    _launcher._updateSteamToken(callback_function);
},

submitFormWithSteamTicket: function(steamTicket) {
    form.append('<input type="hidden" name="steam_ticket" value="' + steamTicket + '">');
}
```

### ✅ Solution: Steam Emulator

**Option A - Goldberg Steam Emulator** (recommandé)
1. Télécharger [Goldberg Emulator](https://gitlab.com/Mr_Goldberg/goldberg_emulator)
2. Remplacer `steam_api.dll` par celle de Goldberg
3. Créer `steam_appid.txt` avec l'ID du jeu: `239220`
4. Configurer `steam_settings/` avec un SteamID64 fictif

**Option B - Modifier le launcher.js**
```javascript
// Remplacer _updateSteamTicket par:
_updateSteamTicket: function() {
    var fakeTicket = btoa('fake_user_' + Date.now());
    this.submitFormWithSteamTicket(fakeTicket);
}
```

---

## 🌐 2. REMPLACEMENT DU SERVEUR PAR UNE DATABASE

### Architecture découverte

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Launcher (CEF)  │────▶│ Serveur Ubisoft  │◀────│ MightyQuest.exe │
│ mightyquest-ui  │     │ (FERMÉ)          │     │ (8.2 MB)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Fichier de configuration réseau (CRITIQUE!)

Dans `Init_Game.tsc`:
```
ReadGameConfigFile ..\Config\Synergy\Game.ini
NetworkInit
ServerSignIn
```

⚠️ **Le fichier `Game.ini` contient les URLs du serveur!**

### Tokens d'authentification identifiés (`launcher.js`):
```javascript
_buildUserInfoPayload: function() {
    return {
        LoginToken: this._getRemoteCookie("t"),
        SGToken: this._getRemoteCookie("hyperquest_launcher_session"),
        UserEmail: this._getRemoteCookie("email")
    };
}
```

### Composants du moteur Opal Engine (`Boot.tsc`):
```
1  General Engine Message
2  Lib Curl         ← HTTP client
3  Storm            ← Network framework?
4  HTTP Proxy
5  Network Manager  ← Gestionnaire réseau
6  Bloomberg
7  JSON Parser
8  CEF              ← Chromium Embedded
9  Argo             ← Protocol?
10 CHAT
11 BUILD
12 GAMEPLAY
13 SCRIPT
```

### 🔧 Stratégie de remplacement

#### Phase 1: Trouver les URLs serveur

**Option A - Fichier Game.ini**
Chercher dans `%INSTALLDIR%\Config\Synergy\Game.ini`

**Option B - Interception réseau**
```bash
# Avec Wireshark/Fiddler si le jeu tente de se connecter
```

**Option C - Analyse strings plus poussée**
```bash
# Chercher URLs dans l'exe
strings MightyQuest.exe | grep -iE "https?://"
```

#### Phase 2: Architecture serveur custom

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│ Client modifié  │────▶│ Serveur Custom                       │
└─────────────────┘     │ ┌──────────────────────────────────┐ │
                        │ │ Cloudflare Workers (API REST)    │ │
                        │ │ - Auth (Google OAuth)            │ │
                        │ │ - Game state sync                │ │
                        │ └──────────────────────────────────┘ │
                        │ ┌──────────────────────────────────┐ │
                        │ │ Supabase                         │ │
                        │ │ - Users / Auth                   │ │
                        │ │ - Player data                    │ │
                        │ │ - Castles / Dungeons             │ │
                        │ │ - Inventory / Items              │ │
                        │ └──────────────────────────────────┘ │
                        └──────────────────────────────────────┘
```

#### Phase 3: Schema Supabase suggéré
```sql
-- Joueurs
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id TEXT UNIQUE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Héros (Knight, Archer, Mage, Runaway)
CREATE TABLE heroes (
    id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    class TEXT CHECK (class IN ('knight', 'archer', 'mage', 'runaway')),
    level INT DEFAULT 1,
    experience BIGINT DEFAULT 0,
    stats JSONB
);

-- Châteaux/Donjons
CREATE TABLE castles (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES players(id),
    layout JSONB,
    traps JSONB,
    creatures JSONB
);

-- Inventaire
CREATE TABLE inventory (
    id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    item_type TEXT,
    item_data JSONB,
    quantity INT DEFAULT 1
);
```

#### Phase 4: Modification client

**Option 1 - Fichier hosts** (simple):
```
127.0.0.1 mightygame.ubi.com
127.0.0.1 hyperquest.ubi.com
```

**Option 2 - Patch binaire** (avancé):
Modifier les URLs dans `MightyQuest.exe` avec un éditeur hex

**Option 3 - Proxy local + Game.ini modifié**

---

## 📋 Fichiers clés pour tes objectifs

### Pour bypass Steam:
| Fichier | Priorité | Action |
|---------|----------|--------|
| `steam_api.dll` | ⭐⭐⭐⭐⭐ | Remplacer par Goldberg |
| `launcher.js` | ⭐⭐⭐ | Modifier `_updateSteamTicket()` |

### Pour serveur custom:
| Fichier | Priorité | Contenu |
|---------|----------|--------|
| `MightyQuest.exe` | ⭐⭐⭐⭐⭐ | ✅ Analysé - uses WINHTTP/WS2_32 |
| `Config\Synergy\Game.ini` | ⭐⭐⭐⭐⭐ | 🔍 À trouver - URLs serveur! |
| `Init_Game.tsc` | ⭐⭐⭐ | NetworkInit / ServerSignIn flow |
| `launcher.js` | ⭐⭐⭐ | Tokens: LoginToken, SGToken, Email |
| `Boot.tsc` | ⭐⭐ | Architecture Opal Engine |

---

## 🎯 Prochaines étapes recommandées

1. ✅ ~~Récupérer MightyQuest.exe~~ FAIT!
2. 🔍 **Trouver le fichier `Config\Synergy\Game.ini`** avec les URLs serveur
3. 🔧 **Installer Goldberg Steam Emulator** pour bypass Steam
4. 📡 **Capturer le trafic réseau** avec Fiddler/Wireshark
5. 🏗️ **Créer le serveur Cloudflare Workers + Supabase**

---

## 📊 Informations de version

```
Version: 0.36.1.34.0
MightyQuest.exe CRC: 1315419961
MightyQuest.exe Size: 8,158,440 bytes

Worlds: 6 (attack, build, home, inventory, etc.)
Themes: 30 packages
Heroes: Knight, Archer, Mage, Runaway
Regions: 7 + Competition + FriendsZone
```

---

*Analyse réalisée le 9 février 2026 avec radare2*
