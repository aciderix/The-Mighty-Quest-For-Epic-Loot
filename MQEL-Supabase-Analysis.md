# The Mighty Quest For Epic Loot — Analyse & Plan Serveur Supabase

## 1. Analyse du Projet Existant

### 1.1 Architecture Actuelle

Le projet est un **serveur offline local** (DLL C++) qui intercepte les appels réseau du client MQEL via le framework **Localnetworking**. Le client du jeu (MightyQuest.exe) est un moteur C++ avec une UI en JavaScript (libCEF / Chromium Embedded).

```
┌─────────────────┐     HTTPS (intercepté)     ┌──────────────────────┐
│  MightyQuest.exe │ ──────────────────────────▶│ MQELOffline.dll      │
│  (Client C++)    │◀────────────────────────── │ (Serveur local C++)  │
│  + libCEF (UI)   │     JSON REST responses    │ via Localnetworking  │
└─────────────────┘                             └──────────────────────┘
```

**Point clé** : Le client communique via des **endpoints REST JSON standard** sur HTTPS. C'est une architecture parfaitement adaptée au remplacement par un vrai serveur distant.

### 1.2 Endpoints REST Identifiés

| Service | Endpoint | Méthode | Description |
|---------|----------|---------|-------------|
| **AccountService** | `/AccountService.hqs/ChooseDisplayName` | POST | Choix du pseudo joueur |
| **AccountInformationService** | `/AccountInformationService.hqs/GetAccountInformation` | GET | Données complètes du compte (héros, wallet, build, stats, quêtes...) |
| **HeroService** | `/HeroService.hqs/ChooseFirstHero` | POST | Création du premier héros (Knight/Archer/Mage/Runaway) |
| **AttackService** | `/AttackService.hqs/StartAttack` | POST | Lancer une attaque sur un château |
| **AttackService** | `/AttackService.hqs/EndAttack` | POST | Terminer une attaque (résultats, loot, XP) |
| **AttackService** | `/AttackService.hqs/RateCastle` | POST | Noter un château (+50 gold) |
| **AttackService** | `/AttackService.hqs/Resurrect` | POST | Résurrection pendant une attaque |
| **AttackSelectionService** | `/AttackSelectionService.hqs/GetAttackSelectionList` | GET | Liste des châteaux attaquables (matchmaking) |
| **AttackSelectionService** | `/AttackSelectionService.hqs/GetCastleInfo` | GET | Info détaillée d'un château |
| **CastleForSaleService** | `/CastleForSaleService.hqs/GetCastlesForSale` | GET | Châteaux à acheter (sélection initiale) |
| **CastleForSaleService** | `/CastleForSaleService.hqs/GetCastleForSaleBuildInfo` | GET | Détails de construction d'un château en vente |
| **SeasonalCompetitionService** | `/SeasonalCompetitionService.hqs/CheckSeasonalCompetitionRewards` | GET | Récompenses de saison/ligue |
| **SeasonalCompetitionService** | `/SeasonalCompetitionService.hqs/GetSeasonalCompetition` | GET | Classement saisonnier |
| **ServerCommandService** | `/ServerCommandService.hqs/SendCommands` | POST | Commandes batch (télémétrie, quêtes, achats, équipement) |

### 1.3 Modèle de Données Backend

Le serveur gère ces entités (actuellement stockées dans des fichiers .json/.BB dans un .zip Package) :

| Entité | Fichier actuel | Données |
|--------|---------------|---------|
| **Héros** | `Heroes.json` | 4 classes (Knight/Archer/Mage/Runaway), niveau, XP, équipement (11 slots), sorts, consommables, régions, stats |
| **Wallet** | `Wallets.json` | 3 monnaies : PremiumCash, IGC (or), Lifeforce — montant + capacité |
| **Quêtes** | `Quests.BB` | Map QuestID → completed (bool) |
| **Châteaux PvP** | `Castle_*.json` | Layout complet des châteaux (rooms, creatures, traps, decorations, buildings) |

### 1.4 Structures de Données Clés

