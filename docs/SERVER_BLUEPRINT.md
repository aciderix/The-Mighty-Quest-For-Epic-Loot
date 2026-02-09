# 🏰 The Mighty Quest For Epic Loot - Server Blueprint

## 🎯 DÉCOUVERTE MAJEURE: Projet serveur existant!

Un projet de serveur offline existe déjà: **[MQELOffline_cpp](https://github.com/Hedgehogscience/MQELOffline_cpp)**

---

## 🚀 Comment lancer le jeu avec un serveur custom

### Arguments de lancement
```bash
./MightyQuest.exe \
  -server_url https://YOUR_SERVER_URL \
  -environmentName mqel-live \
  -branchName mqel \
  -steamid 76561201696194782 \
  -steamticket "" \
  -token ""
```

### Fichiers requis (Goldberg Steam Emulator)
1. **Remplacer `steam_api.dll`** par [Platformwrapper](https://github.com/Convery/Platformwrapper_cpp)
2. **Ajouter `Localbootstrap.dll`** via [Bootstrapmodule_cpp](https://github.com/AyriaPublic/Bootstrapmodule_cpp)
3. **Ajouter plugin réseau** via [Localnetworking_cpp](https://github.com/Hedgehogscience/Localnetworking_cpp)

---

## 📡 Architecture REST API

Le jeu communique via **JSON REST endpoints** au format:
```
POST /ServiceName.hqs/MethodName
Content-Type: application/json
```

### Endpoints découverts

| Service | Endpoint | Description |
|---------|----------|-------------|
| **AccountInformationService** | `/AccountInformationService.hqs/GetAccountInformation` | Info compte, wallet, héros, château |
| **AccountService** | `/AccountService.hqs/ChooseDisplayName` | Choix du pseudo |
| **HeroService** | `/HeroService.hqs/*` | Gestion des héros |
| **AttackService** | `/AttackService.hqs/*` | Attaques PvP |
| **AttackSelectionService** | `/AttackSelectionService.hqs/*` | Sélection cibles |
| **CastleForSaleService** | `/CastleForSaleService.hqs/*` | Châteaux à vendre |
| **SeasonalCompetitionService** | `/SeasonalCompetitionService.hqs/*` | Saisons/compétitions |
| **ServerCommandService** | `/ServerCommandService.hqs/*` | Commandes serveur |

---

## 💾 Structure de données (JSON)

### GetAccountInformation Response
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
      "Draft": { "/* Castle layout data */": "..." },
      "CastleStats": {
        "TotalConstructionPoints": 55,
        "MaxConstructionPoints": 55,
        "WinRatio": 0.5
      }
    },
    "Heroes": [],
    "Inventory": { "InventoryTabCount": 2 },
    "Stats": {},
    "CompletedAssignments": [10, 26, 21],
    "ClientSettings": {}
  }
}
```

### ClientSettings (URLs originales Ubisoft)
```json
{
  "XmppInfo": {
    "Username": "3123971",
    "Password": "AkiTXjIk+EqXzFWmFJGbug==",
    "Domain": "mqel-live",
    "Server": "chat.themightyquest.com",
    "Port": 80,
    "Enabled": true,
    "ConferenceServer": "conference.mqel-live"
  },
  "PrimaryShopUrl": "https://www.themightyquest.com/%s/shop?game_token=%s&steamID=%s&steamTicket=%s&embedded=1",
  "WelcomePageUrl": "https://www.themightyquest.com/%s/game_welcome_page?game_token=%s"
}
```

---

## 🗄️ Plan: Backend Supabase/Cloudflare

### Architecture recommandée

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (MightyQuest.exe)                 │
│                              │                              │
│                              ▼                              │
│     ┌─────────────────────────────────────────────────┐    │
│     │         Cloudflare Workers (API Gateway)         │    │
│     │  • Routes /ServiceName.hqs/* vers functions      │    │
│     │  • Auth validation (token/steamid)               │    │
│     │  • Rate limiting                                 │    │
│     └─────────────────────────────────────────────────┘    │
│                              │                              │
│          ┌───────────────────┼───────────────────┐         │
│          ▼                   ▼                   ▼         │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│   │   Supabase   │   │   Supabase   │   │   Supabase   │  │
│   │   Auth       │   │   Database   │   │   Storage    │  │
│   │              │   │              │   │              │  │
│   │ • Google     │   │ • accounts   │   │ • castles    │  │
│   │ • Email      │   │ • heroes     │   │   layouts    │  │
│   │ • Anonymous  │   │ • inventory  │   │ • replays    │  │
│   │              │   │ • castles    │   │              │  │
│   └──────────────┘   │ • wallet     │   └──────────────┘  │
│                      │ • stats      │                      │
│                      │ • quests     │                      │
│                      └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Tables Supabase (PostgreSQL)

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
  sub_league_id INTEGER DEFAULT 1,
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
  max_construction_points INTEGER DEFAULT 55,
  win_ratio DECIMAL DEFAULT 0.5,
  theme_id INTEGER DEFAULT 22
);

-- Historique combats
CREATE TABLE battle_log (
  id SERIAL PRIMARY KEY,
  attacker_id UUID REFERENCES accounts(id),
  defender_id UUID REFERENCES accounts(id),
  result VARCHAR(10), -- 'win', 'lose', 'abandon'
  loot_igc INTEGER DEFAULT 0,
  loot_lf INTEGER DEFAULT 0,
  replay_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cloudflare Worker Example

```typescript
// workers/src/index.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    
    // Route: /AccountInformationService.hqs/GetAccountInformation
    if (path === '/AccountInformationService.hqs/GetAccountInformation') {
      const body = await request.json()
      const accountId = body.accountId // ou depuis header auth
      
      const { data: account } = await supabase
        .from('accounts')
        .select(`
          *,
          wallet:wallets(*),
          heroes(*),
          castle:castles(*)
        `)
        .eq('id', accountId)
        .single()
      
      return new Response(JSON.stringify({
        Result: {
          AccountId: account.id,
          DisplayName: account.display_name,
          Wallet: {
            InGameCoin: account.wallet.in_game_coin,
            LifeForce: account.wallet.life_force,
          },
          Heroes: account.heroes,
          BuildInfo: {
            Level: account.castle.level,
            Draft: account.castle.layout,
          }
        }
      }))
    }
    
    return new Response('Not Found', { status: 404 })
  }
}
```

---

## 🔐 Authentification sans Steam

### Option 1: Bypass complet (offline)
```bash
./MightyQuest.exe -steamid 0 -steamticket "" -token "local_player"
```

### Option 2: Auth custom via Google (recommandé)
1. Le launcher redirige vers Google OAuth
2. Google retourne un token
3. Le token est passé au jeu via `-token`
4. Le serveur valide via Supabase Auth

```javascript
// Dans launcher.js modifié
launcherWeb.loginPageURL = 'https://YOUR_SERVER/auth/google';

