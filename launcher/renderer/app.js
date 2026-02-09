// ⚠️ CONFIGURE CES VALEURS
const SUPABASE_URL = 'https://TON-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'TA-CLE-ANON';

let currentUser = null;
let accessToken = null;

const loginSection = document.getElementById('login-section');
const playSection = document.getElementById('play-section');
const loadingSection = document.getElementById('loading-section');

document.getElementById('google-login').addEventListener('click', () => {
  mqfel.loginWithGoogle();
});

document.getElementById('play-button').addEventListener('click', launchGame);
document.getElementById('logout-button').addEventListener('click', logout);

// Callback auth Google
mqfel.onAuthSuccess(async (data) => {
  accessToken = data.accessToken;
  localStorage.setItem('mqfel_token', accessToken);
  
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  currentUser = await userResponse.json();
  showPlaySection();
  loadUserStats();
});

function showPlaySection() {
  loginSection.classList.add('hidden');
  playSection.classList.remove('hidden');
  
  document.getElementById('user-name').textContent = currentUser.user_metadata?.full_name || 'Joueur';
  document.getElementById('user-email').textContent = currentUser.email;
  document.getElementById('user-avatar').src = currentUser.user_metadata?.avatar_url || '';
}

async function loadUserStats() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?user_id=eq.${currentUser.id}&select=gold,heroes(count),attack_logs(count)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );
    
    const data = await response.json();
    
    if (data[0]) {
      document.getElementById('stat-gold').textContent = formatNumber(data[0].gold || 0);
      document.getElementById('stat-heroes').textContent = data[0].heroes?.[0]?.count || 0;
      document.getElementById('stat-attacks').textContent = data[0].attack_logs?.[0]?.count || 0;
    }
  } catch (e) {
    console.log('Nouveau joueur');
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

async function launchGame() {
  playSection.classList.add('hidden');
  loadingSection.classList.remove('hidden');
  
  try {
    await mqfel.launchGame({
      userId: currentUser.id,
      token: accessToken
    });
    
    setTimeout(() => mqfel.close(), 3000);
  } catch (error) {
    alert('Erreur: ' + error.message);
    loadingSection.classList.add('hidden');
    playSection.classList.remove('hidden');
  }
}

function logout() {
  currentUser = null;
  accessToken = null;
  localStorage.removeItem('mqfel_token');
  playSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
}

// Check session au démarrage
async function checkExistingSession() {
  const savedToken = localStorage.getItem('mqfel_token');
  if (savedToken) {
    accessToken = savedToken;
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      if (response.ok) {
        currentUser = await response.json();
        showPlaySection();
        loadUserStats();
      } else {
        localStorage.removeItem('mqfel_token');
      }
    } catch (e) {
      localStorage.removeItem('mqfel_token');
    }
  }
}

checkExistingSession();