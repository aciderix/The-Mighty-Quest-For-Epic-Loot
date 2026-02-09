# 🏰 Analyse Reverse Engineering - The Mighty Quest For Epic Loot

## 📦 Contenu de l'Archive

| Fichier | Type | Rôle |
|---------|------|------|
| `mightyquest-ui.exe` | PE32 GUI (142 KB) | **Launcher UI uniquement** (pas le jeu!) |
| `steam_api.dll` | PE32 DLL (107 KB) | Interface Steam authentique Valve |
| `launcher.js` | JavaScript | Logique de connexion/authentification |
| `*.tsc` | Scripts Opal Engine | Configuration boot/init du jeu |
| `*.json` | Config | Packages, localisations, checksums |
| `cef.pak` | Chromium | Ressources interface web (CEF) |

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
    // Ajoute le ticket Steam au formulaire de login
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
    // Bypass - générer un fake ticket
    var fakeTicket = btoa('fake_user_' + Date.now());
    this.submitFormWithSteamTicket(fakeTicket);
}
```

### ⚠️ Problème majeur
L'archive **ne contient pas** `MightyQuest.exe` (le vrai exécutable du jeu mentionné dans `installscript.vdf`). Seul le launcher UI est présent!

---

## 🌐 2. REMPLACEMENT DU SERVEUR PAR UNE DATABASE

### Architecture découverte

Le jeu utilise une architecture **client-serveur asynchrone**:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Launcher (CEF)  │────▶│ Serveur Ubisoft  │◀────│ MightyQuest.exe │
│ mightyquest-ui  │     │ (FERMÉ)          │     │ (NON FOURNI)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Tokens d'authentification identifiés (`launcher.js`):
```javascript
_buildUserInfoPayload: function() {
    return {
        LoginToken: gameToken,      // Cookie "t"
        SGToken: sessionID,         // Cookie "hyperquest_launcher_session"  
        UserEmail: userEmail        // Email du compte
    };
}
```

### Points d'entrée serveur (`Init_Game.tsc`):
```
NetworkInit        // Initialisation réseau
ServerSignIn       // Connexion au serveur
USE_PATCHING       // Système de mise à jour
```

### 🔧 Stratégie de remplacement

#### Phase 1: Identification des endpoints
Tu auras besoin du **vrai exécutable** `MightyQuest.exe` pour:
- Intercepter les appels réseau (Wireshark/Fiddler - si tu as une version qui tente de se connecter)
- Analyser les strings avec radare2 pour trouver les URLs
- Décompiler pour comprendre le protocole

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

-- Héros
CREATE TABLE heroes (
    id UUID PRIMARY KEY,
    player_id UUID REFERENCES players(id),
    class TEXT, -- knight, archer, mage, runaway
    level INT DEFAULT 1,
    experience BIGINT DEFAULT 0,
    stats JSONB
);

-- Châteaux/Donjons
CREATE TABLE castles (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES players(id),
    layout JSONB,  -- Configuration des pièces
    traps JSONB,   -- Pièges placés
    creatures JSONB -- Monstres
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

#### Phase 4: Modification client (hosts/proxy)

Option 1 - **Fichier hosts** (simple):
```
127.0.0.1 mightygame.ubi.com
127.0.0.1 hyperquest.ubi.com
```

Option 2 - **Patch binaire** (avancé):
Modifier les URLs dans `MightyQuest.exe` avec un éditeur hex

Option 3 - **Proxy transparent**:
```javascript
// Cloudflare Worker exemple
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/auth/login') {
      // Rediriger vers Google OAuth
      return handleGoogleAuth(request);
    }
    
    if (url.pathname === '/api/game/sync') {
      // Sync avec Supabase
      return handleGameSync(request);
    }
  }
}
```

---

## 🔴 FICHIERS MANQUANTS CRITIQUES

Pour un reverse engineering complet, tu as besoin de:

| Fichier | Localisation habituelle | Utilité |
|---------|------------------------|---------|
| `MightyQuest.exe` | `Game/` | Exécutable principal avec logique réseau |
| `libcef.dll` | `Launcher/` | CEF pour le launcher |
| `PublicLauncher.exe` | `Launcher/` | Vrai launcher |
| `Config/Synergy/Game.ini` | `Config/` | URLs serveur, config réseau |
| `*.bf` (Bigfiles) | `Bigfiles/` | Assets et données du jeu |

---

## 📋 Fichiers les plus importants pour tes objectifs

### Pour bypass Steam:
1. **`steam_api.dll`** ⭐⭐⭐ - Remplacer par émulateur
2. **`launcher.js`** ⭐⭐ - Modifier la logique d'auth

### Pour serveur custom:
1. **`MightyQuest.exe`** ⭐⭐⭐⭐⭐ - **MANQUANT** - Indispensable!
2. **`Init_Game.tsc`** ⭐⭐ - Montre le flow de connexion
3. **`launcher.js`** ⭐⭐ - Structure des tokens
4. **`Game.ini`** ⭐⭐⭐ - **MANQUANT** - URLs serveur

---

## 🎯 Prochaines étapes recommandées

1. **Récupérer les fichiers manquants** du jeu complet (notamment `MightyQuest.exe`)
2. **Installer Goldberg Steam Emulator** pour bypass Steam
3. **Capturer le trafic réseau** si possible pour identifier les endpoints
4. **Analyser `MightyQuest.exe`** avec radare2/Ghidra pour:
   - Trouver les URLs hardcodées
   - Comprendre le protocole de communication
   - Identifier les fonctions de serialization des données

---

*Analyse réalisée le 9 février 2026*
