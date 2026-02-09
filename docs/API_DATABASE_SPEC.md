# 📡 MQFEL - Spécification API & Base de Données

## 🌐 Tous les Endpoints API

Le jeu appelle des endpoints REST au format:
```
POST /ServiceName.hqs/MethodName
Content-Type: application/json
```

### 📋 Liste Complète des Services

| Service | Endpoints | Description |
|---------|-----------|-------------|
| **AccountService** | Login, GetSteamTicket | Authentification |
| **AccountInformationService** | GetAccountInformation | Toutes les données du compte |
| **HeroService** | ChooseFirstHero, GetHero | Gestion des héros |
| **AttackService** | StartAttack, EndAttack, RateCastle, Resurrect | Combat |
| **AttackSelectionService** | GetCastles | Sélection des châteaux à attaquer |
| **CastleForSaleService** | GetCastlesForSale, GetCastleForSaleBuildInfo | Achat de châteaux |
| **ServerCommandService** | SendCommands | Actions diverses (craft, équipement, etc.) |
| **SeasonalCompetitionService** | GetCompetition | Classements saisonniers |

---

## 📡 Détail des Endpoints

### 1. AccountInformationService.hqs/GetAccountInformation
**Le plus important** - Retourne TOUT le profil du joueur au login.

```json
{
  "Result": {
    "AccountId": 3123971,
    "DisplayName": "NomJoueur",
    "DisplayNameValidationDate": "2016-08-27T01:22:52Z",
    "CountryCode": "FR",
    "GamerScore": 15,
    "Privileges": 401,
    "AvatarId": 10,
    "ProfanityFiltering": true,
    "SelectedHeroId": 1,
    "LeagueId": 1,
    "SubLeagueId": 1,
    
    "Wallet": {
      "InGameCoin": 50000,
      "LifeForce": 1200,
      "InGameCoinStorageCapacity": 100000,
      "LifeForceStorageCapacity": 5000
    },
    
    "Heroes": [
      {
        "Id": 1,
        "SpecContainerId": 1,
        "DisplayName": "Sir Knight",
        "Level": 25,
        "Experience": 15000,
        "Equipment": {
          "Mainhand": { "Id": 108, "Archetype": 2, "Rank": 5, "Modifiers": [0.4, 0.4, 0.4] },
          "Offhand": null,
          "Head": { "Id": 109, "Archetype": 8, "Rank": 4 },
          "Body": { "Id": 110, "Archetype": 8, "Rank": 4 },
          "Hands": { "Id": 111, "Archetype": 8, "Rank": 3 },
          "Shoulders": { "Id": 132, "Archetype": 8, "Rank": 3 }
        },
        "UnlockedSkills": [1, 2, 3, 5, 8],
        "EquippedSkills": [1, 3, 5]
      }
    ],
    
    "BuildInfo": {
      "Draft": {
        "AccountId": 3123971,
        "AccountDisplayName": "NomJoueur",
        "LayoutId": 1,
        "ThemeId": 22,
        "CreationDate": "2016-08-27T01:10:00Z",
        "ModificationDate": "2016-08-27T01:19:08Z",
        "Rooms": [
          {
            "X": 4, "Y": 3, "Id": 1,
            "SpecContainerId": 21,
            "Creatures": [
              { "Id": 1, "SpecContainerId": 1000, "X": 10, "Y": 15, "Orientation": 2 }
            ],
            "Traps": [
              { "Id": 1, "SpecContainerId": 67, "X": 5, "Y": 5, "PowerSupplyCastleBuildableId": 505 }
            ],
            "Decorations": [
              { "Id": 1, "SpecContainerId": 136, "X": 2, "Y": 3 }
            ],
            "Buildings": [
              { "Id": 1, "SpecContainerId": 1, "Rank": 1, "RoomZoneId": 12, "X": 3, "Y": 3 }
            ]
          }
        ]
      },
      "Level": 5,
      "InventoryThemes": [1, 22],
      "RoomNextIndex": 4,
      "CreatureNextIndex": 33,
      "TrapNextIndex": 4,
      "CastleStats": {
        "TotalConstructionPoints": 55,
        "MaxConstructionPoints": 55,
        "WinRatio": 0.65,
        "WinRatioDifficulty": 2
      },
      "CastleHeartRank": 1
    },
    
    "Inventory": {
      "InventoryTabCount": 2,
      "Items": []
    },
    
    "Stats": {
      "TotalCreaturesKilled": 193,
      "AttackTotalIGCWon": 797,
      "TotalCastlesLooted": 9,
      "CastlesDefeated": { "Medium": 5, "Easy": 3, "Hard": 1 },
      "TotalItemsLooted": 27,
      "TotalPotionsConsumed": 5
    },
    
    "CompletedAssignments": [10, 26, 21, 20, 30, 90, 120],
    "CompletedAchievements": [31, 1],
    "UnlockedEmotes": [1, 2, 3],
    "Objectives": [
      { "ObjectiveId": 300, "Status": 2, "LastStatusDate": "2016-08-27T01:50:22Z" }
    ],
    
    "ClientSettings": {
      "XmppInfo": {
        "Username": "3123971",
        "Password": "xxx",
        "Domain": "mqel-live",
        "Server": "localhost",
        "Port": 5222,
        "Enabled": false
      }
    },
    
    "News": {},
    "DefendLog": { "OfflinePeriod": { "EndDateTime": "2016-10-16T10:40:52Z" } },
    "ShopSkuModifiers": [],
    "TargetedAttackAvailableCount": 5,
    "BuyBack": {}
  }
}
```

