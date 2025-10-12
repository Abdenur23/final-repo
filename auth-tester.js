// ===== auth-tester.js =====
const cognitoConfig = {
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin,
};

// --- Helpers ---
function saveSession(tokens) {
    localStorage.setItem('cognitoSession', JSON.stringify(tokens));
}

function getSession() {
    return JSON.parse(localStorage.getItem('cognitoSession') || 'null');
}

function clearSession() {
    localStorage.removeItem('cognitoSession');
}

function getAccessToken() {
    const s = getSession();
    return s?.access_token || null;
}

// Decode JWT and check expiration
function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds
        return payload.exp > Math.floor(Date.now() / 1000);
    } catch (e) {
        return false;
    }
}

// --- Exchange code for tokens ---
async function exchangeCodeForToken(code) {
    const url = `https://${cognitoConfig.domain}/oauth2/token`;
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cognitoConfig.clientId,
        code: code,
        redirect_uri: cognitoConfig.redirectUri
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });

        if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
        const tokens = await response.json();
        saveSession(tokens);
        return tokens;
    } catch (err) {
        console.error('Token exchange error:', err);
        return null;
    }
}

// --- Main Auth Check ---
async function checkAuthStatus() {
    const authSection = document.getElementById('auth-section');

    // 1️⃣ Handle redirect with code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        const tokens = await exchangeCodeForToken(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (tokens) {
            showLoggedInUI(authSection);
            return;
        }
    }

    // 2️⃣ Check existing session
    const session = getSession();
    if (session?.access_token && isTokenValid(session.id_token)) {
        showLoggedInUI(authSection);
    } else {
        clearSession();
        showLoginUI(authSection);
    }
}

// --- UI Builders ---
function showLoginUI(container) {
    container.innerHTML = `
        <div style="text-align:center;">
            <p>🔒 You are not signed in</p>
            <button id="signInBtn">Sign In / Sign Up</button>
        </div>
    `;
    document.getElementById('signInBtn').onclick = signIn;
}

function showLoggedInUI(container) {
    const session = getSession();
    const payload = session ? JSON.parse(atob(session.id_token.split('.')[1])) : {};
    const email = payload.email || 'Unknown';

    container.innerHTML = `
        <div style="text-align:center; background:#d1fae5; padding:15px; border-radius:8px;">
            <p>✅ Logged in as <strong>${email}</strong></p>
            <button id="logoutBtn">Logout</button>
        </div>
    `;
    document.getElementById('logoutBtn').onclick = signOut;
}

// --- Cognito actions ---
function signIn() {
    const { domain, clientId, redirectUri } = cognitoConfig;
    const url = `https://${domain}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
}

function signOut() {
    clearSession();
    const { domain, clientId, redirectUri } = cognitoConfig;
    const url = `https://${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
}

// --- Export helpers globally ---
window.authTester = { checkAuthStatus, getAccessToken, signOut };
