/**
 * 🏰 MQFEL Server - Supabase Edition
 * 
 * Serveur avec persistence cloud pour The Mighty Quest For Epic Loot
 * Les joueurs peuvent récupérer leur progression sur n'importe quel PC
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// ══════════════════════════════════════════════════════════
// 🔧 CONFIGURATION SUPABASE
// ══════════════════════════════════════════════════════════
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://VOTRE_PROJET.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'votre-clé-anon';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Cache des sessions (token -> account_id)
const sessions = new Map();

// ══════════════════════════════════════════════════════════
// 🔐 AUTHENTIFICATION
// ══════════════════════════════════════════════════════════

// Login ou création de compte via Steam ID
app.post('/AccountService.hqs/SteamLogin', async (req, res) => {
    const { steamId, steamTicket, username } = req.body;
    
    console.log(`[AUTH] Steam login attempt: ${steamId}`);
    
    try {
        // Cherche le compte existant
        let { data: account, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('steam_id', steamId)
            .single();
        
        if (error && error.code === 'PGRST116') {
            // Compte inexistant → création
            console.log(`[AUTH] Creating new account for Steam ID: ${steamId}`);
            
            const { data: newAccount, error: createError } = await supabase
                .from('accounts')
                .insert({
                    steam_id: steamId,
                    username: username || `Player_${steamId.slice(-6)}`
                })
                .select()
                .single();
            
            if (createError) throw createError;
            account = newAccount;
            
            // Créer un héros par défaut
            await supabase.from('heroes').insert({
                account_id: account.id,
                name: 'Hero',
                class: 'Knight',
                is_active: true
            });
            
            // Créer un château vide
            await supabase.from('castles').insert({
                account_id: account.id,
                name: `Château de ${account.username}`
            });
            
        } else if (error) {
            throw error;
        }
        
        // Mettre à jour last_login
        await supabase
            .from('accounts')
            .update({ last_login: new Date().toISOString() })
            .eq('id', account.id);
        
        // Générer un token de session
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, account.id);
        
        console.log(`[AUTH] ✅ Login successful: ${account.username}`);
        
        res.json({
            Result: 0,
            Token: token,
            AccountId: account.id,
            Username: account.username,
            Message: account.created_at === account.last_login ? 
                'Bienvenue dans The Mighty Quest!' : 
                'Bon retour, aventurier!'
        });
        
    } catch (err) {
        console.error('[AUTH] Error:', err);
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 👤 COMPTE & PROFIL
// ══════════════════════════════════════════════════════════

app.post('/AccountInformationService.hqs/GetAccountInfo', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    try {
        const { data: account } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .single();
        
        const { data: heroes } = await supabase
            .from('heroes')
            .select('*')
            .eq('account_id', accountId);
        
        const { data: castle } = await supabase
            .from('castles')
            .select('*')
            .eq('account_id', accountId)
            .single();
        
        res.json({
            Result: 0,
            Account: {
                Id: account.id,
                Username: account.username,
                Gold: account.gold,
                LifeForce: account.life_force,
                Crowns: account.crowns,
                AttackRating: account.attack_rating,
                DefenseRating: account.defense_rating
            },
            Heroes: heroes.map(h => ({
                Id: h.id,
                Name: h.name,
                Class: h.class,
                Level: h.level,
                Experience: h.experience,
                IsActive: h.is_active,
                Equipment: h.equipment
            })),
            Castle: {
                Id: castle.id,
                Name: castle.name,
                Rooms: castle.rooms,
                Creatures: castle.creatures,
                Traps: castle.traps
            }
        });
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🦸 HÉROS
// ══════════════════════════════════════════════════════════

app.post('/HeroService.hqs/CreateHero', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { name, heroClass } = req.body;
    
    try {
        // Vérifie le nombre de héros (max 4)
        const { count } = await supabase
            .from('heroes')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', accountId);
        
        if (count >= 4) {
            return res.json({ Result: 1, Error: 'Maximum 4 heroes allowed' });
        }
        
        const { data: hero, error } = await supabase
            .from('heroes')
            .insert({
                account_id: accountId,
                name: name,
                class: heroClass,
                is_active: count === 0 // Premier héros = actif
            })
            .select()
            .single();
        
        if (error) throw error;
        
        console.log(`[HERO] Created: ${name} (${heroClass})`);
        res.json({ Result: 0, Hero: hero });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

app.post('/HeroService.hqs/UpdateHero', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { heroId, updates } = req.body;
    
    try {
        // Vérifie que le héros appartient au joueur
        const { data: hero } = await supabase
            .from('heroes')
            .select('*')
            .eq('id', heroId)
            .eq('account_id', accountId)
            .single();
        
        if (!hero) return res.json({ Result: 1, Error: 'Hero not found' });
        
        const { data: updated, error } = await supabase
            .from('heroes')
            .update(updates)
            .eq('id', heroId)
            .select()
            .single();
        
        if (error) throw error;
        res.json({ Result: 0, Hero: updated });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// Gagner de l'XP et level up
app.post('/HeroService.hqs/AddExperience', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { heroId, xp } = req.body;
    
    try {
        const { data: hero } = await supabase
            .from('heroes')
            .select('*')
            .eq('id', heroId)
            .eq('account_id', accountId)
            .single();
        
        if (!hero) return res.json({ Result: 1, Error: 'Hero not found' });
        
        const newXP = hero.experience + xp;
        const newLevel = calculateLevel(newXP);
        const leveledUp = newLevel > hero.level;
        
        const { data: updated } = await supabase
            .from('heroes')
            .update({ 
                experience: newXP, 
                level: newLevel,
                // Bonus de stats au level up
                health: hero.health + (leveledUp ? 10 : 0),
                damage: hero.damage + (leveledUp ? 2 : 0)
            })
            .eq('id', heroId)
            .select()
            .single();
        
        res.json({ 
            Result: 0, 
            Hero: updated, 
            LeveledUp: leveledUp,
            NewLevel: newLevel
        });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🏰 CHÂTEAU
// ══════════════════════════════════════════════════════════

app.post('/CastleService.hqs/SaveCastle', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { rooms, creatures, traps, name } = req.body;
    
    try {
        const updates = {
            updated_at: new Date().toISOString()
        };
        if (rooms) updates.rooms = rooms;
        if (creatures) updates.creatures = creatures;
        if (traps) updates.traps = traps;
        if (name) updates.name = name;
        
        const { data: castle, error } = await supabase
            .from('castles')
            .update(updates)
            .eq('account_id', accountId)
            .select()
            .single();
        
        if (error) throw error;
        
        console.log(`[CASTLE] Saved for account ${accountId}`);
        res.json({ Result: 0, Castle: castle });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

app.post('/CastleService.hqs/GetCastle', async (req, res) => {
    const { castleId, accountId: targetAccountId } = req.body;
    
    try {
        let query = supabase.from('castles').select('*, accounts(username)');
        
        if (castleId) {
            query = query.eq('id', castleId);
        } else if (targetAccountId) {
            query = query.eq('account_id', targetAccountId);
        }
        
        const { data: castle, error } = await query.single();
        if (error) throw error;
        
        res.json({
            Result: 0,
            Castle: {
                Id: castle.id,
                Name: castle.name,
                OwnerName: castle.accounts?.username,
                Rooms: castle.rooms,
                Creatures: castle.creatures,
                Traps: castle.traps,
                TimesAttacked: castle.times_attacked
            }
        });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// ⚔️ SYSTÈME D'ATTAQUE
// ══════════════════════════════════════════════════════════

// Trouver un château à attaquer (matchmaking)
app.post('/AttackService.hqs/FindCastle', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    try {
        // Récupère le rating du joueur
        const { data: player } = await supabase
            .from('accounts')
            .select('attack_rating')
            .eq('id', accountId)
            .single();
        
        // Trouve un château dans une fourchette de rating similaire
        // (pas son propre château)
        const { data: castles } = await supabase
            .from('castles')
            .select('*, accounts!inner(id, username, defense_rating)')
            .neq('account_id', accountId)
            .gte('accounts.defense_rating', player.attack_rating - 200)
            .lte('accounts.defense_rating', player.attack_rating + 200)
            .limit(10);
        
        if (!castles || castles.length === 0) {
            // Fallback: n'importe quel château
            const { data: anyCastle } = await supabase
                .from('castles')
                .select('*, accounts!inner(id, username, defense_rating)')
                .neq('account_id', accountId)
                .limit(1)
                .single();
            
            if (!anyCastle) {
                return res.json({ Result: 1, Error: 'No castles available' });
            }
            castles.push(anyCastle);
        }
        
        // Sélection aléatoire
        const castle = castles[Math.floor(Math.random() * castles.length)];
        
        res.json({
            Result: 0,
            Castle: {
                Id: castle.id,
                OwnerId: castle.accounts.id,
                OwnerName: castle.accounts.username,
                DefenseRating: castle.accounts.defense_rating,
                Rooms: castle.rooms,
                Creatures: castle.creatures,
                Traps: castle.traps
            }
        });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// Soumettre le résultat d'une attaque
app.post('/AttackService.hqs/SubmitResult', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { castleId, defenderId, result, goldLooted, timeTaken, replayData } = req.body;
    
    try {
        // Enregistre l'attaque
        await supabase.from('attack_history').insert({
            attacker_id: accountId,
            defender_id: defenderId,
            result: result,
            gold_looted: goldLooted || 0,
            time_taken: timeTaken,
            replay_data: replayData
        });
        
        if (result === 'victory') {
            // Donne l'or au vainqueur
            await supabase.rpc('transfer_gold', {
                from_account: defenderId,
                to_account: accountId,
                amount: goldLooted
            });
            
            // Met à jour les ratings (using raw SQL increment)
            const { data: attacker } = await supabase
                .from('accounts')
                .select('attack_rating')
                .eq('id', accountId)
                .single();
            
            await supabase
                .from('accounts')
                .update({ attack_rating: attacker.attack_rating + 25 })
                .eq('id', accountId);
            
            const { data: defender } = await supabase
                .from('accounts')
                .select('defense_rating')
                .eq('id', defenderId)
                .single();
            
            await supabase
                .from('accounts')
                .update({ defense_rating: Math.max(0, defender.defense_rating - 15) })
                .eq('id', defenderId);
            
            // Met à jour les stats du château
            const { data: castleData } = await supabase
                .from('castles')
                .select('times_attacked, gold_stolen')
                .eq('id', castleId)
                .single();
            
            await supabase
                .from('castles')
                .update({ 
                    times_attacked: castleData.times_attacked + 1,
                    gold_stolen: castleData.gold_stolen + goldLooted
                })
                .eq('id', castleId);
        }
        
        console.log(`[ATTACK] ${result}: ${accountId} vs ${defenderId}, ${goldLooted} gold`);
        res.json({ Result: 0, Message: 'Attack recorded' });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🎒 INVENTAIRE
// ══════════════════════════════════════════════════════════

app.post('/InventoryService.hqs/GetInventory', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    try {
        const { data: items } = await supabase
            .from('inventory')
            .select('*')
            .eq('account_id', accountId);
        
        res.json({ Result: 0, Items: items || [] });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

app.post('/InventoryService.hqs/AddItem', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { itemId, itemType, quantity, stats } = req.body;
    
    try {
        // Check if item already exists (stackable)
        const { data: existing } = await supabase
            .from('inventory')
            .select('*')
            .eq('account_id', accountId)
            .eq('item_id', itemId)
            .single();
        
        if (existing && ['consumable', 'material'].includes(itemType)) {
            // Stack the item
            const { data: updated } = await supabase
                .from('inventory')
                .update({ quantity: existing.quantity + (quantity || 1) })
                .eq('id', existing.id)
                .select()
                .single();
            
            return res.json({ Result: 0, Item: updated });
        }
        
        // Create new item
        const { data: item, error } = await supabase
            .from('inventory')
            .insert({
                account_id: accountId,
                item_id: itemId,
                item_type: itemType,
                quantity: quantity || 1,
                stats: stats || {}
            })
            .select()
            .single();
        
        if (error) throw error;
        res.json({ Result: 0, Item: item });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 💰 ÉCONOMIE
// ══════════════════════════════════════════════════════════

app.post('/CurrencyService.hqs/GetCurrencies', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    try {
        const { data: account } = await supabase
            .from('accounts')
            .select('gold, life_force, crowns')
            .eq('id', accountId)
            .single();
        
        res.json({
            Result: 0,
            Currencies: {
                Gold: account.gold,
                LifeForce: account.life_force,
                Crowns: account.crowns
            }
        });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

app.post('/CurrencyService.hqs/AddCurrency', async (req, res) => {
    const accountId = getAccountFromToken(req);
    if (!accountId) return res.json({ Result: 1, Error: 'Not authenticated' });
    
    const { currency, amount } = req.body;
    const validCurrencies = ['gold', 'life_force', 'crowns'];
    
    if (!validCurrencies.includes(currency)) {
        return res.json({ Result: 1, Error: 'Invalid currency' });
    }
    
    try {
        const { data: account } = await supabase
            .from('accounts')
            .select(currency)
            .eq('id', accountId)
            .single();
        
        const { data: updated } = await supabase
            .from('accounts')
            .update({ [currency]: account[currency] + amount })
            .eq('id', accountId)
            .select('gold, life_force, crowns')
            .single();
        
        res.json({ Result: 0, Currencies: updated });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🔧 UTILITAIRES
// ══════════════════════════════════════════════════════════

function getAccountFromToken(req) {
    const token = req.headers['x-auth-token'] || req.body.Token;
    return sessions.get(token);
}

function calculateLevel(xp) {
    // XP requis : 100 * level^1.5
    let level = 1;
    let xpRequired = 0;
    while (xpRequired <= xp) {
        level++;
        xpRequired += Math.floor(100 * Math.pow(level, 1.5));
    }
    return level - 1;
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'supabase' });
});

// ══════════════════════════════════════════════════════════
// 🚀 DÉMARRAGE
// ══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  🏰 MQFEL Server (Supabase Edition)                      ║
║  Running on http://localhost:${PORT}                        ║
║                                                          ║
║  📊 Database: Supabase PostgreSQL                        ║
║  💾 Persistence: Cloud (sync multi-PC)                   ║
╚══════════════════════════════════════════════════════════╝
    `);
});
