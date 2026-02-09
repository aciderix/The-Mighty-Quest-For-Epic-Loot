# 📚 MQFEL - Référence Technique Complète

> Ce document contient TOUTES les informations nécessaires pour faire fonctionner le jeu avec un serveur custom.

---

## 🔐 1. Bypass Steam avec Goldberg Emulator

### Qu'est-ce que Goldberg Emulator ?
Un remplaçant open-source de `steam_api.dll` qui émule Steam en local, sans avoir besoin de Steam installé.

### Installation

1. **Télécharger Goldberg Emulator**
   - 🔗 https://gitlab.com/Mr_Goldberg/goldberg_emulator/-/releases
   - Ou fork maintenu : https://github.com/otavepto/gbe_fork/releases

2. **Fichiers à copier dans le dossier du jeu**
   ```
   📁 MightyQuest/
   ├── MightyQuest.exe
   ├── steam_api.dll          ← REMPLACER par celui de Goldberg
   └── 📁 steam_settings/      ← CRÉER ce dossier
       ├── steam_appid.txt
       ├── account_name.txt
       └── user_steam_id.txt
   ```

3. **Contenu des fichiers de config**

   **steam_settings/steam_appid.txt**
   ```
   239220
   ```

   **steam_settings/account_name.txt**
   ```
   MonNomDeJoueur
   ```

   **steam_settings/user_steam_id.txt**
   ```
   76561198012345678
   ```
   > Générer un Steam ID : n'importe quel nombre de 17 chiffres commençant par 7656119

### Alternative : Platformwrapper

Si Goldberg ne marche pas, utiliser **Platformwrapper** de Hedgehogscience :
- 🔗 https://github.com/AyriaPublic/Platformwrapper_cpp

---

## 🌐 2. Tous les Endpoints API

### Format général
- **URL** : `POST /ServiceName.hqs/MethodName`
- **Content-Type** : `application/json`
- **Réponse** : JSON avec `{ "Result": {...} }` ou `{ "Notifications": [...], "Result": {...} }`

### 2.1 AccountInformationService

#### `POST /AccountInformationService.hqs/GetAccountInformation`
**Description** : Endpoint principal appelé au login. Retourne TOUTES les infos du compte.

**Request Body** : `{}`

**Response** (nouveau joueur) :
```json
{
  "Result": {
    "News": {},
    "DefendLog": {"OfflinePeriod":{"EndDateTime":"2016-10-16T10:40:52Z"}},
    "CountryCode": "FR",
    "ShopSkuModifiers": [...],
    "ClientSettings": {
      "ClientTrackingSettings": {...},
      "XmppInfo": {
        "Username": "3123971",
        "Password": "AkiTXjIk+EqXzFWmFJGbug==",
        "Domain": "mqel-live",
        "Server": "chat.themightyquest.com",
        "Port": 80,
        "Enabled": false
      },
      "PrimaryShopUrl": "...",
      "ShowWelcomePage": false
    },
    "TargetedAttackAvailableCount": 5,
    "AccountId": 3123971,
    "Privileges": 9,
    "Wallet": {"InGameCoin": 1000},
    "BuildInfo": {
      "Draft": {
        "AccountId": 3142975,
        "LayoutId": 1,
        "CreationDate": "2016-10-23T07:20:03Z",
        "ModificationDate": "2016-10-23T07:20:03Z",
        "ThemeId": 2
      },
      "InventoryThemes": [2],
      "RoomNextIndex": 1,
      "CreatureNextIndex": 1,
      "TrapNextIndex": 1,
      "DecorationNextIndex": 1,
      "TriggerNextIndex": 1,
      "BuildingNextIndex": 1,
      "CastleStats": {
        "MaxConstructionPoints": 20,
        "WinRatio": 0.5,
        "WinRatioDifficulty": 2
      }
    },
    "Inventory": {"InventoryTabCount": 2},
    "BuyBack": {},
    "Stats": {},
    "UnlockedEmotes": [1, 2, 3],
    "AvatarId": 10,
    "ProfanityFiltering": true
  }
}
```

