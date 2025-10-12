// ========== Cognito Configuration ==========
const cognitoConfig = {
  clientId: '7irso7dmmnp793egs9bhkl0t81',
  domain: 'auth.theweer.com',
  redirectUri: window.location.origin,
};

const API_ENDPOINT = 'https://rd8hnh5ch6.execute-api.us-east-1.amazonaws.com/prod/add-record';

// ========== Initialization ==========
async function initAuthTest() {
  const statusEl = document.getElementById('auth-status');
  const recordSection = document.getElementById('record-section');

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  try {
    // Step 1: Exchange code for real tokens
    if (code) {
      statusEl.textContent = '🔄 Exchanging code for tokens...';
      const tokenUrl = `https://${cognitoConfig.domain}/oauth2/token`;

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cognitoConfig.clientId,
        redirect_uri: cognitoConfig.redirectUri,
        code: code,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed: ' + response.status);
      }

      const tokens = await response.json();

      localStorage.setItem('id_token', tokens.id_token);
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);

      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const idToken = localStorage.getItem('id_token');

    // Step 2: Check if authenticated
    if (idToken) {
      statusEl.innerHTML = `
        ✅ Authenticated with Cognito<br>
        <button class="btn" onclick="signOut()">Sign Out</button>
      `;
      recordSection.style.display = 'block';
      displayTokenClaims(idToken);
    } else {
      statusEl.innerHTML = `
        🔒 Not signed in<br>
        <button class="btn" onclick="signIn()">Sign In / Sign Up</button>
      `;
      recordSection.style.display = 'none';
    }
  } catch (err) {
    console.error('Auth Test Error:', err);
    statusEl.textContent = '❌ Error: ' + err.message;
  }
}

// ========== Cognito Hosted UI ==========
function signIn() {
  const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
  const loginUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
  window.location.href = loginUrl;
}

function signOut() {
  localStorage.removeItem('id_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
  const logoutUrl = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${redirectUri}`;
  window.location.href = logoutUrl;
}

// ========== Add Record ==========
async function addRecord() {
  const msg = document.getElementById('response-message');
  msg.textContent = '⏳ Sending request...';

  const idToken = localStorage.getItem('id_token');
  if (!idToken) {
    msg.textContent = '❌ Not authenticated';
    return;
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (response.ok) {
      msg.innerHTML = `✅ Record added successfully!<br>
      <b>Sub:</b> ${data.user_sub}<br>
      <b>Time:</b> ${data.timestamp}`;
    } else {
      msg.innerHTML = `❌ Error: ${data.message || JSON.stringify(data)}`;
    }
  } catch (err) {
    console.error(err);
    msg.textContent = '❌ Request failed: ' + err.message;
  }
}

// ========== Decode and Show Token Info ==========
function displayTokenClaims(idToken) {
  try {
    const [, payload] = idToken.split('.');
    const decoded = JSON.parse(atob(payload));
    document.getElementById('token-info').innerHTML = `
      <b>Decoded Token Claims:</b><br>
      <pre>${JSON.stringify(decoded, null, 2)}</pre>
    `;
  } catch {
    document.getElementById('token-info').textContent = '⚠️ Could not decode token.';
  }
}
