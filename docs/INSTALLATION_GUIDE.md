# 🚀 Guide d'Installation Complet - MQFEL Revival

## 📋 Ce qu'il faut savoir

**Le jeu n'utilise PAS de fichier Game.ini pour les URLs !**

Les URLs serveur sont définies par :
1. Arguments de ligne de commande (`-server_url`)
2. Interception DLL (Localnetworking)

---

## 🎯 Option A : Installation Rapide (DLL Interception)

C'est la méthode utilisée par MQELOffline_cpp. Elle intercepte le trafic réseau pour le rediriger vers un serveur local.

### Étape 1 : Télécharger les DLLs

```powershell
# Structure requise dans le dossier du jeu
📁 The Mighty Quest For Epic Loot/
├── MightyQuest.exe
├── steam_api.dll              # ← Remplacer par Platformwrapper
├── Localbootstrap.dll         # ← Ajouter (charge les plugins)
└── 📁 Plugins/
    ├── Localnetworking.ayria32    # ← Intercepte réseau
    └── MQELOffline.LN32           # ← Serveur REST
```

### Projets à compiler :

| Projet | URL | Rôle |
|--------|-----|------|
| **Platformwrapper** | https://github.com/Convery/Platformwrapper_cpp | Bypass Steam |
| **Bootstrapmodule** | https://github.com/AyriaPublic/Bootstrapmodule_cpp | Charge les plugins |
| **Localnetworking** | https://github.com/Hedgehogscience/Localnetworking_cpp | Intercepte réseau |
| **MQELOffline** | https://github.com/Hedgehogscience/MQELOffline_cpp | Serveur REST |

### Étape 2 : Lancer le jeu

```bash
./MightyQuest.exe \
  -server_url https://Gameserver \
  -environmentName mqel-live \
  -branchName mqel \
  -steamid 76561201696194782 \
  -steamticket "" \
  -token ""
```

---

## 🎯 Option B : Serveur Cloud (Notre Solution)

Plus moderne, plus facile à maintenir, multi-PC.

### Étape 1 : Déployer le serveur

#### Via Railway (gratuit)
```bash
# 1. Fork le repo
https://github.com/aciderix/The-Mighty-Quest-For-Epic-Loot

# 2. Crée un compte Railway
https://railway.app

# 3. Nouveau projet → Deploy from GitHub repo
# 4. Sélectionne le dossier /server
# 5. Ajoute les variables d'environnement :
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_SERVICE_KEY=ta-cle-service

# 6. Tu obtiens une URL genre :
https://mqfel-server.railway.app
```

#### Via Render (gratuit)
```bash
# Même principe, sur render.com
```

### Étape 2 : Configurer Supabase

1. Crée un projet sur https://supabase.com
2. SQL Editor → Copie-colle `sql/schema.sql`
3. Authentication → Providers → Active **Google**
4. Configure Google Cloud Console OAuth

### Étape 3 : Rediriger le jeu

**Option 3a : Fichier hosts (simple)**
```
# C:\Windows\System32\drivers\etc\hosts
# Ajoute :
127.0.0.1 gameserver.themightyquest.com
```

Puis lance un proxy local qui forward vers ton serveur cloud.

**Option 3b : Platformwrapper + Config**

Utilise Goldberg Steam Emulator + modifie les hooks pour pointer vers ton serveur :
```
https://mqfel-server.railway.app
```

**Option 3c : Notre Launcher Electron**

Le launcher qu'on a créé (`/launcher/`) gère tout automatiquement :
- Auth Google
- Injection des arguments
- Lancement du jeu

---

## 📡 APIs REST du jeu

Le jeu appelle ces endpoints (format : `POST /ServiceName.hqs/MethodName`)

### Authentification
```
POST /AccountService.hqs/SignIn
POST /AccountService.hqs/SignOut
POST /AccountService.hqs/GetAuthorizationToken
```

