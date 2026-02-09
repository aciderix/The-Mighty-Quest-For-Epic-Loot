# 💾 Guide Persistence & Sauvegarde Cloud - MQFEL

## 🎯 Objectif
Permettre aux joueurs de récupérer leur progression sur n'importe quel PC.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MightyQuest    │────▶│  Node.js        │────▶│  Supabase       │
│  (Client)       │     │  Server         │     │  (PostgreSQL)   │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      Steam ID ────────────▶ Auth ─────────────▶ UUID Joueur
```

**Identification** : Le Steam ID (ou email) sert de clé unique pour retrouver le joueur.

---

## 📋 Étape 1 : Créer un projet Supabase

1. Va sur https://supabase.com et crée un compte gratuit
2. Crée un nouveau projet (nom : `mqfel-server`)
3. Note ton **URL** et ta **clé anon** dans les settings API

---

## 📋 Étape 2 : Créer les tables

Dans l'éditeur SQL de Supabase, exécute :

```sql
-- Table des comptes joueurs
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    steam_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW(),
    
    -- Devises
    gold BIGINT DEFAULT 10000,
    life_force BIGINT DEFAULT 1000,
    crowns BIGINT DEFAULT 100,
    attack_rating INTEGER DEFAULT 1000,
    defense_rating INTEGER DEFAULT 1000
);

-- Table des héros
CREATE TABLE heroes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    class TEXT NOT NULL CHECK (class IN ('Knight', 'Mage', 'Archer', 'Runaway')),
    level INTEGER DEFAULT 1,
    experience BIGINT DEFAULT 0,
    
    -- Stats
    health INTEGER DEFAULT 100,
    damage INTEGER DEFAULT 10,
    armor INTEGER DEFAULT 5,
    speed FLOAT DEFAULT 1.0,
    
    -- Équipement (JSON avec les IDs d'items)
    equipment JSONB DEFAULT '{}',
    
    -- Skills équipés
    skills JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des châteaux
CREATE TABLE castles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    name TEXT DEFAULT 'Mon Château',
    theme TEXT DEFAULT 'medieval',
    
    -- Layout des salles (JSON)
    rooms JSONB DEFAULT '[]',
    
    -- Monstres placés
    creatures JSONB DEFAULT '[]',
    
    -- Pièges placés
    traps JSONB DEFAULT '[]',
    
    -- Stats
    times_attacked INTEGER DEFAULT 0,
    times_defended INTEGER DEFAULT 0,
    gold_stolen BIGINT DEFAULT 0,
    gold_protected BIGINT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table d'inventaire
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL, -- weapon, armor, consumable, creature, trap
    quantity INTEGER DEFAULT 1,
    
    -- Stats de l'item (pour les items uniques/craftés)
    stats JSONB DEFAULT '{}',
    
    equipped_on UUID REFERENCES heroes(id),
    acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des attaques (historique)
CREATE TABLE attack_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_id UUID REFERENCES accounts(id),
    defender_id UUID REFERENCES accounts(id),
    
    castle_snapshot JSONB, -- État du château au moment de l'attaque
    
    result TEXT CHECK (result IN ('victory', 'defeat', 'abandoned')),
    gold_looted BIGINT DEFAULT 0,
    time_taken INTEGER, -- en secondes
    
    replay_data JSONB, -- Pour le replay
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_accounts_steam ON accounts(steam_id);
CREATE INDEX idx_heroes_account ON heroes(account_id);
CREATE INDEX idx_castles_account ON castles(account_id);
CREATE INDEX idx_inventory_account ON inventory(account_id);

-- Active Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE castles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Étape 3 : Fonction SQL pour transfert d'or

Ajoute cette fonction dans Supabase :

```sql
CREATE OR REPLACE FUNCTION transfer_gold(
    from_account UUID,
    to_account UUID,
    amount BIGINT
) RETURNS VOID AS $$
BEGIN
    -- Retire l'or au défenseur (minimum 0)
    UPDATE accounts 
    SET gold = GREATEST(0, gold - amount)
    WHERE id = from_account;
    
    -- Donne l'or à l'attaquant
    UPDATE accounts 
    SET gold = gold + amount
    WHERE id = to_account;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 Étape 4 : Lancer le serveur

```bash
cd server

# Installer les dépendances
npm install

# Configurer les variables d'environnement
export SUPABASE_URL="https://votre-projet.supabase.co"
export SUPABASE_KEY="votre-clé-anon"

# Lancer
node server-supabase.js
```

---

## 🔄 Comment ça marche pour les joueurs

```
┌─────────────────────────────────────────────────────────────┐
│ JOUEUR SUR PC #1                                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Lance MightyQuest.exe                                    │
│ 2. Le jeu envoie son Steam ID au serveur                    │
│ 3. Le serveur cherche dans Supabase: "Steam ID existe ?"    │
│    → NON: Crée un nouveau compte                            │
│    → OUI: Récupère toutes les données (héros, château...)   │
│ 4. Le joueur joue, ses actions sont sauvegardées en temps   │
│    réel dans Supabase                                       │
└─────────────────────────────────────────────────────────────┘

        ↓ Le joueur change de PC ↓

┌─────────────────────────────────────────────────────────────┐
│ JOUEUR SUR PC #2                                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Lance MightyQuest.exe (même Steam ID)                    │
│ 2. Le serveur reconnaît le Steam ID                         │
│ 3. Récupère instantanément: héros, château, inventaire...   │
│ 4. Le joueur continue où il en était! 🎉                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Sécurité

Le système est sécurisé car :
1. **Steam ID = identité** - Unique et vérifié par Steam
2. **Tokens de session** - Expirables et régénérables  
3. **Row Level Security** - Chaque joueur ne peut voir que SES données
4. **Pas de triche facile** - Les calculs critiques sont côté serveur

---

## 📊 Dashboard admin (bonus)

Supabase te donne un dashboard gratuit pour :
- Voir tous les joueurs inscrits
- Surveiller les statistiques
- Gérer les données manuellement
- Voir les logs en temps réel

---

## ❓ FAQ

**Q: Et si quelqu'un n'a pas Steam ?**
A: On peut ajouter un login email/password avec Supabase Auth

**Q: Combien ça coûte ?**
A: Gratuit jusqu'à 500MB de données et 2GB de transfert/mois

**Q: Et pour le mode hors-ligne ?**
A: On peut ajouter un cache local SQLite qui sync quand le joueur est connecté