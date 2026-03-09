# 🎮 The Mighty Quest For Epic Loot — Étude de Faisabilité Port Web / Mobile

## 1. Découvertes Clés du Repo

### 🔥 BONNE NOUVELLE : L'UI est déjà Web !

L'analyse du repo révèle une architecture hybride fascinante :

| Composant | Technologie | Réutilisable ? |
|-----------|------------|----------------|
| **UI complète** | HTML/CSS/JS via CEF (Chromium) | ✅ **90% réutilisable** |
| **346 fichiers JS** | jQuery 1.7.2 + architecture MVC custom | ✅ Adaptable |
| **120 fichiers CSS** | Modules thématiques complets | ✅ Réutilisable |
| **8 003 images PNG** | Icônes items, héros, créatures, UI | ✅ **Directement utilisable** |
| **Moteur 3D** | Propriétaire Ubisoft (DirectX) | ❌ Non réutilisable |
| **52 fichiers BFPC** | Archives propriétaires (3D, sons) | ❌ Non extractible |
| **Audio (Bink/EAX)** | Format propriétaire | ❌ Non réutilisable |
| **Scripts TSC** | Bytecode compilé propriétaire | ❌ Non lisible |
| **Backend C++** | DLL hook local (14 endpoints) | ✅ Logique transposable |

### Architecture Originale du Jeu

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Original (PC)                         │
│                                                                 │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐ │
│  │  Moteur 3D   │    │  CEF Browser  │    │   Bink Video     │ │
│  │  (DirectX)   │◄──►│  (HTML/CSS/JS)│    │   (Cinematics)   │ │
│  │              │    │              │    │                  │ │
│  │  • Rendu 3D  │    │  • Lobby     │    │  • Intro         │ │
│  │  • Combat    │    │  • Inventory │    │  • Logo Ubisoft  │ │
│  │  • Physique  │    │  • Shop      │    └──────────────────┘ │
│  │  • Animations│    │  • Castle    │                         │
│  │  • Particules│    │  • HUD       │                         │
│  └──────┬───────┘    │  • Chat      │                         │
│         │            │  • Forge     │                         │
│         │            │  • Profile   │                         │
│   ┌─────▼───────┐    └──────┬───────┘                         │
│   │  BFPC Files │           │                                 │
│   │  (3D assets)│    ┌──────▼───────┐                         │
│   │  204KB stubs│    │ hyperquest   │                         │
│   └─────────────┘    │ Client.*     │ ← Bridge JS↔C++ (110   │
│                      │ (bridge)     │   méthodes)             │
│                      └──────┬───────┘                         │
│                             │                                 │
│                      ┌──────▼───────┐                         │
│                      │ MQELOffline  │                         │
│                      │ (DLL C++)    │                         │
│                      │ 14 endpoints │                         │
│                      └──────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Le Bridge `hyperquestClient.*` — 110 méthodes

Le JS communique avec le C++ via un objet `hyperquestClient` injecté par CEF. Voici les catégories :