```
Hero_t {
    Type: eHerotype (Knight=2, Archer=3, Mage=4, Runaway=5)
    Level: uint32
    TotalXP: uint32
    Gear: Equipment_t[11 slots] (Head, Shoulders, Body, Back, Neck, Finger, Hands, MainHand, OffHand, Costume, Pet)
    Spells: Spell_t[]
    Consumables: Consumable_t[]
    Knownregions: Attackregion_t[]
    Stats: Stat_t (CreaturesKilled, CastlesLooted, TimePlayed)
}

Equipment_t {
    ID (TemplateId), Dye, Branded, Sellable, Level, Archetype
    Itemtype: string
    Modifiers: double[3] (PrimaryStatsModifiers)
    Effects: Effect_t[] (Id + Level)
}

Wallet: { PremiumCash, IGC, Lifeforce } × { Amount, Capacity }
```

### 1.5 Système de Notifications

Le jeu utilise un système de **notifications en queue** :
- **Locales** : WalletUpdated, HeroXpChanged, InboxItemsAdded, AssignmentActionCompleted, CastleBought, etc.
- **Globales** : SeasonalCompetitionStarted, etc.

Les notifications sont attachées aux réponses JSON via `Notifications[]` et `GlobalNotifications[]`.

---

## 2. Architecture Serveur Supabase

### 2.1 Vue d'Ensemble

```
┌─────────────────┐      HTTPS/JSON       ┌────────────────────────────┐
│  MightyQuest.exe │ ────────────────────▶ │  Supabase Edge Functions   │
│  (Client modifié │◀──────────────────── │  (Deno/TypeScript)         │
│   server_url)    │                       │  Implémente les .hqs       │
└─────────────────┘                       └──────────┬─────────────────┘
                                                      │
                                          ┌───────────▼───────────────┐
                                          │    Supabase PostgreSQL    │
                                          │    + Supabase Auth        │
                                          │    (Anonymous Sign-In)    │
                                          └───────────────────────────┘
```

### 2.2 Authentification Sans Email (Gratuit sur Supabase)

Puisque l'email est payant/limité sur Supabase, voici les **3 options gratuites** :

#### ✅ Option Recommandée : Auth Anonyme + Upgrade vers Pseudo/Mot de passe

```
1. Le joueur lance le jeu → Supabase crée un compte anonyme automatiquement
2. Un UUID unique est attribué (= AccountId)
3. Le joueur choisit son DisplayName (déjà dans le flow du jeu)
4. Optionnel : le joueur peut "upgrader" son compte avec pseudo+mot de passe
```

**Avantages** : Zéro friction, gratuit, pas besoin d'email. Le joueur peut jouer immédiatement.

**Implémentation Supabase** :
```sql
-- Activer l'auth anonyme dans le dashboard Supabase :
-- Authentication > Settings > Allow anonymous sign-ins: ON
```

```typescript
// Côté client/proxy : création de session anonyme
const { data, error } = await supabase.auth.signInAnonymously()
// data.user.id = UUID du joueur

// Plus tard, upgrade vers un vrai compte (pseudo + password, sans email)
const { data, error } = await supabase.auth.updateUser({
  password: 'mon_mot_de_passe',
  data: { display_name: 'MonPseudo' }
})
```

#### Option B : Pseudo + Mot de passe (via Edge Function custom)

Créer un système d'auth personnalisé avec Supabase comme stockage :
- Table `players(id, username, password_hash, created_at)`
- JWT signé manuellement dans une Edge Function
- Plus de contrôle, mais plus de code à maintenir

#### Option C : OAuth Social (Discord, Steam)

Steam serait idéal vu l'origine du jeu, mais la configuration est plus complexe.

### 2.3 Schéma Base de Données PostgreSQL

