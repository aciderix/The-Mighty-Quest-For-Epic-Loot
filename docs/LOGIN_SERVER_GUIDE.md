# 🔐 Guide Login & Serveur - The Mighty Quest For Epic Loot

## 📋 Résumé du Flow d'Authentification

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MightyQuest   │     │    Launcher      │     │   Serveur API   │
│      .exe       │────▶│  (CEF/Chromium)  │────▶│  *.hqs endpoints│
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │ steam_api.dll         │ Cookies:               │
        │ SteamUtils()          │ - t (game token)       │
        │                       │ - hyperquest_session   │
        │                       │ - email                │
        └───────────────────────┴────────────────────────┘
```

### Le Flow Normal (quand les serveurs existaient)
1. **Lancement** : `MightyQuest.exe` charge `steam_api.dll`
2. **Auth Steam** : Récupère le Steam Ticket via `ISteamUser::GetAuthSessionTicket()`
3. **Launcher CEF** : Affiche la page de login Ubisoft dans Chromium intégré
4. **Login** : Ubisoft valide le Steam Ticket → retourne des cookies
5. **Game Token** : Le cookie `t` contient le token de session
6. **API Calls** : Toutes les requêtes utilisent ce token

### Le Flow Offline (ce qu'on veut)
1. **Remplacer** `steam_api.dll` par Platformwrapper (émulateur Steam)
2. **Intercepter** les requêtes réseau avec Localnetworking
3. **Rediriger** vers notre serveur local qui renvoie des réponses valides
4. **Pas de login requis** - on simule un compte déjà connecté

---

## 🖥️ Option 1: Serveur Node.js (Moderne & Simple)

### Installation
```bash
mkdir mqel-server && cd mqel-server
npm init -y
npm install express cors
```

### server.js - Serveur complet
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Données du joueur (à sauvegarder en DB plus tard)
const playerData = {
    accountId: 3123971,
    displayName: "ResurrectedPlayer",
    selectedHeroId: 1,
    heroes: [],
    wallet: {
        InGameCoin: 10000,
        LifeForce: 5000,
        InGameCoinStorageCapacity: 100000,
        LifeForceStorageCapacity: 50000
    }
};

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT INFORMATION SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/AccountInformationService.hqs/GetAccountInformation', (req, res) => {
    console.log('📋 GetAccountInformation called');
    
    const response = {
        Result: {
            AccountId: playerData.accountId,
            DisplayName: playerData.displayName,
            CountryCode: "FR",
            Privileges: 401,
            SelectedHeroId: playerData.selectedHeroId,
            GamerScore: 15,
            AvatarId: 10,
            LeagueId: 1,
            SubLeagueId: 1,
            ProfanityFiltering: true,
            TargetedAttackAvailableCount: 5,
            
            Wallet: playerData.wallet,
            
            BuildInfo: {
                Level: 1,
                Draft: {
                    AccountId: playerData.accountId,
                    AccountDisplayName: playerData.displayName,
                    LayoutId: 1,
                    CreationDate: new Date().toISOString(),
                    ModificationDate: new Date().toISOString(),
                    ThemeId: 22,
                    Rooms: [
                        { X: 4, Y: 3, Id: 1, SpecContainerId: 21 },
                        {
                            Buildings: [
                                { Rank: 1, RoomZoneId: 12, X: 3, Y: 3, Orientation: 2, Id: 1, SpecContainerId: 1 },
                                { Rank: 1, RoomZoneId: 11, Id: 2, SpecContainerId: 3 },
                                { Rank: 1, RoomZoneId: 13, Id: 3, SpecContainerId: 4 }
                            ],
                            X: 3, Y: 3, Id: 3, SpecContainerId: 25
                        }
                    ]
                },
                InventoryThemes: [1, 22],
                RoomNextIndex: 4,
                CreatureNextIndex: 33,
                TrapNextIndex: 4,
                CastleStats: {
                    TotalConstructionPoints: 55,
                    MaxConstructionPoints: 55,
                    WinRatio: 0.5,
                    WinRatioDifficulty: 2
                },
                CastleHeartRank: 1
            },
            
            Heroes: playerData.heroes,
            
            Inventory: { InventoryTabCount: 2 },
            BuyBack: {},
            Stats: {},
            UnlockedEmotes: [1, 2, 3],
            CompletedAssignments: [],
            Objectives: [],
            News: {},
            DefendLog: { OfflinePeriod: { EndDateTime: new Date().toISOString() } },
            
            ClientSettings: {
                XmppInfo: {
                    Username: String(playerData.accountId),
                    Password: "offline_mode",
                    Domain: "mqel-offline",
                    Server: "localhost",
                    Port: 5222,
                    Enabled: false,
                    ConferenceServer: "conference.mqel-offline"
                },
                PrimaryShopUrl: "http://localhost:8080/shop",
                ShowWelcomePage: false
            },
            
            ShopSkuModifiers: []
        }
    };
    
    res.json(response);
});

// ═══════════════════════════════════════════════════════════════════
// ACCOUNT SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/AccountService.hqs/ChooseDisplayName', (req, res) => {
    const { displayName } = req.body;
    console.log(`👤 Display name changed to: ${displayName}`);
    playerData.displayName = displayName;
    res.json({ Result: {} });
});

// ═══════════════════════════════════════════════════════════════════
// HERO SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/HeroService.hqs/CreateHero', (req, res) => {
    const { heroClass } = req.body;
    console.log(`🦸 Creating hero class: ${heroClass}`);
    
    const heroId = playerData.heroes.length + 1;
    const newHero = {
        Id: heroId,
        HeroClass: heroClass,
        Level: 1,
        Experience: 0,
        DisplayName: `Hero_${heroId}`,
        Specializations: [],
        Abilities: getDefaultAbilities(heroClass),
        Equipment: {},
        Stats: getDefaultStats(heroClass)
    };
    
    playerData.heroes.push(newHero);
    playerData.selectedHeroId = heroId;
    
    res.json({ Result: newHero });
});

app.post('/HeroService.hqs/SelectHero', (req, res) => {
    const { heroId } = req.body;
    console.log(`🎯 Selected hero: ${heroId}`);
    playerData.selectedHeroId = heroId;
    res.json({ Result: {} });
});

function getDefaultAbilities(heroClass) {
    const abilities = {
        1: [1001, 1002, 1003], // Archer
        2: [2001, 2002, 2003], // Knight
        3: [3001, 3002, 3003], // Mage
        4: [4001, 4002, 4003]  // Runaway
    };
    return abilities[heroClass] || [];
}

function getDefaultStats(heroClass) {
    return {
        Health: 100,
        Attack: 10,
        Defense: 5,
        Speed: 10
    };
}

// ═══════════════════════════════════════════════════════════════════
// ATTACK SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/AttackService.hqs/StartAttack', (req, res) => {
    const { targetAccountId } = req.body;
    console.log(`⚔️ Starting attack on: ${targetAccountId}`);
    
    res.json({
        Result: {
            AttackId: Date.now(),
            TargetAccountId: targetAccountId,
            StartTime: new Date().toISOString()
        }
    });
});

app.post('/AttackService.hqs/EndAttack', (req, res) => {
    const { attackId, result, loot } = req.body;
    console.log(`🏆 Attack ${attackId} ended with result: ${result}`);
    
    // Ajouter le loot au wallet
    if (loot) {
        playerData.wallet.InGameCoin += loot.igc || 0;
        playerData.wallet.LifeForce += loot.lifeForce || 0;
    }
    
    res.json({
        Result: {
            Rewards: {
                InGameCoin: loot?.igc || 100,
                LifeForce: loot?.lifeForce || 50,
                Experience: 25
            }
        }
    });
});

app.post('/AttackService.hqs/Resurrect', (req, res) => {
    console.log('💀 Hero resurrected');
    res.json({ Result: {} });
});

app.post('/AttackService.hqs/RateCastle', (req, res) => {
    const { rating } = req.body;
    console.log(`⭐ Castle rated: ${rating}`);
    res.json({ Result: {} });
});

// ═══════════════════════════════════════════════════════════════════
// ATTACK SELECTION SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/AttackSelectionService.hqs/GetOpponents', (req, res) => {
    console.log('🎲 Getting opponents...');
    
    // Générer des châteaux PNJ
    const opponents = generateNPCCastles(5);
    
    res.json({ Result: { Opponents: opponents } });
});

function generateNPCCastles(count) {
    const castles = [];
    for (let i = 0; i < count; i++) {
        castles.push({
            AccountId: 1000000 + i,
            DisplayName: `NPC_Castle_${i}`,
            CastleLevel: Math.floor(Math.random() * 5) + 1,
            Difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
            PotentialLoot: {
                InGameCoin: Math.floor(Math.random() * 500) + 100,
                LifeForce: Math.floor(Math.random() * 200) + 50
            }
        });
    }
    return castles;
}

// ═══════════════════════════════════════════════════════════════════
// CASTLE FOR SALE SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/CastleForSaleService.hqs/GetStarterCastles', (req, res) => {
    console.log('🏰 Getting starter castles...');
    
    res.json({
        Result: {
            Castles: [
                { Id: 1, Name: "Château du Débutant", Theme: 22, Price: 0 },
                { Id: 2, Name: "Forteresse de Pierre", Theme: 1, Price: 500 },
                { Id: 3, Name: "Tour Sombre", Theme: 2, Price: 1000 }
            ]
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// SEASONAL COMPETITION SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/SeasonalCompetitionService.hqs/GetCurrentSeason', (req, res) => {
    res.json({
        Result: {
            SeasonId: 1,
            SeasonName: "Resurrection Season",
            StartDate: new Date().toISOString(),
            EndDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            Rewards: []
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// SERVER COMMAND SERVICE
// ═══════════════════════════════════════════════════════════════════

app.post('/ServerCommandService.hqs/Ping', (req, res) => {
    res.json({ Result: { Pong: true, ServerTime: new Date().toISOString() } });
});

// ═══════════════════════════════════════════════════════════════════
// CATCH-ALL
// ═══════════════════════════════════════════════════════════════════

app.all('/*.hqs/*', (req, res) => {
    console.log(`⚠️ Unimplemented endpoint: ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    res.json({ Result: {} });
});