**Response** (joueur avec héros) :
```json
{
  "Result": {
    "News": {},
    "CompletedAchievements": [31, 1],
    "DefendLog": {"OfflinePeriod":{"EndDateTime":"2016-10-16T10:40:52Z"}},
    "CountryCode": "FR",
    "ShopSkuModifiers": [...],
    "ClientSettings": {...},
    "TargetedAttackAvailableCount": 5,
    "AccountId": 3123971,
    "DisplayName": "MonPseudo",
    "DisplayNameValidationDate": "2016-08-27T01:22:52Z",
    "GamerScore": 15,
    "SelectedHeroId": 4,
    "Privileges": 401,
    "Wallet": {
      "InGameCoin": 2000,
      "LifeForce": 2000,
      "InGameCoinStorageCapacity": 10000,
      "LifeForceStorageCapacity": 10000
    },
    "CastleRenovationLevel": 2,
    "BuildInfo": {...},
    "Heroes": [{...}],
    "Inventory": {"InventoryTabCount": 2},
    "BuyBack": {},
    "Stats": {
      "TotalCreaturesKilled": 193,
      "AttackTotalIGCWon": 797,
      "TotalCastlesLooted": 9,
      "CastlesDefeated": {"Medium": 5, "Easy": 3, "Hard": 1},
      "KilledCreatures": {...},
      "CurrencyAccumulation": {"IGC": 1300, "LifeForce": 1006},
      "DefeatCastleStrike": 3,
      "TotalItemsLooted": 27,
      "TotalPotionsConsumed": 5
    },
    "CompletedAssignments": [10, 26, 21, 20, 30, 90, 120, 5003, 5004, 100, 150, 125],
    "UnlockedEmotes": [1, 2, 3],
    "Objectives": [{
      "ObjectiveId": 300,
      "LastStatusDate": "2016-08-27T01:50:22Z",
      "Status": 2
    }],
    "AvatarId": 10,
    "ProfanityFiltering": true,
    "LeagueId": 1,
    "SubLeagueId": 1
  }
}
```

---

### 2.2 AccountService

#### `POST /AccountService.hqs/ChooseDisplayName`
**Description** : Choix du pseudo lors de la création de compte.

**Request Body** :
```json
{
  "displayName": "MonPseudo"
}
```

**Response** :
```json
{}
```

---

### 2.3 HeroService

#### `POST /HeroService.hqs/ChooseFirstHero`
**Description** : Création du premier héros (Knight, Archer, Mage).

**Request Body** :
```json
{
  "heroSpecContainerId": 4
}
```

| heroSpecContainerId | Classe |
|---------------------|--------|
| 4 | Knight |
| 5 | Archer |
| 6 | Mage |
| 7 | Runaway (non supporté) |

**Response** :
```json
{
  "Result": {
    "HeroSpecContainerId": 4,
    "Level": 1,
    "Xp": 0,
    "Equipment": {
      "MainHandSlot": {
        "Id": 108,
        "ArchetypeId": 2,
        "ItemLevel": 1,
        "PrimaryStatsModifiers": [0.4, 0.4, 0.4]
      },
      "HeadSlot": {...},
      "BodySlot": {...},
      "HandsSlot": {...},
      "ShouldersSlot": {...}
    },
    "Skills": [
      {"SlotId": 1, "SpellSpecContainerId": 611, "Level": 1},
      {"SlotId": 2, "SpellSpecContainerId": 608, "Level": 1}
    ]
  }
}
```

**Équipement de départ par classe** :

| Classe | MainHand ID | Head ID | Body ID | Hands ID | Shoulders ID |
|--------|-------------|---------|---------|----------|--------------|
| Knight | 108 | 109 | 110 | 111 | 132 |
| Archer | 124 | 125 | 126 | 127 | 133 |
| Mage | 128 | 129 | 130 | 131 | 131 |

---

### 2.4 CastleForSaleService

#### `POST /CastleForSaleService.hqs/GetCastlesForSale`
**Description** : Liste des châteaux de départ disponibles.

**Request Body** : `{}`

**Response** :
```json
{
  "Result": {
    "CastlesForSale": [
      {
        "SaleId": 1,
        "CastleInfoSummary": {
          "DefenderAccountSummary": {
            "Id": 1000,
            "DisplayName": "Theme A",
            "AvatarId": 10,
            "CastleLevel": 1
          },
          "CastleType": 1,
          "Level": 1,
          "IsNew": true,
          "IsCastleAttackable": true,
          "CastleThemeId": 21,
          "CastleHeartRank": 1
        },
        "CastleTitleOasisID": 15328,
        "CastleDescriptionOasisID": 15332,
        "FakePriceOasisID": 15336,
        "CastleIconUrl": "UI_Common_CastleSelection_Preview:A",
        "CanBePurchased": true,
        "SpawnPlotId": 1
      }
    ]
  }
}
```