```sql
-- ============================================
-- TABLES PRINCIPALES
-- ============================================

-- Comptes joueurs (lié à auth.users via id)
CREATE TABLE accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name TEXT UNIQUE,
    display_name_set_at TIMESTAMPTZ,
    avatar_id INTEGER DEFAULT 10,
    country_code TEXT DEFAULT 'FR',
    gamer_score INTEGER DEFAULT 0,
    privileges INTEGER DEFAULT 9,  -- 9 = nouveau, 401 = héros créé
    league_id INTEGER DEFAULT 1,
    sub_league_id INTEGER DEFAULT 1,
    trophy_score INTEGER DEFAULT 0,
    profanity_filtering BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet (monnaies du joueur)
CREATE TABLE wallets (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    currency_type INTEGER NOT NULL,  -- 1=Premium, 2=IGC, 4=Lifeforce
    amount INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 0,
    PRIMARY KEY (account_id, currency_type)
);

-- Héros (un joueur peut avoir jusqu'à 4 héros)
CREATE TABLE heroes (
    id SERIAL PRIMARY KEY,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    hero_type INTEGER NOT NULL,  -- 2=Knight, 3=Archer, 4=Mage, 5=Runaway
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    is_selected BOOLEAN DEFAULT FALSE,
    stats JSONB DEFAULT '{}',
    attack_regions JSONB DEFAULT '[{"AttackRegionId":1,"Status":2}]',
    equipped_spells JSONB DEFAULT '[]',
    equipped_consumables JSONB DEFAULT '[{"TemplateId":1}]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, hero_type)
);

-- Équipement des héros
CREATE TABLE hero_equipment (
    hero_id INTEGER REFERENCES heroes(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL,  -- 1=Head, 2=Shoulders, ..., 11=Pet
    template_id INTEGER NOT NULL,
    item_type TEXT DEFAULT 'HeroEquipmentItem',
    item_level INTEGER DEFAULT 1,
    archetype_id INTEGER DEFAULT 8,
    dye_template_id INTEGER DEFAULT 0,
    is_branded BOOLEAN DEFAULT FALSE,
    is_sellable BOOLEAN DEFAULT FALSE,
    primary_stats_modifiers JSONB DEFAULT '[0.4, 0.4, 0.4]',
    effects JSONB DEFAULT '[]',
    PRIMARY KEY (hero_id, slot)
);

-- Châteaux des joueurs (structure complète)
CREATE TABLE castles (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE PRIMARY KEY,
    castle_data JSONB NOT NULL,  -- Layout complet (rooms, creatures, traps, etc.)
    theme_id INTEGER DEFAULT 22,
    castle_level INTEGER DEFAULT 1,
    castle_heart_rank INTEGER DEFAULT 1,
    total_construction_points INTEGER DEFAULT 55,
    max_construction_points INTEGER DEFAULT 55,
    win_ratio REAL DEFAULT 0.5,
    win_ratio_difficulty INTEGER DEFAULT 2,
    room_next_index INTEGER DEFAULT 4,
    creature_next_index INTEGER DEFAULT 33,
    trap_next_index INTEGER DEFAULT 4,
    decoration_next_index INTEGER DEFAULT 34,
    trigger_next_index INTEGER DEFAULT 1,
    building_next_index INTEGER DEFAULT 9,
    renovation_level INTEGER DEFAULT 2,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventaire des châteaux (thèmes possédés)
CREATE TABLE castle_themes (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    theme_id INTEGER NOT NULL,
    PRIMARY KEY (account_id, theme_id)
);

-- Quêtes/Assignments
CREATE TABLE quests (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (account_id, quest_id)
);

-- Objectifs
CREATE TABLE objectives (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    objective_id INTEGER NOT NULL,
    status INTEGER DEFAULT 1,  -- 1=In Progress, 2=Completed
    last_status_date TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (account_id, objective_id)
);

-- Historique des attaques
CREATE TABLE attack_log (
    id TEXT PRIMARY KEY,  -- AttackId (hex timestamp)
    attacker_id UUID REFERENCES accounts(id),
    defender_id UUID REFERENCES accounts(id),
    castle_type INTEGER,
    attack_type INTEGER,
    attack_source INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    result JSONB,
    is_tutorial BOOLEAN DEFAULT FALSE
);

-- Log de défense
CREATE TABLE defense_log (
    id SERIAL PRIMARY KEY,
    defender_id UUID REFERENCES accounts(id),
    attacker_id UUID REFERENCES accounts(id),
    attack_id TEXT REFERENCES attack_log(id),
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventaire du joueur (items, consommables)
CREATE TABLE inventory (
    id TEXT PRIMARY KEY,  -- ObjectId MongoDB-style
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    item_type INTEGER,  -- 1=Equipment, 2=Consumable
    item_data JSONB NOT NULL,
    in_inbox BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achèvements complétés
CREATE TABLE achievements (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (account_id, achievement_id)
);

-- Compétition saisonnière
CREATE TABLE seasonal_competition (
    id SERIAL PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    season_start TIMESTAMPTZ NOT NULL,
    season_end TIMESTAMPTZ NOT NULL,
    score INTEGER DEFAULT 0,
    league_id INTEGER DEFAULT 1,
    sub_league_id INTEGER DEFAULT 1,
    rank INTEGER
);

-- Commentaires sur les châteaux
CREATE TABLE castle_comments (
    attack_id TEXT PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    castle_owner_id UUID,
    comment_raw TEXT,
    avatar_id INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE castles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Les joueurs ne voient que leurs propres données
CREATE POLICY "Users own data" ON accounts FOR ALL USING (id = auth.uid());
CREATE POLICY "Users own wallets" ON wallets FOR ALL USING (account_id = auth.uid());
CREATE POLICY "Users own heroes" ON heroes FOR ALL USING (account_id = auth.uid());
CREATE POLICY "Users own equipment" ON hero_equipment FOR ALL
    USING (hero_id IN (SELECT id FROM heroes WHERE account_id = auth.uid()));
CREATE POLICY "Users own quests" ON quests FOR ALL USING (account_id = auth.uid());

-- Les châteaux sont lisibles par tous (pour PvP) mais modifiables par le propriétaire
CREATE POLICY "Public castles read" ON castles FOR SELECT USING (TRUE);
CREATE POLICY "Own castle write" ON castles FOR ALL USING (account_id = auth.uid());
```

