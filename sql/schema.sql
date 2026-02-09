-- ============================================
-- 🎮 MQFEL - Schéma Base de Données Complet
-- Pour Supabase / PostgreSQL
-- ============================================

-- ============================================
-- 🔐 TABLE: accounts (Comptes joueurs)
-- ============================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id TEXT UNIQUE,                    -- ID Google OAuth
    email TEXT UNIQUE,
    display_name TEXT NOT NULL,
    display_name_validated_at TIMESTAMPTZ,
    avatar_id INTEGER DEFAULT 10,
    country_code TEXT DEFAULT 'FR',
    gamer_score INTEGER DEFAULT 0,
    privileges INTEGER DEFAULT 9,             -- 9=nouveau, 401=héros créé
    profanity_filtering BOOLEAN DEFAULT true,
    selected_hero_id INTEGER,
    league_id INTEGER DEFAULT 1,
    sub_league_id INTEGER DEFAULT 1,
    targeted_attack_count INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 💰 TABLE: wallets (Portefeuilles)
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    in_game_coin INTEGER DEFAULT 1000,        -- Or
    life_force INTEGER DEFAULT 0,             -- Force vitale
    blings INTEGER DEFAULT 0,                 -- Premium currency
    igc_capacity INTEGER DEFAULT 10000,       -- Capacité or
    life_force_capacity INTEGER DEFAULT 1000, -- Capacité force vitale
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id)
);

-- ============================================
-- 🦸 TABLE: heroes (Héros)
-- ============================================
CREATE TABLE heroes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    spec_container_id INTEGER NOT NULL,       -- 1=Knight, 2=Archer, 3=Mage, 4=Runaway
    display_name TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    
    -- Équipement (références vers items)
    mainhand_item_id UUID,
    offhand_item_id UUID,
    head_item_id UUID,
    body_item_id UUID,
    hands_item_id UUID,
    shoulders_item_id UUID,
    
    -- Skills
    unlocked_skills INTEGER[] DEFAULT '{}',
    equipped_skills INTEGER[] DEFAULT '{1,2,3}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 🎒 TABLE: items (Inventaire)
-- ============================================
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    spec_container_id INTEGER NOT NULL,       -- ID du type d'item
    archetype INTEGER,
    rank INTEGER DEFAULT 1,
    quantity INTEGER DEFAULT 1,
    is_new BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    item_type TEXT NOT NULL,                  -- HeroEquipmentItem, Consumable, etc.
    modifiers JSONB DEFAULT '[]',             -- Stats bonus
    enchantments JSONB DEFAULT '[]',
    slot_equipped TEXT,                       -- null si dans inventaire
    hero_id UUID REFERENCES heroes(id),       -- null si dans inventaire
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 🏰 TABLE: castles (Châteaux)
-- ============================================
CREATE TABLE castles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    theme_id INTEGER DEFAULT 22,
    level INTEGER DEFAULT 1,
    castle_heart_rank INTEGER DEFAULT 1,
    layout_id INTEGER DEFAULT 1,
    
    -- Stats
    total_construction_points INTEGER DEFAULT 0,
    max_construction_points INTEGER DEFAULT 55,
    win_ratio FLOAT DEFAULT 0.5,
    win_ratio_difficulty INTEGER DEFAULT 2,
    
    -- Indexes pour création
    room_next_index INTEGER DEFAULT 1,
    creature_next_index INTEGER DEFAULT 1,
    trap_next_index INTEGER DEFAULT 1,
    decoration_next_index INTEGER DEFAULT 1,
    trigger_next_index INTEGER DEFAULT 1,
    building_next_index INTEGER DEFAULT 1,
    
    -- Thèmes débloqués
    inventory_themes INTEGER[] DEFAULT '{22}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    modified_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(account_id)
);

-- ============================================
-- 🏠 TABLE: castle_rooms (Salles)
-- ============================================
CREATE TABLE castle_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    castle_id UUID REFERENCES castles(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL,                 -- ID interne dans le château
    spec_container_id INTEGER NOT NULL,       -- Type de salle
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    orientation INTEGER DEFAULT 0
);

-- ============================================
-- 👹 TABLE: castle_creatures (Monstres)
-- ============================================
CREATE TABLE castle_creatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES castle_rooms(id) ON DELETE CASCADE,
    creature_id INTEGER NOT NULL,             -- ID interne
    spec_container_id INTEGER NOT NULL,       -- Type de monstre
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    orientation INTEGER DEFAULT 0,
    room_zone_id INTEGER DEFAULT 1,
    tier INTEGER DEFAULT 1,
    aggro_offset_x FLOAT,
    aggro_offset_z FLOAT
);