#### `POST /CastleForSaleService.hqs/GetCastleForSaleBuildInfo`
**Description** : Détails complets d'un château à acheter.

**Response** : Structure complète du château avec Rooms, Creatures, Traps, Buildings, etc.

---

### 2.5 AttackSelectionService

#### `POST /AttackSelectionService.hqs/GetAttackSelectionList`
**Description** : Liste des châteaux attaquables (matchmaking).

**Response** :
```json
{
  "Result": {
    "BossCastle": {
      "DefenderAccountSummary": {
        "Id": 14,
        "DisplayName": "Snotter_King",
        "OasisNameId": 2645,
        "AvatarId": 10,
        "CastleLevel": 4
      },
      "CastleType": 1,
      "Level": 4,
      "IsNew": true,
      "IsCastleAttackable": true,
      "CastleThemeId": 5,
      "CastleHeartRank": 4,
      "WinRatioDifficulty": 2
    },
    "CastlesByLevel": [
      {
        "Level": 1,
        "Castles": [
          {
            "DefenderAccountSummary": {
              "Id": 3,
              "DisplayName": "Hedgehog Castle",
              "OasisNameId": 16675,
              "AvatarId": 10,
              "CastleLevel": 1
            },
            "CastleType": 1,
            "Level": 1,
            "IsNew": true,
            "IsCastleAttackable": true,
            "CastleThemeId": 26,
            "CastleHeartRank": 1
          }
        ]
      }
    ]
  }
}
```

#### `POST /AttackSelectionService.hqs/GetCastleInfo`
**Description** : Infos détaillées d'un château avant attaque.

**Request Body** :
```json
{
  "castleAccountId": 3
}
```

**Response** :
```json
{
  "Result": {
    "DefenderAccountSummary": {
      "Id": 3,
      "DisplayName": "Hedgehog Castle",
      "OasisNameId": 16675
    },
    "CastleType": 1,
    "RoomCount": 7,
    "Difficulty": 2,
    "PotentialLoot": {
      "Xp": 90,
      "TreasureRoomStealableIGC": 15,
      "TreasureRoomStealableLifeForce": 15,
      "IGC": 50,
      "LifeForce": 50
    },
    "IsNew": true,
    "IsCastleAttackable": true,
    "AttackabilityStatus": 1,
    "AttackType": 5,
    "Level": 1,
    "Stats": {
      "TotalConstructionPoints": 58,
      "MaxConstructionPoints": 58,
      "TrapCount": 13,
      "WinRatio": 0.5,
      "WinRatioDifficulty": 2
    },
    "VictoryConditionRewardRatios": [1, 0.75, 0.5]
  }
}
```

---

### 2.6 AttackService

#### `POST /AttackService.hqs/StartAttack`
**Description** : Démarre une attaque sur un château.

**Request Body** :
```json
{
  "castleAccountId": 3,
  "attackSource": 4,
  "attackType": 5,
  "castleType": 1
}
```

| attackSource | Description |
|--------------|-------------|
| 0 | Regular (worldmap) |
| 1 | Quest |
| 2 | Friends |
| 3 | Guild |
| 4 | Competition |
| 5 | News |
| 6 | MOTD |
| 7 | Chat |
| 8 | Machine Learning |

| attackType | Description |
|------------|-------------|
| 0 | None (tutorial) |
| 1 | Competition |
| 2 | Revenge |
| 3 | Visit |
| 4 | Validation |
| 5 | Progression |

| castleType | Description |
|------------|-------------|
| 0 | User |
| 1 | Ubisoft (bot) |

**Response** : Contient les données complètes du château, héros, loot, etc.

#### `POST /AttackService.hqs/EndAttack`
**Description** : Fin d'une attaque avec résultats.

#### `POST /AttackService.hqs/RateCastle`
**Description** : Noter un château après attaque (donne 50 gold).