| Domaine | Méthodes | Exemples |
|---------|----------|----------|
| **Account** | 2 | `account_getUiCache` |
| **Attack** | 7 | `attack_getHeroInfo`, `attack_requestLeaveAttack` |
| **Attack Selection** | 5 | `attackSelection_getAttackRegions`, `scrollCamera` |
| **Build (château)** | 7 | `build_getBuildModel`, `getCastleValidityState` |
| **Building** | 5 | `building_getBuildingInfoModel`, `getUpgradePopup` |
| **Castle Inventory** | 3 | `getCastleInventory`, `getCreatureSpecialization` |
| **Chat** | 3 | `chat_sendRoomMessage`, `sendPrivateMessage` |
| **Consumable** | 3 | `consumable_getEquippedConsumables` |
| **Forge** | 1 | `forge_getForgedItemTooltip` |
| **Friendship** | 8 | `sendFriendshipInvitation`, `getFriendsList` |
| **Harvesting** | 1 | `harvesting_getHarvestingModel` |
| **Hero** | 3 | `hero_getHeroList`, `getHeroStats` |
| **Hero Inventory** | 4 | `getEquippedItems`, `getTooltipByItemSlot` |
| **Inventory** | 2 | `getInventoryModel`, `getTooltipBySlotIndex` |
| **Lobby** | 5 | `lobby_getLobbyBarModel`, `frameLoaded` |
| **Navigation** | 5 | `navigation_requestNavigation`, `panelOpenReady` |
| **Objective** | 4 | `getAllObjectives`, `setViewed` |
| **Profile** | 7 | `profile_getMyProfile`, `searchUser` |
| **Replay** | 2 | `replay_getReplayInfo` |
| **Seasonal** | 2 | `getSeasonalCompetition` |
| **Shop** | 5 | `shop_getProducts`, `getCategoryConfig` |
| **Spell** | 5 | `spell_getEquippedSpells`, `getSpellFamilies` |
| **Wallet** | 1 | `wallet_getWalletSummary` |
| **Audio** | 1 | `audio_play` |
| **Others** | 7 | `avatar`, `theme`, `buff`, `news`, `messaging` |

### Inventaire des Assets Graphiques 2D Utilisables

| Catégorie | Quantité | Résolutions disponibles |
|-----------|----------|------------------------|
| Décorations château | 261 | 96×96, 200×200, 330×192 |
| Drapeaux (pays) | 242 | Petits |
| Icônes créatures (rares) | 150 | 96×96, 200×200, 330×192 |
| Boutons catégories | 138 | Variable |
| Icônes bâtiments | 203 | Shop + Inventaire |
| Icônes animaux/pets | 198 | 96×96, 200×200, 330×192 |
| Icônes consommables | 96 | 96×96, 200×200, 330×192 |
| Icônes spécialisations | 96 | Variable |
| Skills héros | 160+ | Variable |
| Icônes créatures (undead) | 93 | Variable |
| Icônes déco (shop) | 172 | Variable |
| Icônes rooms | 160 | Shop + Inventaire |
| Items héro001 (par slot) | ~330 | 96×96, 200×200, 330×192 |
| Items héros communs (ring) | 75 | 96×96, 200×200, 330×192 |
| Matériaux crafting | 138 | 96×96, 200×200, 330×192 |
| Icônes pièges (rares) | 66 | 96×96, 200×200, 330×192 |
| Icônes créatures (bosses) | 69 | 96×96, 200×200, 330×192 |
| UI Elements (HUD, menus) | ~2000+ | Variable |
| **TOTAL** | **~8 000 PNG** | — |

---

## 2. Ce Qu'il Faut Recréer (Ce Qui Manque)

| Élément Manquant | Impact | Difficulté |
|-----------------|--------|------------|
| **Rendu 3D des donjons** | Cœur du gameplay | 🔴 Critique |
| **Animations de combat** | Gameplay | 🔴 Critique |
| **Modèles 3D** (héros, créatures, châteaux) | Visuel | 🔴 Critique |
| **Audio** (musiques, SFX) | Ambiance | 🟡 Important |
| **Effets de particules** | Polish | 🟡 Important |
| **Physique** (collisions, pathfinding) | Combat | 🔴 Critique |
| **IA des créatures** | Gameplay | 🟡 Important |
| **Système de formules** (dégâts, stats) | Gameplay | 🟢 Faisable (données dans settings.bin) |

---

## 3. Les 4 Options de Port

### Option A : Port 3D Complet (Three.js / Babylon.js)

```
Fidélité : ★★★★★    Effort : ★★★★★    Coût : $$$$$
Durée : 12-18 mois (équipe)
```

**Principe :** Recréer le jeu en 3D dans le navigateur avec Three.js ou Babylon.js.

| Pour | Contre |
|------|--------|
| Fidèle à l'original | Tous les modèles 3D à recréer |
| Fonctionne web + mobile | Animations 3D = énorme travail |
| Techniquement impressionnant | Performance sur mobile faible |
| | Besoin d'artistes 3D |
| | Budget réaliste : 50-100K€+ |