-- ============================================
-- 🪤 TABLE: castle_traps (Pièges)
-- ============================================
CREATE TABLE castle_traps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES castle_rooms(id) ON DELETE CASCADE,
    trap_id INTEGER NOT NULL,
    spec_container_id INTEGER NOT NULL,       -- Type de piège
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    orientation INTEGER DEFAULT 0,
    room_zone_id INTEGER DEFAULT 1,
    power_supply_id INTEGER                   -- Référence à un autre piège/générateur
);

-- ============================================
-- 🖼️ TABLE: castle_decorations (Décos)
-- ============================================
CREATE TABLE castle_decorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES castle_rooms(id) ON DELETE CASCADE,
    decoration_id INTEGER NOT NULL,
    spec_container_id INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    orientation INTEGER DEFAULT 0,
    sku_code TEXT                             -- Pour items premium
);

-- ============================================
-- 🏗️ TABLE: castle_buildings (Bâtiments)
-- ============================================
CREATE TABLE castle_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES castle_rooms(id) ON DELETE CASCADE,
    building_id INTEGER NOT NULL,
    spec_container_id INTEGER NOT NULL,       -- Type (forge, mines, etc.)
    rank INTEGER DEFAULT 1,
    x INTEGER,
    y INTEGER,
    orientation INTEGER DEFAULT 0,
    room_zone_id INTEGER
);

-- ============================================
-- 📊 TABLE: player_stats (Statistiques)
-- ============================================
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    total_creatures_killed INTEGER DEFAULT 0,
    total_castles_looted INTEGER DEFAULT 0,
    total_items_looted INTEGER DEFAULT 0,
    total_potions_consumed INTEGER DEFAULT 0,
    total_igc_won INTEGER DEFAULT 0,
    
    castles_defeated_easy INTEGER DEFAULT 0,
    castles_defeated_medium INTEGER DEFAULT 0,
    castles_defeated_hard INTEGER DEFAULT 0,
    
    killed_creatures JSONB DEFAULT '{}',      -- {"1000": 5, "1001": 3}
    currency_accumulation JSONB DEFAULT '{}', -- {"IGC": 1000, "LifeForce": 500}
    
    UNIQUE(account_id)
);

-- ============================================
-- 🏆 TABLE: achievements (Succès)
-- ============================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, achievement_id)
);

-- ============================================
-- 📜 TABLE: quests (Quêtes/Assignments)
-- ============================================
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL,
    status INTEGER DEFAULT 0,                 -- 0=active, 1=en cours, 2=complete
    progress JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    UNIQUE(account_id, quest_id)
);

-- ============================================
-- ⚔️ TABLE: attacks (Historique attaques)
-- ============================================
CREATE TABLE attacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attack_id TEXT UNIQUE NOT NULL,           -- ID de l'attaque
    attacker_id UUID REFERENCES accounts(id),
    defender_id UUID REFERENCES accounts(id),
    
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    
    victory_condition INTEGER,                -- 0=échec, 1=3 étoiles, 2=2 étoiles, 3=1 étoile
    attack_type INTEGER,
    
    igc_looted INTEGER DEFAULT 0,
    life_force_looted INTEGER DEFAULT 0,
    items_looted JSONB DEFAULT '[]',
    
    replay_data BYTEA,                        -- Replay encodé
    
    rating INTEGER                            -- Note du château (1-5)
);

-- ============================================
-- 📬 TABLE: inbox (Messages)
-- ============================================
CREATE TABLE inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL,               -- attack_result, reward, system
    title TEXT,
    content JSONB,
    rewards JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 🔧 INDEXES pour performance
-- ============================================
CREATE INDEX idx_heroes_account ON heroes(account_id);
CREATE INDEX idx_items_account ON items(account_id);
CREATE INDEX idx_items_hero ON items(hero_id);
CREATE INDEX idx_castle_rooms_castle ON castle_rooms(castle_id);
CREATE INDEX idx_castle_creatures_room ON castle_creatures(room_id);
CREATE INDEX idx_castle_traps_room ON castle_traps(room_id);
CREATE INDEX idx_castle_decorations_room ON castle_decorations(room_id);
CREATE INDEX idx_castle_buildings_room ON castle_buildings(room_id);
CREATE INDEX idx_attacks_attacker ON attacks(attacker_id);
CREATE INDEX idx_attacks_defender ON attacks(defender_id);
CREATE INDEX idx_inbox_account ON inbox(account_id);
CREATE INDEX idx_achievements_account ON achievements(account_id);
CREATE INDEX idx_quests_account ON quests(account_id);

