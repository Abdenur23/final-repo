// --- SHARED AUTHENTICATION UTILITY ---
// Save this as auth.js in the same directory

// --- PKCE UTILITY FUNCTIONS ---
function base64urlencode(buffer){
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(str){
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return base64urlencode(digest);
}

function genRandom(){ 
    const arr = new Uint8Array(32); 
    crypto.getRandomValues(arr); 
    return base64urlencode(arr); 
}

// --- CONFIG & SESSION MANAGEMENT ---
const cognitoConfig = {
    clientId: '73lf1h32phkqeb9ahu6tqcl9av',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin + window.location.pathname,
    tokenEndpoint: `https://auth.theweer.com/oauth2/token`
};

function saveSession(t){ 
    localStorage.setItem('cognitoSession', JSON.stringify(t)); 
}

function getSession(){ 
    const session = localStorage.getItem('cognitoSession');
    return session ? JSON.parse(session) : null;
}

function clearUserData() {
    // Clear promo data
    localStorage.removeItem('activePromoDiscount');
    
    // Clear any upload-related data
    localStorage.removeItem('userUploads');
    localStorage.removeItem('deviceSelection');
    
    // Clear any shopping cart data
    localStorage.removeItem('shoppingCart');
    
    // Add future user-specific data cleanup here
    
    console.log('All user-specific data cleared');
}

function clearSession() {
    // Clear Cognito session
    localStorage.removeItem('cognitoSession');
    localStorage.removeItem('pkce_verifier');
    
    // Clear all user-specific data
    clearUserData();
}

function isTokenExpired() {
    const session = getSession();
    if (!session || !session.id_token) return true;
    
    try {
        const payload = JSON.parse(atob(session.id_token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const bufferTime = 60000; // 1 minute buffer for network delays
        
        return now >= (exp - bufferTime);
    } catch (e) {
        console.error('Error checking token expiration:', e);
        return true;
    }
}

function isAuthenticated() {
    const session = getSession();
    if (!session || !session.id_token) return false;
    
    // Check if token is expired
    if (isTokenExpired()) {
        console.log('Token expired, clearing session');
        clearSession();
        return false;
    }
    
    return true;
}

function getUserInfo() {
    const session = getSession();
    if (session && session.id_token && !isTokenExpired()) {
        try {
            const payload = JSON.parse(atob(session.id_token.split('.')[1]));
            
            // Priority order for display name:
            // 1. name (from Profile scope)
            // 2. given_name (from Profile scope)  
            // 3. email (from Email scope)
            // 4. sub (from OpenID scope)
            const displayName = payload.name || payload.given_name || payload.email || payload.sub;
            
            return {
                email: payload.email,
                sub: payload.sub,
                name: payload.name,
                given_name: payload.given_name,
                family_name: payload.family_name,
                displayName: displayName
            };
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
    return null;
}

// --- AUTH FLOW FUNCTIONS (PKCE) ---
async function signin(){
    const verifier = genRandom();
    localStorage.setItem('pkce_verifier', verifier);
    const challenge = await sha256(verifier);
    
    const url =
      `https://${cognitoConfig.domain}/oauth2/authorize?response_type=code`
      + `&client_id=${cognitoConfig.clientId}`
      + `&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}`
      + `&scope=email+openid+profile`  // This includes Email, OpenID, and Profile scopes
      + `&code_challenge_method=S256`
      + `&code_challenge=${challenge}`;
      
    window.location.href = url;
}

function signout(){
    clearSession();
    window.location.href =
      `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}`
      + `&logout_uri=${encodeURIComponent(window.location.origin)}`;
}

async function handleCodeExchange(){
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if(!code) return false;

    const verifier = localStorage.getItem('pkce_verifier');
    if (!verifier) {
        console.error("PKCE Error: Code verifier not found in storage.");
        window.history.replaceState({},document.title,cognitoConfig.redirectUri); 
        return false;
    }

    const body =
      `grant_type=authorization_code`
      + `&client_id=${cognitoConfig.clientId}`
      + `&code=${code}`
      + `&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}`
      + `&code_verifier=${verifier}`;

    try {
        const res = await fetch(cognitoConfig.tokenEndpoint,{
            method:'POST',
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            body
        });
        const tokens = await res.json();

        if(res.ok && tokens.id_token) {
            saveSession(tokens);
            localStorage.removeItem('pkce_verifier');
            window.history.replaceState({},document.title,cognitoConfig.redirectUri);
            return true;
        } else {
            console.error("Token exchange failed:", tokens.error_description || JSON.stringify(tokens));
            return false;
        }
    } catch (error) {
        console.error('Network or exchange error:', error);
        return false;
    }
}

// --- UI MANAGEMENT ---
function renderAuthUI(authContainerId) {
    const authDiv = document.getElementById(authContainerId);
    if (!authDiv) return;
    
    const userInfo = getUserInfo();
    
    if (userInfo) {
        authDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span>Welcome, ${userInfo.displayName}</span>
                <button onclick="signout()" style="padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Sign Out</button>
            </div>
        `;
    } else {
        authDiv.innerHTML = `
            <button onclick="signin()" style="padding: 8px 16px; background: #f90; color: white; border: none; border-radius: 5px; cursor: pointer;">Sign In / Sign Up</button>
        `;
    }
}

function renderNavigation() {
    const navContainer = document.getElementById('nav-container');
    if (!navContainer) return;
    
    const currentPage = window.location.pathname.split('/').pop();
    const userInfo = getUserInfo();
    
    let navHTML = '<div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">';
    navHTML += '<strong>Navigation:</strong> ';
    
    if (currentPage !== 'index.html' && currentPage !== '') {
        navHTML += '<a href="index.html" style="margin: 0 10px;">Home</a>';
    }
    
    if (currentPage !== 'case.html') {
        navHTML += '<a href="case.html" style="margin: 0 10px;">Phone Cases</a>';
    }
    
    // Show user info in navigation if available
    if (userInfo) {
        navHTML += `<span style="margin-left: 15px; color: #666;">Hello, ${userInfo.displayName}</span>`;
    }
    
    navHTML += '</div>';
    navContainer.innerHTML = navHTML;
}

function checkAuthAndUpdateUI() {
    const userInfo = getUserInfo();
    
    // Update the main content visibility
    const appContent = document.getElementById('app-content');
    const authRequired = document.getElementById('auth-required-message');
    const authActionDiv = document.getElementById('auth-action');
    
    if (userInfo) {
        // User is authenticated - show app content
        if (appContent) appContent.style.display = 'block';
        if (authRequired) authRequired.style.display = 'none';
        
        // Show welcome message and sign out button
        if (authActionDiv) {
            authActionDiv.innerHTML = `
                <p>Welcome, <strong>${userInfo.displayName}</strong>!</p>
                <button onclick="signout()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Sign Out
                </button>
            `;
        }
    } else {
        // User is NOT authenticated - show sign in button only
        if (appContent) appContent.style.display = 'none';
        if (authRequired) authRequired.style.display = 'block';
        
        // Show sign in button
        if (authActionDiv) {
            authActionDiv.innerHTML = `
                <button onclick="signin()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Sign In / Sign Up
                </button>
            `;
        }
    }
}

// Update the existing setupTokenRefresh function in auth.js
function setupTokenRefresh() {
    // Check token every minute
    setInterval(() => {
        if (isTokenExpired() && getSession()) {
            console.log('Token expired, clearing session');
            clearSession();
            checkAuthAndUpdateUI(); // ← Add this line
        }
    }, 60000);
}

// Update the existing initializeAuth function in auth.js
async function initializeAuth() {
    await handleCodeExchange();
    renderNavigation();
    
    // Check if token is expired and clear if needed
    if (isTokenExpired() && getSession()) {
        console.log('Token expired on page load, clearing session');
        clearSession();
    }
    
    checkAuthAndUpdateUI(); // ← Add this line
    
    // Render auth UI if container exists
    const authContainer = document.querySelector('[id*="auth"], #auth-action, #auth-container');
    if (authContainer) {
        renderAuthUI(authContainer.id);
    }
    
    // Start token expiration monitoring
    setupTokenRefresh();
    
    return isAuthenticated();
}
// Make functions available globally
window.signin = signin;
window.signout = signout;
window.getSession = getSession;
window.isAuthenticated = isAuthenticated;
window.getUserInfo = getUserInfo;
window.isTokenExpired = isTokenExpired;
