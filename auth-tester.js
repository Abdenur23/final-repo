const cognitoConfig = {
  clientId: '7irso7dmmnp793egs9bhkl0t81',
  domain: 'auth.theweer.com',
  redirectUri: window.location.origin
};

async function checkAuthStatus() {
  const el = document.getElementById('auth-section');
  const p = new URLSearchParams(window.location.search);
  const code = p.get('code');

  if (code) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cognitoConfig.clientId,
      code,
      redirect_uri: cognitoConfig.redirectUri
    });

    const r = await fetch(`https://${cognitoConfig.domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await r.json();
    if (data.id_token) localStorage.setItem('idToken', data.id_token);
    window.history.replaceState({}, '', window.location.pathname);
  }

  const token = localStorage.getItem('idToken');
  if (token) {
    el.innerHTML = `<p>✅ Signed in</p><button onclick="signOut()">Sign Out</button>`;
    if (typeof updateProductContent === 'function') updateProductContent(true);
  } else {
    el.innerHTML = `<p>🔒 Not signed in</p><button onclick="signIn()">Sign In</button>`;
    if (typeof updateProductContent === 'function') updateProductContent(false);
  }
}

function signIn() {
  const r = encodeURIComponent(cognitoConfig.redirectUri);
  window.location.href = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${r}`;
}

function signOut() {
  localStorage.removeItem('idToken');
  const r = encodeURIComponent(cognitoConfig.redirectUri);
  window.location.href = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${r}`;
}