### Compte joueur
```
POST /AccountInformationService.hqs/GetInfo
POST /AccountInformationService.hqs/GetWallet
POST /AccountInformationService.hqs/SetEmail
```

### Héros
```
POST /HeroService.hqs/GetHeroes
POST /HeroService.hqs/CreateHero
POST /HeroService.hqs/SelectHero
POST /HeroService.hqs/LevelUp
POST /HeroService.hqs/EquipItem
```

### Château
```
POST /CastleService.hqs/GetCastle
POST /CastleService.hqs/SaveCastle
POST /CastleService.hqs/PublishCastle
POST /CastleService.hqs/ValidateCastle
```

### Combat / Attaque
```
POST /AttackService.hqs/GetCastlePool
POST /AttackService.hqs/StartAttack
POST /AttackService.hqs/CompleteAttack
POST /AttackService.hqs/GetReplay
```

### Inventaire
```
POST /InventoryService.hqs/GetItems
POST /InventoryService.hqs/BuyItem
POST /InventoryService.hqs/SellItem
POST /InventoryService.hqs/OpenChest
```

### Matchmaking
```
POST /MatchmakingService.hqs/GetLeaderboard
POST /MatchmakingService.hqs/GetRankings
```

---

## 🗄️ Structure de la Base de Données

### Tables principales

```sql
-- Joueurs
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  google_id TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ
);

-- Monnaies
CREATE TABLE wallets (
  account_id UUID PRIMARY KEY REFERENCES accounts(id),
  gold BIGINT DEFAULT 1000,
  life_force BIGINT DEFAULT 100,
  crowns INTEGER DEFAULT 0
);

-- Héros
CREATE TABLE heroes (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  hero_class TEXT, -- Archer, Knight, Mage, Runaway
  level INTEGER DEFAULT 1,
  xp BIGINT DEFAULT 0,
  equipment JSONB,
  skills JSONB
);

-- Châteaux
CREATE TABLE castles (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  castle_data JSONB, -- Layout complet des salles
  is_published BOOLEAN DEFAULT FALSE,
  attack_rating INTEGER DEFAULT 1000,
  defense_rating INTEGER DEFAULT 1000
);

-- Inventaire
CREATE TABLE items (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  item_template_id TEXT,
  quantity INTEGER DEFAULT 1,
  stats JSONB
);
```

---

## ✅ Checklist de mise en route

### Pour les développeurs :
- [ ] Compiler les 4 projets C++ (Platformwrapper, Bootstrapmodule, Localnetworking, MQELOffline)
- [ ] Créer les DLLs 32-bit
- [ ] Tester en local

### Pour notre solution cloud :
- [ ] Créer compte Supabase
- [ ] Exécuter schema.sql
- [ ] Configurer Google OAuth
- [ ] Déployer serveur sur Railway/Render
- [ ] Tester le launcher

### Pour les joueurs (version finale) :
- [ ] Télécharger le launcher
- [ ] Se connecter avec Google
- [ ] Cliquer "JOUER"

---

## 🐛 Problèmes courants

### "Impossible de se connecter au serveur"
→ Vérifie que Localnetworking intercepte bien les appels
→ Ou que ton `-server_url` pointe vers le bon serveur

### "Steam doit être lancé"
→ Tu n'as pas remplacé steam_api.dll par Platformwrapper

### "Le jeu crash au démarrage"
→ Vérifie que les DLLs sont en 32-bit (le jeu est 32-bit)

### "Mes données ne sont pas sauvegardées"
→ Vérifie la connexion Supabase (variables d'environnement)

---

## 📚 Ressources

- **MQELOffline original** : https://github.com/Hedgehogscience/MQELOffline_cpp
- **Platformwrapper** : https://github.com/Convery/Platformwrapper_cpp
- **Goldberg Steam Emulator** : https://gitlab.com/Mr_Goldberg/goldberg_emulator
- **Supabase** : https://supabase.com
- **Notre repo** : https://github.com/aciderix/The-Mighty-Quest-For-Epic-Loot