// ═══════════════════════════════════════════════════════════════════
// DÉMARRAGE
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     🏰 MQEL Resurrection Server - Running on port ${PORT}       ║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints disponibles:                                       ║
║  • /AccountInformationService.hqs/GetAccountInformation       ║
║  • /AccountService.hqs/ChooseDisplayName                      ║
║  • /HeroService.hqs/CreateHero                                ║
║  • /HeroService.hqs/SelectHero                                ║
║  • /AttackService.hqs/StartAttack                             ║
║  • /AttackService.hqs/EndAttack                               ║
║  • /AttackSelectionService.hqs/GetOpponents                   ║
║  • + catch-all pour les autres                                ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});
```

---

## 🔧 Option 2: Utiliser MQELOffline_cpp (Solution Originale)

### Dépendances à compiler
```bash
# 1. Cloner tous les repos
git clone https://github.com/Hedgehogscience/MQELOffline_cpp.git
git clone https://github.com/Convery/Platformwrapper_cpp.git
git clone https://github.com/AyriaPublic/Bootstrapmodule_cpp.git
git clone https://github.com/Hedgehogscience/Localnetworking_cpp.git

# 2. Compiler (Visual Studio 2017+ requis)
# Chaque projet a un .sln - compiler en Release x86
```

### Structure des fichiers
```
MightyQuest/
├── MightyQuest.exe              # Exécutable du jeu
├── steam_api.dll                # ← Remplacer par Platformwrapper
├── steam_appid.txt              # Contient: 239220
├── Localbootstrap.dll           # ← Bootstrapmodule
└── Plugins/
    ├── Developermodule.dll      # ← MQELOffline
    └── Developerplugin.dll      # ← Localnetworking