**Stack technique :**
- Babylon.js (meilleur support mobile)
- WebGL 2.0 / WebGPU
- Web Workers pour la physique
- IndexedDB pour le cache d'assets

### Option B : Port 2.5D Isométrique (PixiJS) ⭐ RECOMMANDÉ

```
Fidélité : ★★★☆☆    Effort : ★★★☆☆    Coût : $$
Durée : 4-6 mois (solo/duo)
```

**Principe :** Convertir le jeu en vue isométrique 2.5D avec sprites, en réutilisant les 8000+ PNG existants.

| Pour | Contre |
|------|--------|
| Réutilise ~80% des assets existants | Pas fidèle au rendu 3D original |
| Performance excellente web + mobile | Animations sprites à créer |
| UI web existante réutilisable à 90% | Style visuel différent |
| Développement solo faisable | |
| Petit budget suffisant | |

**Stack technique :**
```
Frontend (Web) :
├── PixiJS 8              → Rendu 2D/isométrique haute performance
├── PixiJS Spine          → Animations squelettiques 2D
├── React 19 + Vite       → UI (menus, inventaire, shop)
├── Existing CSS modules  → Réutilisation directe du CSS du jeu
├── Howler.js             → Audio
└── Supabase JS SDK       → Backend

Mobile (optionnel) :
├── Capacitor.js          → Wrapper natif iOS/Android
└── Même codebase web     → Zero réécriture
```

**Architecture proposée :**
```
┌──────────────────────────────────────────────────────────┐
│                    Application Web                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │  PixiJS 8    │    │  React UI    │   │ Supabase    │ │
│  │  (Canvas)    │    │  (Overlay)   │   │ Client SDK  │ │
│  │              │    │              │   │             │ │
│  │ • Carte iso  │    │ • Lobby      │   │ • Auth      │ │
│  │ • Sprites    │    │ • Inventaire │   │ • Realtime  │ │
│  │ • Combat     │    │ • Shop       │   │ • DB        │ │
│  │ • Pathfinding│    │ • Castle     │   │ • Storage   │ │
│  │ • Particules │    │ • Chat       │   │             │ │
│  └──────────────┘    └──────────────┘   └──────┬──────┘ │
│                                                │        │
│  ┌─────────────────────────────────────────────┘        │
│  │  Bridge Layer (remplace hyperquestClient.*)           │
│  │  → 110 méthodes → Supabase queries                   │
│  └───────────────────────────────────────────────────────┘
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Capacitor.js (optionnel)                            │ │
│  │  → iOS App Store / Google Play                       │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Option C : Version Simplifiée / Idle-RPG ⭐ LE PLUS RAPIDE

```
Fidélité : ★★☆☆☆    Effort : ★★☆☆☆    Coût : $
Durée : 2-3 mois (solo)
```

**Principe :** Garder les mécaniques de castle building + gestion héros, mais simplifier le combat en auto-battle/idle (comme le spin-off mobile d'Ubisoft).

| Pour | Contre |
|------|--------|
| Le plus rapide à développer | Perd le gameplay action original |
| Parfait pour mobile | Moins immersif |
| Léger en ressources | Fans pourraient être déçus |
| UI existante presque directement | |
| Un seul dev peut le faire | |

**Stack technique :**
```
Frontend :
├── React + Tailwind       → UI complète
├── Canvas 2D simple       → Visualisation combat auto
├── Existing 8000 PNG      → Tout le contenu visuel
└── Supabase JS SDK        → Backend