#### `POST /AttackService.hqs/Resurrect`
**Description** : Résurrection pendant une attaque.

---

### 2.7 ServerCommandService

#### `POST /ServerCommandService.hqs/SendCommands`
**Description** : Endpoint principal pour TOUTES les actions du jeu.

**Types de commandes supportés** :

| $type | Description |
|-------|-------------|
| `TrackingCommand` | Télémétrie |
| `ClientIdleCommand` | Joueur inactif |
| `StartAssignmentCommand` | Démarrer une quête |
| `CompleteAssignmentCommand` | Terminer une quête |
| `ExecuteAssignmentActionCommand` | Action de quête |
| `BuyCommand` | Acheter un château |
| `BuyHeroItemCommand` | Acheter un item |
| `BuyConsumableCommand` | Acheter un consommable |
| `HeroEquipmentEquipCommand` | Équiper un item |
| `InboxCollectToHeroInventoryCommand` | Récupérer depuis inbox |

---

### 2.8 SeasonalCompetitionService

#### `POST /SeasonalCompetitionService.hqs/GetSeasonalCompetition`
**Description** : Classement de la ligue.

#### `POST /SeasonalCompetitionService.hqs/CheckSeasonalCompetitionRewards`
**Description** : Vérifier les récompenses de ligue.

---

## 🗄️ 3. Schéma de Base de Données

```sql
-- =============================================
-- MQFEL Database Schema v2.0
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comptes joueurs
CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  auth_id UUID UNIQUE NOT NULL,
  display_name VARCHAR(32),
  display_name_validation_date TIMESTAMPTZ,
  country_code VARCHAR(2) DEFAULT 'FR',
  avatar_id INTEGER DEFAULT 10,
  gamer_score INTEGER DEFAULT 0,
  privileges INTEGER DEFAULT 9,
  selected_hero_id INTEGER,
  castle_renovation_level INTEGER DEFAULT 1,
  profanity_filtering BOOLEAN DEFAULT TRUE,
  league_id INTEGER DEFAULT 1,
  sub_league_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monnaies
CREATE TABLE wallets (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  in_game_coin INTEGER DEFAULT 1000,
  life_force INTEGER DEFAULT 0,
  premium_cash INTEGER DEFAULT 0,
  igc_storage_capacity INTEGER DEFAULT 10000,
  life_force_storage_capacity INTEGER DEFAULT 10000,
  UNIQUE(account_id)
);

-- Héros
CREATE TABLE heroes (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  hero_spec_container_id INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Équipement
CREATE TABLE hero_equipment (
  id BIGSERIAL PRIMARY KEY,
  hero_id BIGINT REFERENCES heroes(id) ON DELETE CASCADE,
  slot VARCHAR(20) NOT NULL,
  template_id INTEGER NOT NULL,
  archetype_id INTEGER NOT NULL,
  item_level INTEGER DEFAULT 1,
  stat_modifier_1 DECIMAL(5,3) DEFAULT 0.4,
  stat_modifier_2 DECIMAL(5,3) DEFAULT 0.4,
  stat_modifier_3 DECIMAL(5,3) DEFAULT 0.4,
  effects JSONB DEFAULT '[]',
  is_sellable BOOLEAN DEFAULT TRUE,
  UNIQUE(hero_id, slot)
);

-- Skills
CREATE TABLE hero_skills (
  id BIGSERIAL PRIMARY KEY,
  hero_id BIGINT REFERENCES heroes(id) ON DELETE CASCADE,
  slot_id INTEGER NOT NULL,
  spell_spec_container_id INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  UNIQUE(hero_id, slot_id)
);

-- Châteaux
CREATE TABLE castles (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE UNIQUE,
  layout_id INTEGER DEFAULT 1,
  theme_id INTEGER DEFAULT 21,
  level INTEGER DEFAULT 1,
  castle_heart_rank INTEGER DEFAULT 1,
  total_construction_points INTEGER DEFAULT 55,
  max_construction_points INTEGER DEFAULT 55,
  win_ratio DECIMAL(3,2) DEFAULT 0.5,
  win_ratio_difficulty INTEGER DEFAULT 2,
  draft_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  modified_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Inventaire
CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  template_id INTEGER NOT NULL,
  archetype_id INTEGER,
  item_level INTEGER,
  stack_count INTEGER DEFAULT 1,
  stat_modifiers JSONB,
  effects JSONB,
  is_sellable BOOLEAN DEFAULT TRUE,
  slot_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox
CREATE TABLE inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  item_type INTEGER NOT NULL,
  item_data JSONB NOT NULL,
  collected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quêtes terminées
CREATE TABLE completed_assignments (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  assignment_id INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, assignment_id)
);

-- Succès
CREATE TABLE completed_achievements (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, achievement_id)
);

-- Statistiques
CREATE TABLE player_stats (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE UNIQUE,
  total_creatures_killed INTEGER DEFAULT 0,
  attack_total_igc_won INTEGER DEFAULT 0,
  total_castles_looted INTEGER DEFAULT 0,
  castles_defeated_easy INTEGER DEFAULT 0,
  castles_defeated_medium INTEGER DEFAULT 0,
  castles_defeated_hard INTEGER DEFAULT 0,
  killed_creatures JSONB DEFAULT '{}',
  currency_accumulation_igc INTEGER DEFAULT 0,
  currency_accumulation_life_force INTEGER DEFAULT 0,
  defeat_castle_strike INTEGER DEFAULT 0,
  total_items_looted INTEGER DEFAULT 0,
  total_potions_consumed INTEGER DEFAULT 0
);

-- Objectifs
CREATE TABLE objectives (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  objective_id INTEGER NOT NULL,
  status INTEGER DEFAULT 1,
  last_status_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, objective_id)
);

-- Historique attaques
CREATE TABLE attacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attacker_account_id BIGINT REFERENCES accounts(id),
  defender_account_id BIGINT,
  attack_type INTEGER,
  castle_type INTEGER,
  duration INTEGER,
  total_xp INTEGER,
  total_gold INTEGER,
  total_life_force INTEGER,
  victory_condition_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create defaults
CREATE OR REPLACE FUNCTION create_account_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (account_id) VALUES (NEW.id);
  INSERT INTO player_stats (account_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_account_created
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_account_defaults();

-- Indexes
CREATE INDEX idx_accounts_auth_id ON accounts(auth_id);
CREATE INDEX idx_heroes_account_id ON heroes(account_id);
CREATE INDEX idx_castles_account_id ON castles(account_id);
CREATE INDEX idx_inventory_account_id ON inventory(account_id);
CREATE INDEX idx_attacks_attacker ON attacks(attacker_account_id);
```