// Après auth Google réussie
_launcher._onUserLoggedIn(JSON.stringify({
  LoginToken: googleIdToken,
  SGToken: supabaseSessionId,
  UserEmail: userEmail
}));
```

---

## ✅ Checklist d'implémentation

### Phase 1: Mode Offline (solo)
- [ ] Fork MQELOffline_cpp
- [ ] Compiler avec les dépendances
- [ ] Tester lancement basique

### Phase 2: Backend Supabase
- [ ] Créer projet Supabase
- [ ] Implémenter tables SQL
- [ ] Créer Cloudflare Worker API
- [ ] Implémenter endpoints principaux:
  - [ ] GetAccountInformation
  - [ ] ChooseDisplayName
  - [ ] CreateHero
  - [ ] GetCastlesToAttack
  - [ ] SubmitAttackResult

### Phase 3: Auth & Multijoueur
- [ ] Intégrer Supabase Auth (Google)
- [ ] Modifier launcher.js pour custom auth
- [ ] Implémenter matchmaking asynchrone
- [ ] Système de replay/validation

---

## 📚 Ressources

- [MQELOffline_cpp](https://github.com/Hedgehogscience/MQELOffline_cpp) - Serveur C++ existant
- [Platformwrapper_cpp](https://github.com/Convery/Platformwrapper_cpp) - Steam emulator
- [Localnetworking_cpp](https://github.com/Hedgehogscience/Localnetworking_cpp) - Network hook
- [Supabase Docs](https://supabase.com/docs) - Backend
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - API serverless

---

*Generated by reverse engineering analysis - February 2026*