```

### steam_appid.txt
```
239220
```

---

## 🚀 Configuration du Client

### Méthode 1: Arguments de lancement
```bash
./MightyQuest.exe \
    -server_url http://localhost:8080 \
    -environmentName mqel-offline \
    -branchName mqel \
    -steamid 76561198000000000 \
    -steamticket "" \
    -token ""
```

### Méthode 2: Modifier Game.ini
Créer/modifier `Config/Synergy/Game.ini`:
```ini
[Network]
ServerUrl=http://localhost:8080
EnvironmentName=mqel-offline

[Steam]
SteamId=76561198000000000
SkipAuth=true

[Debug]
OfflineMode=true
```

### Méthode 3: Hook DNS (Localnetworking)
Redirige automatiquement les requêtes vers `*.themightyquest.com` vers localhost.

---

## 🧪 Test du Serveur

### Test avec curl
```bash
# Test GetAccountInformation
curl -X POST http://localhost:8080/AccountInformationService.hqs/GetAccountInformation \
    -H "Content-Type: application/json" \
    -d '{}'

# Test CreateHero
curl -X POST http://localhost:8080/HeroService.hqs/CreateHero \
    -H "Content-Type: application/json" \
    -d '{"heroClass": 2}'

# Test GetOpponents
curl -X POST http://localhost:8080/AttackSelectionService.hqs/GetOpponents \
    -H "Content-Type: application/json" \
    -d '{}'
