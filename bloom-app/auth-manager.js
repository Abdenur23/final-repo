// auth-manager.js
// Authentication and session management
class AuthManager {
    constructor() {
        this.isInitialized = false;
    }

    // PKCE Utility Functions
    base64urlencode(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async sha256(str) {
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return this.base64urlencode(digest);
    }

    genRandom() { 
        const arr = new Uint8Array(32); 
        crypto.getRandomValues(arr); 
        return this.base64urlencode(arr); 
    }

    // Session Management
    saveSession(t) { 
        localStorage.setItem(STORAGE_KEYS.COGNITO_SESSION, JSON.stringify(t)); 
    }

    getSession() {
        const session = localStorage.getItem(STORAGE_KEYS.COGNITO_SESSION);
        return session ? JSON.parse(session) : null;
    }

    clearUserData() {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMO);
        localStorage.removeItem(STORAGE_KEYS.USER_UPLOADS);
        localStorage.removeItem(STORAGE_KEYS.DEVICE_SELECTION);
        localStorage.removeItem(STORAGE_KEYS.SHOPPING_CART);
        localStorage.removeItem(STORAGE_KEYS.PRODUCT_DESIGNS);
        console.log('All user-specific data cleared');
    }

    clearSession() {
        localStorage.removeItem(STORAGE_KEYS.COGNITO_SESSION);
        localStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
        this.clearUserData();
    }

    isTokenExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            const bufferTime = 300000; // 5-minute buffer
            return now >= (exp - bufferTime);
        } catch (e) {
            console.error('Error checking token expiration:', e);
            return true;
        }
    }

    async refreshSession() {
        const session = this.getSession();
        if (!session || !session.refresh_token) {
            this.clearSession();
            return false;
        }
        
        console.log('Attempting silent token refresh...');
        const body = `grant_type=refresh_token&client_id=${cognitoConfig.clientId}&refresh_token=${session.refresh_token}`;

        try {
            const res = await fetch(cognitoConfig.tokenEndpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body
            });
            const tokens = await res.json();

            if(res.ok && tokens.id_token) {
                const newSession = {
                    ...tokens,
                    refresh_token: tokens.refresh_token || session.refresh_token 
                };
                this.saveSession(newSession);
                console.log('Token refresh successful! Session extended.');
                return true;
            } else {
                console.error("Refresh token exchange failed. Logging out:", tokens.error_description || JSON.stringify(tokens));
                this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('Network or exchange error during refresh:', error);
            return false;
        }
    }

    async isAuthenticated() {
        const session = this.getSession();
        if (!session || !session.id_token) return false;

        if (this.isTokenExpired(session.id_token)) {
            console.log('ID Token expired/expiring. Attempting refresh...');
            const refreshed = await this.refreshSession();
            return refreshed;
        }
        return true;
    }

    getUserInfo() {
        const session = this.getSession();
        if (session && session.id_token) {
            try {
                const payload = JSON.parse(atob(session.id_token.split('.')[1]));
                const displayName = payload.name || payload.given_name || payload.email || payload.sub;
                return { email: payload.email, sub: payload.sub, displayName: displayName };
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
        return null;
    }

    // Auth Flow Functions
    async signin() {
        const verifier = this.genRandom();
        localStorage.setItem(STORAGE_KEYS.PKCE_VERIFIER, verifier);
        const challenge = await this.sha256(verifier);
        
        const url = `https://${cognitoConfig.domain}/oauth2/authorize?response_type=code&client_id=${cognitoConfig.clientId}&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}&scope=email+openid+profile&code_challenge_method=S256&code_challenge=${challenge}`;
        
        window.location.href = url;
    }

    signout() {
        this.clearSession();
        window.location.href = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${encodeURIComponent(window.location.origin)}`;
    }

    async handleCodeExchange() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if(!code) return false;

        const verifier = localStorage.getItem(STORAGE_KEYS.PKCE_VERIFIER);
        if (!verifier) {
            console.error("PKCE Error: Code verifier not found in storage.");
            window.history.replaceState({}, document.title, cognitoConfig.redirectUri); 
            return false;
        }

        const body = `grant_type=authorization_code&client_id=${cognitoConfig.clientId}&code=${code}&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}&code_verifier=${verifier}`;

        try {
            const res = await fetch(cognitoConfig.tokenEndpoint, {
                method:'POST',
                headers:{'Content-Type':'application/x-www-form-urlencoded'},
                body
            });
            const tokens = await res.json();

            if(res.ok && tokens.id_token) {
                this.saveSession(tokens);
                localStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
                window.history.replaceState({}, document.title, cognitoConfig.redirectUri);
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

    setupTokenRefresh() {
        setInterval(async () => {
            const session = this.getSession();
            if (session && this.isTokenExpired(session.id_token)) {
                console.log('Scheduled check: ID Token is expired or expiring. Triggering refresh...');
                await this.refreshSession();
                if (window.app) {
                    window.app.uiManager.checkAuthAndUpdateUI();
                }
            }
        }, 30000); // Check every 30 seconds
    }

    async initialize() {
        await this.handleCodeExchange();
        const actualAuthStatus = await this.isAuthenticated();
        this.isInitialized = true;
        return actualAuthStatus;
    }
}
