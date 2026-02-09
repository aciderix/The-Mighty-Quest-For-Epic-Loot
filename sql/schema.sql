-- ═══════════════════════════════════════════════════════════════
-- 🏰 MQFEL Database Schema for Supabase
-- ═══════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════
-- 🔧 FONCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Fonction de transfert d'or (attaques)
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