-- ============================================
-- 🔒 ROW LEVEL SECURITY (Supabase)
-- ============================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE castles ENABLE ROW LEVEL SECURITY;
ALTER TABLE castle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE castle_creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE castle_traps ENABLE ROW LEVEL SECURITY;
ALTER TABLE castle_decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE castle_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;

-- Politique: les joueurs ne voient que leurs données
CREATE POLICY "Users see own data" ON accounts
    FOR ALL USING (id = auth.uid());
    
CREATE POLICY "Users see own wallet" ON wallets
    FOR ALL USING (account_id = auth.uid());
    
CREATE POLICY "Users see own heroes" ON heroes
    FOR ALL USING (account_id = auth.uid());
    
CREATE POLICY "Users see own items" ON items
    FOR ALL USING (account_id = auth.uid());
    
CREATE POLICY "Users see own castle" ON castles
    FOR ALL USING (account_id = auth.uid());

CREATE POLICY "Users see own rooms" ON castle_rooms
    FOR ALL USING (
        castle_id IN (SELECT id FROM castles WHERE account_id = auth.uid())
    );

CREATE POLICY "Users see own stats" ON player_stats
    FOR ALL USING (account_id = auth.uid());

CREATE POLICY "Users see own achievements" ON achievements
    FOR ALL USING (account_id = auth.uid());

CREATE POLICY "Users see own quests" ON quests
    FOR ALL USING (account_id = auth.uid());

CREATE POLICY "Users see own inbox" ON inbox
    FOR ALL USING (account_id = auth.uid());

-- Politique: tout le monde peut voir les châteaux pour les attaquer
CREATE POLICY "Anyone can view castles for attacks" ON castles
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view castle rooms" ON castle_rooms
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view castle creatures" ON castle_creatures
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view castle traps" ON castle_traps
    FOR SELECT USING (true);

-- Politique: attaques visibles par attaquant et défenseur
CREATE POLICY "View own attacks" ON attacks
    FOR SELECT USING (
        attacker_id = auth.uid() OR defender_id = auth.uid()
    );

CREATE POLICY "Create attacks" ON attacks
    FOR INSERT WITH CHECK (attacker_id = auth.uid());

-- ============================================
-- 🔄 TRIGGERS pour auto-update
-- ============================================

-- Trigger pour mettre à jour wallet.updated_at
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_updated
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_timestamp();

-- Trigger pour mettre à jour castle.modified_at
CREATE OR REPLACE FUNCTION update_castle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER castle_updated
    BEFORE UPDATE ON castles
    FOR EACH ROW
    EXECUTE FUNCTION update_castle_timestamp();

-- Trigger pour créer automatiquement wallet, stats, castle après création compte
CREATE OR REPLACE FUNCTION create_account_dependencies()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer le wallet
    INSERT INTO wallets (account_id) VALUES (NEW.id);
    
    -- Créer les stats
    INSERT INTO player_stats (account_id) VALUES (NEW.id);
    
    -- Créer le château vide
    INSERT INTO castles (account_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_account_created
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_account_dependencies();

-- ============================================
-- 📊 VIEWS utiles
-- ============================================

-- Vue pour leaderboard
CREATE VIEW leaderboard AS
SELECT 
    a.id,
    a.display_name,
    a.avatar_id,
    a.gamer_score,
    a.league_id,
    c.level as castle_level,
    ps.total_castles_looted,
    c.win_ratio
FROM accounts a
JOIN castles c ON c.account_id = a.id
JOIN player_stats ps ON ps.account_id = a.id
WHERE a.privileges >= 401
ORDER BY a.gamer_score DESC;

-- Vue pour sélection de châteaux à attaquer
CREATE VIEW attackable_castles AS
SELECT 
    a.id as account_id,
    a.display_name,
    a.avatar_id,
    c.id as castle_id,
    c.level as castle_level,
    c.theme_id,
    c.castle_heart_rank,
    c.win_ratio,
    c.win_ratio_difficulty,
    c.modified_at as last_published
FROM accounts a
JOIN castles c ON c.account_id = a.id
WHERE a.privileges >= 401
  AND c.level >= 1;
