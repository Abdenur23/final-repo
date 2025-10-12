// ===== auth-tester.js =====
const cognitoConfig = {
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin,
};

function getStoredSession() {
    return JSON.parse(localStorage.getItem('cognitoSession') || 'null');
}

function saveSession(session) {
    localStorage.setItem('cognitoSession', JSON.stringify(session));
}

function clearSession() {
    localStorage.removeItem('cognitoSession');
}

function getAccessToken() {
    const session = getStoredSession();
    return session ? session.access_token : null;
}

async function checkAuthStatus() {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const idToken = urlParams.get('id_token');
    const accessToken = urlParams.get('access_token');

    if (idToken && accessToken) {
        // Save tokens
        const session = {
            id_token: idToken,
            access_token: accessToken,
            obtainedAt: Date.now(),
        };
        saveSession(session);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const session = getStoredSession();

    if (!session) {
        showLoginPrompt();
    } else {
        showUser(session);
    }
}

function showLoginPrompt() {
    const authSection = document.getElementById('auth-section');
    authSection.innerHTML = `
        <div style="text-align:center;">
            <h3>Welcome to The Weer</h3>
            <p>Please sign in or sign up to continue.</p>
            <button id="loginBtn">Sign In / Sign Up</button>
        </div>
    `;

    document.getElementById('loginBtn').onclick = () => {
        const loginUrl = `https://${cognitoConfig.domain}/login?client_id=${cognitoConfig.clientId}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}`;
        window.location.href = loginUrl;
    };
}

function showUser(session) {
    const authSection = document.getElementById('auth-section');
    authSection.innerHTML = `
        <p style="color:green;">✅ Logged in</p>
        <button id="logoutBtn">Logout</button>
    `;

    document.getElementById('logoutBtn').onclick = () => {
        clearSession();
        location.reload();
    };
}

// Expose helper functions globally
window.authTester = { getAccessToken, checkAuthStatus };
