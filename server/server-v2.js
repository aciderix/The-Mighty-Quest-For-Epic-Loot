/**
 * 🏰 MQFEL Server v2 - Supabase + Google Auth
 * 
 * Serveur complet pour The Mighty Quest For Epic Loot
 * Compatible avec le nouveau schéma de base de données
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// ══════════════════════════════════════════════════════════
// 🔧 CONFIGURATION
// ══════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fsrfzdbmpywtsifmlria.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Client pour les opérations utilisateur (respecte RLS)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client admin pour les opérations serveur (bypass RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sessions actives
const sessions = new Map();

// ══════════════════════════════════════════════════════════
// 🔐 AUTHENTIFICATION GOOGLE
// ══════════════════════════════════════════════════════════

app.post('/auth/google', async (req, res) => {
    const { idToken, accessToken } = req.body;
    
    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithIdToken({
            provider: 'google',
            token: idToken
        });
        
        if (authError) throw authError;
        
        const user = authData.user;
        console.log(`[AUTH] Google login: ${user.email}`);
        
        let { data: account, error: fetchError } = await supabaseAdmin
            .from('accounts')
            .select('*')
            .eq('google_id', user.id)
            .single();
        
        if (fetchError && fetchError.code === 'PGRST116') {
            console.log(`[AUTH] Creating new account for: ${user.email}`);
            
            const displayName = user.user_metadata?.full_name || 
                               user.email.split('@')[0] || 
                               `Player_${Date.now().toString(36)}`;
            
            const { data: newAccount, error: createError } = await supabaseAdmin
                .from('accounts')
                .insert({
                    id: user.id,
                    google_id: user.id,
                    email: user.email,
                    display_name: displayName,
                    avatar_id: Math.floor(Math.random() * 20) + 1
                })
                .select()
                .single();
            
            if (createError) throw createError;
            account = newAccount;
        }
        
        await supabaseAdmin
            .from('accounts')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', account.id);
        
        const sessionToken = crypto.randomBytes(32).toString('hex');
        sessions.set(sessionToken, {
            accountId: account.id,
            supabaseToken: authData.session.access_token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        });
        
        res.json({
            Result: 0,
            Token: sessionToken,
            Account: {
                Id: account.id,
                DisplayName: account.display_name,
                Email: account.email,
                AvatarId: account.avatar_id,
                GamerScore: account.gamer_score,
                LeagueId: account.league_id
            }
        });
        
    } catch (err) {
        console.error('[AUTH] Error:', err);
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🔑 MIDDLEWARE D'AUTHENTIFICATION
// ══════════════════════════════════════════════════════════

function authenticate(req, res, next) {
    const token = req.headers['x-auth-token'] || req.body.Token;
    const session = sessions.get(token);
    
    if (!session || session.expiresAt < Date.now()) {
        sessions.delete(token);
        return res.json({ Result: 401, Error: 'Session expired' });
    }
    
    req.accountId = session.accountId;
    req.supabaseToken = session.supabaseToken;
    next();
}

function getUserClient(req) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${req.supabaseToken}`
            }
        }
    });
}

// ══════════════════════════════════════════════════════════
// 👤 COMPTE & PROFIL
// ══════════════════════════════════════════════════════════

app.post('/AccountInformationService.hqs/GetAccountInfo', authenticate, async (req, res) => {
    try {
        const [accountRes, walletRes, heroesRes, castleRes, statsRes] = await Promise.all([
            supabaseAdmin.from('accounts').select('*').eq('id', req.accountId).single(),
            supabaseAdmin.from('wallets').select('*').eq('account_id', req.accountId).single(),
            supabaseAdmin.from('heroes').select('*').eq('account_id', req.accountId),
            supabaseAdmin.from('castles').select('*').eq('account_id', req.accountId).single(),
            supabaseAdmin.from('player_stats').select('*').eq('account_id', req.accountId).single()
        ]);
        
        res.json({
            Result: 0,
            Account: accountRes.data,
            Wallet: walletRes.data,
            Heroes: heroesRes.data || [],
            Castle: castleRes.data,
            Stats: statsRes.data
        });
        
    } catch (err) {
        console.error('[ACCOUNT] Error:', err);
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🦸 HÉROS
// ══════════════════════════════════════════════════════════

app.post('/HeroService.hqs/GetHeroes', authenticate, async (req, res) => {
    try {
        const { data: heroes, error } = await supabaseAdmin
            .from('heroes')
            .select('*')
            .eq('account_id', req.accountId);
        
        if (error) throw error;
        res.json({ Result: 0, Heroes: heroes });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

app.post('/HeroService.hqs/CreateHero', authenticate, async (req, res) => {
    const { specContainerId, displayName } = req.body;
    
    try {
        const { count } = await supabaseAdmin
            .from('heroes')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', req.accountId);
        
        if (count >= 4) {
            return res.json({ Result: 1, Error: 'Maximum 4 heroes allowed' });
        }
        
        const { data: hero, error } = await supabaseAdmin
            .from('heroes')
            .insert({
                account_id: req.accountId,
                spec_container_id: specContainerId,
                display_name: displayName
            })
            .select()
            .single();
        
        if (error) throw error;
        console.log(`[HERO] Created: ${displayName}`);
        res.json({ Result: 0, Hero: hero });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🏰 CHÂTEAU
// ══════════════════════════════════════════════════════════

app.post('/CastleService.hqs/GetCastle', authenticate, async (req, res) => {
    const { castleId } = req.body;
    
    try {
        let targetCastleId = castleId;
        if (!targetCastleId) {
            const { data: myCastle } = await supabaseAdmin
                .from('castles')
                .select('id')
                .eq('account_id', req.accountId)
                .single();
            targetCastleId = myCastle.id;
        }
        
        const { data, error } = await supabaseAdmin.rpc('get_full_castle', { 
            p_castle_id: targetCastleId 
        });
        
        if (error) throw error;
        res.json({ Result: 0, Castle: data });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// ⚔️ ATTAQUES
// ══════════════════════════════════════════════════════════

app.post('/AttackService.hqs/FindCastle', authenticate, async (req, res) => {
    try {
        const { data: castles, error } = await supabaseAdmin
            .from('attackable_castles')
            .select('*')
            .neq('account_id', req.accountId)
            .limit(10);
        
        if (error) throw error;
        if (!castles || castles.length === 0) {
            return res.json({ Result: 1, Error: 'No castles available' });
        }
        
        const castle = castles[Math.floor(Math.random() * castles.length)];
        
        res.json({
            Result: 0,
            Target: {
                AccountId: castle.account_id,
                DisplayName: castle.display_name,
                CastleId: castle.castle_id
            }
        });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🏆 LEADERBOARD
// ══════════════════════════════════════════════════════════

app.post('/LeaderboardService.hqs/GetLeaderboard', async (req, res) => {
    const { limit = 100 } = req.body;
    
    try {
        const { data: leaders, error } = await supabaseAdmin
            .from('leaderboard')
            .select('*')
            .order('gamer_score', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        res.json({ Result: 0, Leaderboard: leaders || [] });
        
    } catch (err) {
        res.json({ Result: 1, Error: err.message });
    }
});

// ══════════════════════════════════════════════════════════
// 🔧 UTILITAIRES
// ══════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0', database: 'supabase' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0', database: 'supabase' });
});

app.all('*', (req, res) => {
    console.log(`[UNIMPLEMENTED] ${req.method} ${req.path}`);
    res.json({ Result: 0 });
});

// ══════════════════════════════════════════════════════════
// 🚀 DÉMARRAGE
// ══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  🏰 MQFEL Server v2.0                                    ║
║  Running on http://localhost:${PORT}                        ║
║  📊 Database: Supabase PostgreSQL                        ║
║  🔐 Auth: Google OAuth                                   ║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;