Mobile :
├── React Native           → iOS + Android
└── ou Capacitor.js        → Web wrapper
```

### Option D : Moteur de Jeu (Godot / Unity WebGL)

```
Fidélité : ★★★★☆    Effort : ★★★★☆    Coût : $$$
Durée : 8-12 mois (solo/duo)
```

**Principe :** Recréer le jeu dans Godot ou Unity, puis exporter en WebGL + mobile natif.

| Pour | Contre |
|------|--------|
| Meilleur rendu 3D possible | Temps de chargement WebGL lourd |
| Export multi-plateforme natif | Build mobile > 100MB |
| Outils de level design intégrés | Apprentissage moteur nécessaire |
| Physique/IA incluses | Unity WebGL = performances moyennes |

| | Godot 4 | Unity 2023 |
|--|---------|------------|
| **Export Web** | ✅ Léger (~10MB loader) | 🟡 Lourd (~30MB+) |
| **Export Mobile** | ✅ Natif | ✅ Natif |
| **3D** | Bon | Excellent |
| **Coût** | Gratuit open-source | Gratuit < $200K rev |
| **Communauté** | Grande, croissante | Massive |
| **Langage** | GDScript / C# | C# |

---

## 4. Comparatif Final

| Critère | A: 3D Web | B: 2.5D Iso ⭐ | C: Idle/Auto ⭐ | D: Godot/Unity |
|---------|-----------|---------------|----------------|----------------|
| **Temps solo** | 18+ mois | 4-6 mois | 2-3 mois | 8-12 mois |
| **Budget** | 50-100K€ | 0-5K€ | 0€ | 0-10K€ |
| **Réutilisation assets** | 30% | 80% | 90% | 40% |
| **Réutilisation UI JS** | 60% | 85% | 90% | 10% |
| **Performance mobile** | Mauvaise | Excellente | Excellente | Bonne |
| **Fidélité original** | Haute | Moyenne | Faible | Moyenne-Haute |
| **Fun factor** | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| **Jouable navigateur** | ✅ | ✅ | ✅ | ✅ (lent) |
| **Jouable mobile** | 🟡 | ✅ | ✅ | ✅ |
| **Compatible Supabase** | ✅ | ✅ | ✅ | ✅ |

---

## 5. Recommandation : Option B (2.5D Isométrique)

### Pourquoi ?

1. **Le sweet spot** entre fidélité et faisabilité
2. **8 003 images PNG** directement réutilisables → pas besoin d'artiste
3. **L'UI HTML/CSS/JS existante** peut être adaptée en React avec 85% du code
4. **PixiJS** est ultra performant sur mobile (60fps même sur vieux téléphones)
5. **Capacitor.js** transforme le site web en app mobile en 1 jour
6. **Supabase** s'intègre parfaitement avec un frontend JS

### Plan d'Implémentation (Option B)

#### Phase 1 — Fondations (Semaine 1-2)
```
✅ Setup projet Vite + React + PixiJS + Supabase
✅ Auth anonyme Supabase (pas d'email)
✅ Schema PostgreSQL (repris du rapport précédent)
✅ Migration des 8000 PNG vers Supabase Storage
✅ Bridge Layer : stub des 110 méthodes hyperquestClient
```

#### Phase 2 — Lobby & Gestion (Semaine 3-5)
```
✅ Portage du lobby (adaptation CSS existant)
✅ Écran de sélection de héro (Knight, Archer, Mage)
✅ Inventaire héros (équipement, stats)
✅ Shop (achat items, créatures, déco)
✅ Forge (craft d'items)
✅ Wallet (Gold, Life Force, Bling Bling)
```

#### Phase 3 — Castle Building (Semaine 6-8)
```
✅ Grille isométrique pour les rooms (PixiJS)
✅ Drag & drop créatures et pièges
✅ Système de rooms thématiques (30 thèmes !)
✅ Validation château (nombre de salles, chemin valide)
✅ Récolte (harvesting) automatique
✅ Upgrade bâtiments
```

#### Phase 4 — Combat 2.5D (Semaine 9-12)
```
✅ Rendu isométrique du donjon
✅ Pathfinding A* sur grille
✅ Système de combat temps réel simplifié
✅ Sorts et compétences (Spine 2D animations)
✅ IA créatures (patterns d'attaque)
✅ Boss fights
✅ Système de loot
```

#### Phase 5 — Social & Online (Semaine 13-14)
```
✅ Matchmaking PvP (attaquer les châteaux d'autres joueurs)
✅ Classements (Supabase Realtime)
✅ Chat (Supabase Realtime)
✅ Profils publics
✅ Système d'amis
✅ Battle log
```

#### Phase 6 — Mobile (Semaine 15-16)
```
✅ Adaptation contrôles tactiles (touch events)
✅ UI responsive (CSS media queries)
✅ Capacitor.js wrapping
✅ PWA (Progressive Web App) en parallèle
✅ Tests iOS + Android
✅ Publication
```

### Le Remplacement du Bridge `hyperquestClient`

Le cœur de l'adaptation est de remplacer les 110 méthodes du bridge C++ par des appels Supabase. Voici le mapping :

```typescript
// Avant (C++ bridge via CEF) :
hyperquestClient.hero_getHeroList(callbackId);

// Après (Supabase) :
class HeroController {
  async getHeroList(): Promise<HeroModel[]> {
    const { data } = await supabase
      .from('heroes')
      .select('*')
      .eq('account_id', userId);
    return data.map(formatHero);
  }
}
```

```typescript
// Avant :
hyperquestClient.inventory_getInventoryModel(callbackId);

// Après :
class InventoryController {
  async getInventoryModel(): Promise<InventoryModel> {
    const { data } = await supabase
      .from('equipment')
      .select('*, effects(*)')
      .eq('hero_id', heroId)
      .eq('is_equipped', false);
    return { items: data, capacity: MAX_INVENTORY };
  }
}
```

```typescript
// Avant :
hyperquestClient.build_getBuildModel(callbackId);

// Après :
class BuildController {
  async getBuildModel(): Promise<BuildModel> {
    const { data: castle } = await supabase
      .from('castles')
      .select('*, rooms(*, creatures(*), traps(*))')
      .eq('account_id', userId)
      .single();
    return formatCastleModel(castle);
  }
}
```

---

## 6. Architecture Technique Détaillée (Option B)

```
┌─ Frontend (Hébergé sur Vercel/Netlify/Supabase) ────────┐
│                                                          │
│  src/                                                    │
│  ├── main.tsx                  → Entry point             │
│  ├── App.tsx                   → Router principal         │
│  │                                                       │
│  ├── engine/                   → Moteur de jeu PixiJS    │
│  │   ├── IsometricRenderer.ts  → Rendu carte iso         │
│  │   ├── CombatSystem.ts       → Logique combat          │
│  │   ├── Pathfinding.ts        → A* sur grille iso       │
│  │   ├── ParticleSystem.ts     → Effets visuels          │
│  │   ├── SpriteManager.ts      → Gestion sprites/anims   │
│  │   └── CastleBuilder.ts      → Éditeur de château      │
│  │                                                       │
│  ├── controllers/              → Remplacement du bridge   │
│  │   ├── AccountController.ts                            │
│  │   ├── HeroController.ts                               │
│  │   ├── AttackController.ts                             │
│  │   ├── BuildController.ts                              │
│  │   ├── InventoryController.ts                          │
│  │   ├── ShopController.ts                               │
│  │   ├── ForgeController.ts                              │
│  │   ├── ChatController.ts                               │
│  │   └── ... (18 controllers)                            │
│  │                                                       │
│  ├── ui/                       → React UI (adapté du CSS) │
│  │   ├── lobby/                → Lobby principal          │
│  │   ├── inventory/            → Grille inventaire        │
│  │   ├── shop/                 → Boutique                 │
│  │   ├── build/                → Castle builder           │
│  │   ├── attack/               → HUD combat              │
│  │   ├── forge/                → Forge                    │
│  │   ├── profile/              → Profil joueur            │
│  │   ├── chat/                 → Chat temps réel          │
│  │   └── shared/               → Composants réutilisables │
│  │                                                       │
│  ├── models/                   → Types TypeScript          │
│  │   ├── Hero.ts                                         │
│  │   ├── Equipment.ts                                    │
│  │   ├── Castle.ts                                       │
│  │   └── ... (25+ modèles)                               │
│  │                                                       │
│  ├── assets/                   → Les 8003 PNG migrés      │
│  │   ├── icons/                                          │
│  │   ├── creatures/                                      │
│  │   ├── heroes/                                         │
│  │   ├── items/                                          │
│  │   ├── buildings/                                      │
│  │   └── ui/                                             │
│  │                                                       │
│  └── styles/                   → CSS adapté du jeu        │
│      ├── lobby.css             → Depuis Lobby.css         │
│      ├── inventory.css         → Depuis InventoryModule   │
│      └── ...                                             │
│                                                          │
├─ Supabase Backend ───────────────────────────────────────┤
│                                                          │
│  ├── Auth (anonyme)            → Login instantané         │
│  ├── PostgreSQL                → 12+ tables               │
│  ├── Edge Functions            → Logique métier           │
│  ├── Realtime                  → Chat + Matchmaking       │
│  ├── Storage                   → 8003 PNG (~150MB)        │
│  └── Row Level Security        → Sécurité par joueur      │
│                                                          │
├─ Mobile (Capacitor.js) ──────────────────────────────────┤
│                                                          │
│  ├── iOS                       → WebView + natif API      │
│  ├── Android                   → WebView + natif API      │
│  └── PWA                       → Installable sans store   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Coûts et Hébergement

### Option B — Budget Estimé

| Poste | Coût |
|-------|------|
| Supabase Free Tier | **0€/mois** (500MB DB, 1GB Storage, 500K invocations) |
| Vercel Free Tier (hébergement web) | **0€/mois** |
| Domaine (optionnel) | ~10€/an |
| Certificat SSL | Gratuit (Let's Encrypt) |
| Apple Developer (pour iOS) | 99€/an |
| Google Play Developer | 25€ (une fois) |
| **Total lancement** | **~135€** |
| **Total récurrent** | **~10€/mois** (domaine) |

### Limites du Free Tier (estimation de capacité)

| Ressource | Free Tier | Capacité estimée |
|-----------|-----------|-----------------|
| Database | 500 MB | ~50 000 joueurs |
| Storage | 1 GB | 8003 PNG = 150MB ✅ |
| Auth | Illimité (anonyme) | ∞ |
| Edge Functions | 500K/mois | ~16K requêtes/jour |
| Realtime | 200 connections | ~200 joueurs simultanés |
| Bandwidth | 5 GB/mois | ~500 joueurs actifs/jour |

---

## 8. Risques et Mitigations

| Risque | Probabilité | Mitigation |
|--------|------------|------------|
| Performance PixiJS sur vieux mobiles | Moyenne | Qualité graphique adaptive, LOD sprites |
| 150MB d'assets à télécharger | Haute | Lazy loading, sprites sheets optimisés, WebP |
| Combat 2.5D moins fun que 3D | Moyenne | Ajouter juice (screen shake, particles, SFX) |
| Propriété intellectuelle Ubisoft | Haute | ⚠️ Projet non-commercial / fan-made uniquement |
| Settings.bin illisible | Moyenne | Reverse-engineer les formules depuis le code C++ |

---

## 9. Conclusion

### L'Option B (2.5D Isométrique + PixiJS + Supabase) est le choix optimal car :

1. 🎨 **8 003 images PNG** déjà disponibles = pas besoin de créer d'art
2. 🖥️ **346 fichiers JS + 120 CSS** = la moitié de l'UI est déjà codée
3. ⚡ **PixiJS** = 60fps même sur un smartphone de 2020
4. 📱 **Capacitor.js** = une seule codebase pour Web + iOS + Android
5. 🔧 **Supabase** = backend gratuit prêt en 1 jour
6. 👤 **Faisable en solo** en 4-6 mois
7. 💰 **Budget total** < 150€ pour le lancement

### Prochaines Étapes

1. **Setup du projet** → Vite + React + PixiJS + Supabase + Capacitor
2. **Migration des assets** → Optimiser les 8003 PNG en WebP + sprite sheets
3. **Prototype du combat iso** → PixiJS grille isométrique avec pathfinding
4. **Adapter l'UI** → Porter les CSS modules existants en React components
5. **Connecter Supabase** → Implémenter les 18 controllers du bridge
