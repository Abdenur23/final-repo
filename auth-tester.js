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

// --- Main Auth Check ---
function checkAuthStatus() {
    const authSection = document.getElementById('auth-section');
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const idToken = hashParams.get('id_token');
    const accessToken = hashParams.get('access_token');

    // 1️⃣ Handle redirect from Cognito
    if (idToken && accessToken) {
        saveSession({
            id_token: idToken,
            access_token: accessToken,
            timestamp: Date.now(),
        });
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const session = getSession();
    if (session?.access_token) {
        showLoggedInUI(authSection);
    } else {
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
    container.innerHTML = `
        <div style="text-align:center; background:#d1fae5; padding:15px; border-radius:8px;">
            <p>✅ Logged in with Cognito</p>
            <button id="logoutBtn">Logout</button>
        </div>
    `;
    document.getElementById('logoutBtn').onclick = signOut;
}

// --- Cognito actions ---
function signIn() {
    const { domain, clientId, redirectUri } = cognitoConfig;
    const url = `https://${domain}/oauth2/authorize?client_id=${clientId}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
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