### 2.4 Edge Functions (Supabase Deno)

Chaque service `.hqs` devient une Edge Function. Voici l'architecture :

```
supabase/functions/
├── _shared/
│   ├── supabase-client.ts    # Client Supabase initialisé
│   ├── auth-middleware.ts     # Vérification JWT/session
│   ├── notifications.ts      # Système de notifications
│   ├── game-data.ts          # Données statiques du jeu (loot tables, etc.)
│   └── types.ts              # Types TypeScript
│
├── account-service/
│   └── index.ts              # ChooseDisplayName
├── account-info/
│   └── index.ts              # GetAccountInformation
├── hero-service/
│   └── index.ts              # ChooseFirstHero
├── attack-service/
│   └── index.ts              # StartAttack, EndAttack, RateCastle, Resurrect
├── attack-selection/
│   └── index.ts              # GetAttackSelectionList, GetCastleInfo
├── castle-for-sale/
│   └── index.ts              # GetCastlesForSale, GetCastleForSaleBuildInfo
├── seasonal-competition/
│   └── index.ts              # CheckRewards, GetSeasonalCompetition
├── server-command/
│   └── index.ts              # SendCommands (batch handler)
└── auth/
    └── index.ts              # Login anonyme + upgrade compte
```

#### Exemple : Edge Function `account-info`

