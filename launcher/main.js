const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ⚠️ CONFIGURE CES VALEURS
const CONFIG = {
  SUPABASE_URL: 'https://TON-PROJET.supabase.co', // Remplace par ton URL
  SUPABASE_ANON_KEY: 'TA-CLE-ANON',               // Remplace par ta clé
  GAME_PATH: './MightyQuest.exe',
  SERVER_URL: 'https://ton-serveur.com'            // ou http://localhost:8080
};

let mainWindow;
let currentUser = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

// Auth Google via Supabase
ipcMain.handle('auth:google', async () => {
  const authUrl = `${CONFIG.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=mqfel://auth-callback`;
  shell.openExternal(authUrl);
});

// Deep link protocol
app.setAsDefaultProtocolClient('mqfel');

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleAuthCallback(url);
});

// Windows: single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    const url = commandLine.find(arg => arg.startsWith('mqfel://'));
    if (url) handleAuthCallback(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function handleAuthCallback(url) {
  const urlObj = new URL(url);
  const accessToken = urlObj.searchParams.get('access_token');
  const refreshToken = urlObj.searchParams.get('refresh_token');
  
  if (accessToken) {
    mainWindow.webContents.send('auth:success', { accessToken, refreshToken });
  }
}

// Lancer le jeu
ipcMain.handle('game:launch', async (event, { userId, token }) => {
  const steamId = generateSteamIdFromUserId(userId);
  
  // Config Goldberg
  const goldbergDir = path.join(path.dirname(CONFIG.GAME_PATH), 'steam_settings');
  if (!fs.existsSync(goldbergDir)) fs.mkdirSync(goldbergDir, { recursive: true });
  
  fs.writeFileSync(path.join(goldbergDir, 'configs.user.ini'), `[SteamClient]\nSteamID=${steamId}\nAccountName=MQFEL_Player\nLanguage=french\n`);
  
  const gameProcess = spawn(CONFIG.GAME_PATH, [
    `-server_url`, CONFIG.SERVER_URL,
    `-token`, token,
    `-userid`, userId,
    `-environmentName`, `mqfel-revival`
  ], {
    cwd: path.dirname(path.resolve(CONFIG.GAME_PATH)),
    detached: true
  });
  
  gameProcess.unref();
  return { success: true, steamId };
});

function generateSteamIdFromUserId(userId) {
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const uniquePart = Math.abs(hash).toString().padStart(10, '0').slice(0, 10);
  return `7656119${uniquePart}`;
}

ipcMain.handle('app:close', () => app.quit());
ipcMain.handle('app:minimize', () => mainWindow.minimize());