---

## 🎮 4. Lancement du Jeu

### Méthode 1 : Argument de ligne de commande
```bash
./MightyQuest.exe -server_url http://localhost:8080 -steamid 76561198012345678 -steamticket "" -token ""
```

### Méthode 2 : Avec Goldberg + hosts file

1. Installer Goldberg (voir section 1)
2. Ajouter dans `C:\Windows\System32\drivers\etc\hosts` :
   ```
   127.0.0.1 Gameserver
   127.0.0.1 chat.themightyquest.com
   ```
3. Lancer le serveur sur le port 80 ou utiliser un reverse proxy

### Méthode 3 : Avec le Launcher custom
Utiliser le launcher Electron qui gère l'auth Google et lance le jeu automatiquement.

---

## 📋 5. Checklist de Déploiement

### Supabase
- [ ] Créer un projet Supabase
- [ ] Exécuter le schéma SQL
- [ ] Activer Google Auth dans Authentication > Providers
- [ ] Configurer les credentials Google Cloud Console
- [ ] Noter l'URL et les clés API

### Serveur
- [ ] Déployer sur Railway/Render/Fly.io
- [ ] Configurer les variables d'environnement
- [ ] Tester les endpoints

### Client
- [ ] Télécharger Goldberg Emulator
- [ ] Configurer steam_settings/
- [ ] Remplacer steam_api.dll
- [ ] Tester le lancement

---

## 🐛 6. Troubleshooting

| Erreur | Solution |
|--------|----------|
| "Steam not found" | Vérifier steam_api.dll de Goldberg |
| "Connection refused" | Vérifier que le serveur tourne |
| "Invalid response" | Vérifier les formats JSON |
| Crash au lancement | Fichiers du jeu incomplets |

---

*Document généré pour le projet MQFEL Revival*
*Basé sur l'analyse de MQELOffline_cpp par Hedgehogscience*
