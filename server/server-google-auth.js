/**
 * MQFEL Server avec Auth Google/Supabase
 * 
 * Variables d'environnement requises:
 * - SUPABASE_URL: URL de ton projet Supabase
 * - SUPABASE_SERVICE_KEY: Service role key (pas anon!)
 * - PORT: Port du serveur (défaut: 8080)
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Supabase client avec SERVICE KEY (côté serveur)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware: Valider le token JWT
async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.query.token ||
                req.body?.Token;
  
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Erreur auth: ' + e.message });
  }
}

// ==================== ACCOUNT SERVICE ====================

app.post('/AccountService.hqs/Login', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  let { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!account) {
    // Nouveau joueur
    const { data: newAccount } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        email: req.user.email,
        display_name: req.user.user_metadata?.full_name || 'Héros',
        gold: 10000,
        crowns: 100,
        life_force: 1000
      })
      .select()
      .single();
    
    account = newAccount;
    
    // Héros de départ
    await supabase.from('heroes').insert({
      account_id: account.id,
      hero_type: 'Knight',
      name: 'Sir Starter',
      level: 1,
      experience: 0
    });
  }
  
  res.json({
    Result: {
      AccountId: account.id,
      DisplayName: account.display_name,
      Gold: account.gold,
      Crowns: account.crowns,
      LifeForce: account.life_force
    }
  });
});

// ==================== ACCOUNT INFORMATION SERVICE ====================

app.post('/AccountInformationService.hqs/GetAccountInformation', authenticateToken, async (req, res) => {
  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  res.json({
    Result: {
      AccountId: account.id,
      Nickname: account.display_name,
      LifeForce: account.life_force,
      Gold: account.gold,
      Crowns: account.crowns,
      AttackRating: account.attack_rating || 1000,
      DefenseRating: account.defense_rating || 1000,
      CreationDate: account.created_at,
      TutorialFlags: account.tutorial_flags || 0
    }
  });
});

app.post('/AccountInformationService.hqs/UpdateAccountGold', authenticateToken, async (req, res) => {
  const { GoldDelta } = req.body;
  
  const { data: account } = await supabase
    .from('accounts')
    .select('gold')
    .eq('user_id', req.user.id)
    .single();
  
  const newGold = Math.max(0, (account?.gold || 0) + GoldDelta);
  
  await supabase
    .from('accounts')
    .update({ gold: newGold })
    .eq('user_id', req.user.id);
  
  res.json({ Result: { Gold: newGold } });
});

// ==================== HERO SERVICE ====================

app.post('/HeroService.hqs/GetHeroes', authenticateToken, async (req, res) => {
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();
  
  const { data: heroes } = await supabase
    .from('heroes')
    .select('*')
    .eq('account_id', account.id);
  
  res.json({
    Result: {
      Heroes: (heroes || []).map(h => ({
        HeroId: h.id,
        HeroType: h.hero_type,
        Name: h.name,
        Level: h.level,
        Experience: h.experience,
        Equipment: h.equipment || {},
        Stats: h.stats || {}
      }))
    }
  });
});

app.post('/HeroService.hqs/CreateHero', authenticateToken, async (req, res) => {
  const { HeroType, Name } = req.body;
  
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();
  
  const { data: hero } = await supabase
    .from('heroes')
    .insert({
      account_id: account.id,
      hero_type: HeroType,
      name: Name,
      level: 1,
      experience: 0
    })
    .select()
    .single();
  
  res.json({
    Result: {
      HeroId: hero.id,
      HeroType: hero.hero_type,
      Name: hero.name,
      Level: 1
    }
  });
});

app.post('/HeroService.hqs/UpdateHeroExperience', authenticateToken, async (req, res) => {
  const { HeroId, ExperienceGained } = req.body;
  
  const { data: hero } = await supabase
    .from('heroes')
    .select('*')
    .eq('id', HeroId)
    .single();
  
  const newXP = (hero?.experience || 0) + ExperienceGained;
  const newLevel = Math.floor(newXP / 1000) + 1; // Simple: 1000 XP par level
  
  await supabase
    .from('heroes')
    .update({ experience: newXP, level: newLevel })
    .eq('id', HeroId);
  
  res.json({
    Result: {
      HeroId,
      Experience: newXP,
      Level: newLevel,
      LeveledUp: newLevel > hero.level
    }
  });
});

// ==================== CASTLE SERVICE ====================

app.post('/CastleService.hqs/GetCastle', authenticateToken, async (req, res) => {
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();
  
  let { data: castle } = await supabase
    .from('castles')
    .select('*')
    .eq('account_id', account.id)
    .single();
  
  if (!castle) {
    // Créer château par défaut
    const { data: newCastle } = await supabase
      .from('castles')
      .insert({
        account_id: account.id,
        name: 'Mon Château',
        rooms: [],
        validation_status: 'valid'
      })
      .select()
      .single();
    
    castle = newCastle;
  }
  
  res.json({
    Result: {
      CastleId: castle.id,
      Name: castle.name,
      Rooms: castle.rooms || [],
      ValidationStatus: castle.validation_status
    }
  });
});

app.post('/CastleService.hqs/SaveCastle', authenticateToken, async (req, res) => {
  const { CastleId, Rooms } = req.body;
  
  await supabase
    .from('castles')
    .update({ rooms: Rooms })
    .eq('id', CastleId);
  
  res.json({ Result: { Success: true } });
});

// ==================== INVENTORY SERVICE ====================

app.post('/InventoryService.hqs/GetInventory', authenticateToken, async (req, res) => {
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();
  
  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .eq('account_id', account.id);
  
  res.json({
    Result: {
      Items: (items || []).map(i => ({
        ItemId: i.id,
        ItemType: i.item_type,
        Quantity: i.quantity,
        Properties: i.properties || {}
      }))
    }
  });
});

app.post('/InventoryService.hqs/AddItem', authenticateToken, async (req, res) => {
  const { ItemType, Quantity, Properties } = req.body;
  
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();
  
  const { data: item } = await supabase
    .from('inventory')
    .insert({
      account_id: account.id,
      item_type: ItemType,
      quantity: Quantity || 1,
      properties: Properties || {}
    })
    .select()
    .single();
  
  res.json({ Result: { ItemId: item.id } });
});

// ==================== ATTACK SERVICE ====================

app.post('/AttackService.hqs/FindTarget', authenticateToken, async (req, res) => {
  // Pour l'instant, retourner un château PNJ
  res.json({
    Result: {
      TargetAccountId: 'npc-castle-1',
      TargetNickname: 'Château Gobelin',
      TargetRating: 1000,
      CastleData: {
        Rooms: [
          { RoomType: 'entrance', Position: { x: 0, y: 0 } },
          { RoomType: 'corridor', Position: { x: 1, y: 0 } },
          { RoomType: 'treasure', Position: { x: 2, y: 0 } }
        ]
      }
    }
  });
});

app.post('/AttackService.hqs/SubmitResult', authenticateToken, async (req, res) => {
  const { TargetAccountId, Success, GoldLooted, Duration } = req.body;
  
  const { data: account } = await supabase
    .from('accounts')
    .select('id, gold, attack_rating')
    .eq('user_id', req.user.id)
    .single();
  
  if (Success) {
    // Ajouter l'or
    await supabase
      .from('accounts')
      .update({ 
        gold: account.gold + GoldLooted,
        attack_rating: (account.attack_rating || 1000) + 10
      })
      .eq('id', account.id);
  }
  
  // Logger l'attaque
  await supabase.from('attack_logs').insert({
    attacker_id: account.id,
    target_id: TargetAccountId,
    success: Success,
    gold_looted: GoldLooted,
    duration: Duration
  });
  
  res.json({ Result: { Recorded: true } });
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🏰 MQFEL Server (Google Auth) running on port ${PORT}`);
  console.log(`📡 Supabase: ${process.env.SUPABASE_URL}`);
});