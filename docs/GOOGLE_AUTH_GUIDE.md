# 🔐 Système d'Auth Google - MQFEL

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FLOW D'AUTHENTIFICATION                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ Joueur  │───▶│  Launcher   │───▶│  Supabase Auth   │    │
│  └─────────┘    │  (Electron) │    │  (Google OAuth)  │    │
│                 └─────────────┘    └────────┬─────────┘    │
│                                             │              │
│                                             ▼              │
│                                    ┌──────────────────┐    │
│  ┌─────────────────┐              │  Token JWT       │    │
│  │ MightyQuest.exe │◀─────────────│  + User ID       │    │
│  │ (Goldberg emu)  │              └──────────────────┘    │
│  └────────┬────────┘                                       │
│           │                                                │
│           ▼                                                │
│  ┌─────────────────┐    ┌──────────────────────────────┐  │
│  │  Ton Serveur    │───▶│  Supabase Database           │  │
│  │  (Node.js)      │    │  (Progression sauvegardée)   │  │
│  └─────────────────┘    └──────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Configuration

### 1. Supabase - Activer Google Auth

1. Va sur [supabase.com](https://supabase.com)
2. Crée un projet `mqfel-revival`
3. **Authentication** → **Providers** → **Google** → Enable
4. Configure les credentials Google (voir ci-dessous)

### 2. Google Cloud Console

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Crée un projet "MQFEL Revival"
3. **APIs & Services** → **Credentials** → **Create OAuth Client ID**
4. Type: **Web application**
5. **Authorized redirect URIs**:
   ```
   https://TON-PROJET.supabase.co/auth/v1/callback
   ```
6. Copie **Client ID** + **Client Secret** → colle dans Supabase

### 3. Supabase URL Configuration

Dans **Authentication** → **URL Configuration**:
```
Redirect URLs: mqfel://auth-callback
```

## 🚀 Lancer le projet

```bash
# 1. Installer le launcher
cd launcher
npm install

# 2. Configurer les variables (dans main.js et app.js)
# SUPABASE_URL et SUPABASE_ANON_KEY

# 3. Lancer
npm start
```

## ✅ Avantages

| Feature | Status |
|---------|--------|
| 🆓 100% Gratuit | ✅ Supabase free tier |
| 🔐 Sécurisé | ✅ OAuth 2.0 Google |
| 💾 Sync multi-PC | ✅ Cloud database |
| 🚫 Pas de Steam | ✅ Goldberg Emulator |
| 📧 Pas d'email | ✅ Juste Google |