---

### 2. HeroService.hqs/ChooseFirstHero
**Création du premier héros**

Request:
```json
{ "heroSpecContainerId": 1 }
```
- 1 = Knight
- 2 = Archer  
- 3 = Mage
- 4 = Runaway

Response:
```json
{ "Result": { "Success": true } }
```

---

### 3. AttackService.hqs/StartAttack
**Démarrer une attaque de château**

Request:
```json
{
  "castleAccountId": 1234567,
  "attackType": 1,
  "castleType": 0
}
```

Response:
```json
{
  "Result": {
    "AttackId": "abc123",
    "Castle": { },
    "Level": 5,
    "Hero": { },
    "AttackerDisplayName": "NomJoueur",
    "CreatureLoot": [ ],
    "TrapLoot": [ ],
    "FirstResurrectionCost": 500,
    "AttackRandomSeed": 12345,
    "UnlockedSpells": [1, 2, 3],
    "UnlockedEmotes": [1, 2, 3],
    "VictoryConditionRewardRatios": [1, 0.75, 0.5],
    "FreeInventorySlotsCount": 42,
    "TreasureRoomStealableIGC": 5000,
    "TreasureRoomStealableLifeForce": 200,
    "TreasureRoomGoldRatio": 0.3,
    "TreasureRoomLifeForceRatio": 0.3,
    "IsResurrectionAllowed": true,
    "CastleValidationDuration": 44.23
  }
}
```

---

### 4. AttackService.hqs/EndAttack
**Terminer une attaque**

Request:
```json
{
  "attackId": "abc123",
  "victoryCondition": 1,
  "replay": "base64encodedreplay...",
  "lootedItems": [101, 102, 103]
}
```

---

### 5. ServerCommandService.hqs/SendCommands
**Commandes diverses (équipement, craft, achat)**

Request:
```json
{
  "Commands": [
    {
      "Type": "Equipment",
      "HeroId": 1,
      "Slot": "Mainhand",
      "ItemId": 108
    },
    {
      "Type": "ItemBuy",
      "SkuCode": "15224",
      "Quantity": 1
    },
    {
      "Type": "CastleBuy",
      "SaleId": 2
    }
  ]
}
```

---

## 🗄️ SCHÉMA BASE DE DONNÉES (Supabase/PostgreSQL)

Voir le fichier `sql/schema.sql` pour le schéma complet.

### Tables Principales

| Table | Description |
|-------|-------------|
| `accounts` | Comptes joueurs (Google auth, display name, etc.) |
| `wallets` | Or, Force Vitale, Blings |
| `heroes` | Héros (niveau, XP, équipement, skills) |
| `items` | Inventaire complet |
| `castles` | Métadonnées château |
| `castle_rooms` | Salles du château |
| `castle_creatures` | Monstres placés |
| `castle_traps` | Pièges placés |
| `castle_decorations` | Décorations |
| `castle_buildings` | Bâtiments (forge, mines) |
| `player_stats` | Statistiques de jeu |
| `achievements` | Succès débloqués |
| `quests` | Quêtes/Assignments |
| `attacks` | Historique des attaques |
| `inbox` | Messages et récompenses |

---

## 🔄 Flow Complet de Sauvegarde

```
┌────────────────────────────────────────────────────────────────┐
│  1. CONNEXION                                                  │
│  POST /AccountService.hqs/Login                                │
│  → Crée/récupère compte dans accounts                         │
│  → Retourne token JWT                                         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  2. CHARGEMENT PROFIL                                         │
│  POST /AccountInformationService.hqs/GetAccountInformation    │
│  → JOIN accounts + wallets + heroes + items + castles         │
│  → Construit le gros JSON de réponse                          │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  3. ACTIONS EN JEU                                            │
│  POST /ServerCommandService.hqs/SendCommands                  │
│  → UPDATE wallets (or, force vitale)                          │
│  → INSERT/UPDATE items (équipement, craft)                    │
│  → UPDATE heroes (XP, équipement)                             │
│  → UPDATE castles (modifications)                             │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  4. ATTAQUES                                                  │
│  POST /AttackService.hqs/StartAttack                          │
│  → SELECT château de la cible                                 │
│  POST /AttackService.hqs/EndAttack                            │
│  → INSERT attacks (historique)                                │
│  → UPDATE wallets (butin)                                     │
│  → UPDATE player_stats                                        │
└────────────────────────────────────────────────────────────────┘
```