```typescript
// supabase/functions/account-info/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Charger toutes les données du compte en parallèle
  const [account, wallets, heroes, castle, quests, objectives, achievements] = await Promise.all([
    supabase.from('accounts').select('*').eq('id', user.id).single(),
    supabase.from('wallets').select('*').eq('account_id', user.id),
    supabase.from('heroes').select('*, hero_equipment(*)').eq('account_id', user.id),
    supabase.from('castles').select('*').eq('account_id', user.id).single(),
    supabase.from('quests').select('quest_id').eq('account_id', user.id).eq('completed', true),
    supabase.from('objectives').select('*').eq('account_id', user.id),
    supabase.from('achievements').select('achievement_id').eq('account_id', user.id),
  ])

  const heroCreated = heroes.data && heroes.data.length > 0
  const selectedHero = heroes.data?.find(h => h.is_selected)

  // Construire la réponse au format MQEL attendu
  const response: any = { Result: {} }
  response.Result.News = {}
  response.Result.AccountId = account.data.id
  response.Result.CountryCode = account.data.country_code
  response.Result.Privileges = heroCreated ? 401 : 9
  response.Result.AvatarId = account.data.avatar_id
  response.Result.ProfanityFiltering = true

  if (heroCreated) {
    response.Result.DisplayName = account.data.display_name
    response.Result.SelectedHeroId = selectedHero.hero_type
    response.Result.GamerScore = account.data.gamer_score
    response.Result.LeagueId = account.data.league_id
    response.Result.SubLeagueId = account.data.sub_league_id
    response.Result.CompletedAchievements = achievements.data.map(a => a.achievement_id)
    response.Result.Heroes = heroes.data.map(serializeHero)
    response.Result.CompletedAssignments = quests.data.map(q => q.quest_id)
    response.Result.CastleRenovationLevel = castle.data?.renovation_level || 2
  }

  // Wallet
  response.Result.Wallet = buildWalletResponse(wallets.data, heroCreated)
  response.Result.BuildInfo = buildCastleResponse(castle.data, heroCreated)
  // ... (ClientSettings, ShopSkuModifiers, etc. = données statiques)

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 2.5 Couche Proxy / Routeur

Le client MQEL attend des URLs en `.hqs`. On a besoin d'un **routeur** qui traduit les endpoints du jeu vers les Edge Functions Supabase.

**Option A : Edge Function unique comme routeur** (recommandé)

```typescript
// supabase/functions/game-router/index.ts
serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname

  // Router les .hqs vers les handlers
  const routes: Record<string, Function> = {
    '/AccountService.hqs/ChooseDisplayName': handleChooseDisplayName,
    '/AccountInformationService.hqs/GetAccountInformation': handleGetAccountInfo,
    '/HeroService.hqs/ChooseFirstHero': handleChooseFirstHero,
    '/AttackService.hqs/StartAttack': handleStartAttack,
    '/AttackService.hqs/EndAttack': handleEndAttack,
    '/AttackSelectionService.hqs/GetAttackSelectionList': handleGetAttackList,
    '/ServerCommandService.hqs/SendCommands': handleSendCommands,
    // ... etc.
  }

  const handler = routes[path]
  if (!handler) return new Response('Not Found', { status: 404 })

  return handler(req)
})
```

**Option B : Serveur Node.js/Express dédié** (VPS ou Railway/Render)

Plus de flexibilité mais nécessite un hébergement séparé.

### 2.6 Modification du Client

Le client doit pointer vers le serveur Supabase au lieu du serveur local.

**Actuellement** :
```
MightyQuest.exe -server_url https://Gameserver -environmentName mqel-live ...
```

**Avec Supabase** :
```
MightyQuest.exe -server_url https://VOTRE_PROJET.supabase.co/functions/v1/game-router -environmentName mqel-live -steamid PLAYER_UUID -steamticket "JWT_TOKEN" -token "JWT_TOKEN"
```

⚠️ **Problème potentiel** : Le client original utilise le framework Localnetworking pour intercepter les appels HTTPS. Pour passer en vrai serveur distant, il faudra :

1. **Retirer le hook Localnetworking** (ne plus charger la DLL)
2. **Gérer les certificats SSL** (Supabase a des certs valides, pas besoin du patch libCURL)
3. **Passer l'auth Supabase** via les paramètres `-steamticket` ou `-token`, ou via un header HTTP custom
4. **Adapter le bootstrap** pour récupérer le JWT Supabase avant de lancer le jeu

### 2.7 Flow d'Authentification Complet

```
┌──────────┐   1. Lancer le launcher    ┌──────────────┐
│  Joueur  │ ──────────────────────────▶│  Launcher    │
│          │                             │  (modifié)   │
└──────────┘                             └──────┬───────┘
                                                │
                  2. signInAnonymously()        │
                  ou signInWithPassword()       ▼
                                         ┌──────────────┐
                                         │  Supabase    │
                                         │  Auth        │
                                         └──────┬───────┘
                                                │
                  3. JWT Token                  │
                  ◀─────────────────────────────┘
                                                │
                  4. Lancer MightyQuest.exe      │
                     avec -token "JWT"           │
                                                ▼
                                         ┌──────────────┐
                  5. Toutes les requêtes │  Edge        │
                     incluent le JWT ──▶ │  Functions   │
                     Authorization:      │  (routeur)   │
                     Bearer <jwt>        └──────────────┘
```

---

## 3. Fonctionnalités Online (PvP Réel)

L'avantage majeur d'un serveur en ligne : le **vrai PvP entre joueurs** !

### 3.1 Matchmaking Réel

Remplacer les données hardcodées de `GetAttackSelectionList` par de vraies requêtes :

```sql
-- Trouver des châteaux de joueurs à attaquer
SELECT
    a.id, a.display_name, a.avatar_id, a.trophy_score,
    c.castle_level, c.theme_id, c.castle_heart_rank,
    c.win_ratio, c.win_ratio_difficulty,
    c.published_at
FROM accounts a
JOIN castles c ON c.account_id = a.id
WHERE a.id != $current_user_id
  AND c.published_at IS NOT NULL  -- Château publié
  AND c.castle_level BETWEEN $min_level AND $max_level