```

---

## 📊 Schéma de la Base de Données (pour persistence)

### SQLite (simple)
```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY,
    display_name TEXT UNIQUE,
    country_code TEXT DEFAULT 'FR',
    avatar_id INTEGER DEFAULT 10,
    gamer_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
    account_id INTEGER PRIMARY KEY REFERENCES accounts(id),
    in_game_coin INTEGER DEFAULT 1000,
    life_force INTEGER DEFAULT 0,
    igc_capacity INTEGER DEFAULT 10000,
    lf_capacity INTEGER DEFAULT 5000
);

CREATE TABLE heroes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id),
    hero_class INTEGER NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    equipment TEXT DEFAULT '{}',
    skills TEXT DEFAULT '[]'
);

CREATE TABLE castles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id),
    layout TEXT NOT NULL,
    theme_id INTEGER DEFAULT 22,
    level INTEGER DEFAULT 1
);
```

---

## ✅ Checklist de Lancement

- [ ] **Serveur**
  - [ ] Node.js installé
  - [ ] `npm install` exécuté
  - [ ] Serveur lancé sur port 8080

- [ ] **Client**
  - [ ] MightyQuest.exe présent
  - [ ] steam_api.dll remplacé par Platformwrapper
  - [ ] steam_appid.txt créé avec `239220`
  - [ ] Plugins installés (si méthode MQELOffline)

- [ ] **Test**
  - [ ] curl vers `/AccountInformationService.hqs/GetAccountInformation` → 200 OK
  - [ ] Jeu se lance sans erreur
  - [ ] Menu principal accessible

---

## 🐛 Dépannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Connection refused" | Serveur pas lancé | `node server.js` |
| "Steam not running" | steam_api.dll original | Remplacer par Platformwrapper |
| "Invalid token" | Auth check | Désactiver dans code serveur |
| Crash au lancement | DLL manquantes | Vérifier tous les Plugins |
| Écran noir | CEF/UI problème | Vérifier libcef.dll présent |

---

*Généré le 9 février 2026 - Projet Resurrection MQFEL*