ORDER BY RANDOM()
LIMIT 10;
```

### 3.2 Vrais Résultats d'Attaque

- Le serveur valide les résultats de combat (anti-triche)
- Le loot est calculé côté serveur
- Les défenseurs reçoivent des notifications de défense

### 3.3 Classement Saisonnier Réel

```sql
-- Classement en temps réel
SELECT
    a.display_name, a.avatar_id, a.league_id,
    sc.score, a.country_code,
    RANK() OVER (ORDER BY sc.score DESC) as rank
FROM seasonal_competition sc
JOIN accounts a ON a.id = sc.account_id
WHERE sc.season_start <= NOW() AND sc.season_end >= NOW()
ORDER BY sc.score DESC
LIMIT 50;
```

---

## 4. Plan d'Implémentation par Étapes

### Phase 1 : Fondations (1-2 semaines)

- [ ] Créer le projet Supabase
- [ ] Activer l'authentification anonyme
- [ ] Créer le schéma de base de données (migrations SQL)
- [ ] Implémenter l'Edge Function routeur principal
- [ ] Implémenter `GetAccountInformation` (endpoint le plus complexe)
- [ ] Implémenter `ChooseDisplayName`

### Phase 2 : Création de Personnage (1 semaine)

- [ ] Implémenter `ChooseFirstHero` avec équipement de base
- [ ] Implémenter `GetCastlesForSale` + `GetCastleForSaleBuildInfo`
- [ ] Implémenter la commande `BuyCommand` (achat de château)
- [ ] Système de wallet (Supabase DB)

### Phase 3 : Gameplay Core (2-3 semaines)

- [ ] Implémenter `StartAttack` avec chargement de châteaux réels
- [ ] Implémenter `EndAttack` avec calcul de rewards
- [ ] Implémenter `SendCommands` (quêtes, tracking, équipement)
- [ ] Implémenter `GetAttackSelectionList` (matchmaking réel)
- [ ] Système de notifications en queue

### Phase 4 : Fonctionnalités Sociales (1-2 semaines)

- [ ] Classement saisonnier (`SeasonalCompetition`)
- [ ] Commentaires sur les châteaux
- [ ] Log de défense / batailles
- [ ] Système de revenge

### Phase 5 : Client & Launcher (1-2 semaines)

- [ ] Modifier le launcher pour l'auth Supabase (anonyme ou pseudo+mdp)
- [ ] Adapter le client pour pointer vers le serveur distant
- [ ] Gérer le passage du JWT dans les requêtes
- [ ] Tests end-to-end

---

## 5. Limitations & Considérations

### Limites du Tier Gratuit Supabase

| Ressource | Limite gratuite | Impact |
|-----------|----------------|--------|
| Base de données | 500 MB | Suffisant pour ~10K joueurs |
| Edge Functions | 500K invocations/mois | ~16K/jour, OK pour petit serveur |
| Bande passante | 5 GB/mois | Les réponses JSON sont légères |
| Auth | Illimité (anonyme) | ✅ Aucun coût |
| Realtime | 200 connexions simultanées | Pas nécessaire ici (REST) |

### Points d'Attention

1. **Anti-triche** : Le client original fait confiance au serveur. En online, il faut valider les résultats côté serveur.
2. **Latence** : Les Edge Functions ajoutent ~50-200ms par requête. Acceptable pour ce type de jeu (pas de temps réel).
3. **Données statiques** : Les `ShopSkuModifiers`, `ClientSettings`, loot tables, etc. sont des constantes — les mettre en cache ou en fichiers statiques.
4. **Format JSON** : Le jeu MQEL exige un **ordre spécifique des clés JSON** (FIFO map). S'assurer que les réponses respectent cet ordre.
5. **Certificats SSL** : Le client original patche libCURL pour ignorer les certificats. Avec un vrai serveur HTTPS (Supabase), ce patch n'est plus nécessaire.

---

## 6. Résumé

| Aspect | Solution |
|--------|----------|
| **Auth joueur** | Supabase Auth anonyme (gratuit, pas d'email) + upgrade pseudo/mdp optionnel |
| **Base de données** | PostgreSQL Supabase avec RLS |
| **API Backend** | Edge Functions Deno (1 routeur + handlers par service) |
| **Matchmaking PvP** | Requêtes SQL sur les châteaux publiés |
| **Persistance** | Tout en PostgreSQL (remplace les fichiers .json/.BB) |
| **Modification client** | Changer `server_url` + passer JWT via `-token` |
| **Coût** | Gratuit (tier free Supabase) pour ~10K joueurs |
