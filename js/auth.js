// Authentication module
class AuthManager {
    constructor() {
        this.session = null;
    }

    async initializeAuth() {
        try {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const idToken = hashParams.get('id_token');

            if (accessToken && idToken) {
                this.session = {
                    access_token: accessToken,
                    id_token: idToken
                };
                localStorage.setItem('cognitoSession', JSON.stringify(this.session));
                window.location.hash = '';
                return true;
            }

            // Check existing session
            const storedSession = localStorage.getItem('cognitoSession');
            if (storedSession) {
                this.session = JSON.parse(storedSession);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Auth initialization error:', error);
            return false;
        }
    }

    getSession() {
        return this.session || JSON.parse(localStorage.getItem('cognitoSession') || 'null');
    }

    getUserInfo() {
        const session = this.getSession();
        if (!session?.id_token) return null;

        try {
            const payload = JSON.parse(atob(session.id_token.split('.')[1]));
            return {
                displayName: payload.name || payload.email || 'User',
                email: payload.email,
                sub: payload.sub
            };
        } catch (error) {
            console.error('Error parsing user info:', error);
            return null;
        }
    }

    signin() {
        const authUrl = `https://weer.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=${CONFIG.AUTH.CLIENT_ID}&response_type=token&scope=email+openid&redirect_uri=${encodeURIComponent(CONFIG.AUTH.REDIRECT_URI)}`;
        window.location.href = authUrl;
    }

    signout() {
        localStorage.removeItem('cognitoSession');
        window.location.reload();
    }
}

// Global auth instance
const authManager = new AuthManager();

// For backward compatibility
function initializeAuth() {
    return authManager.initializeAuth();
}

function getSession() {
    return authManager.getSession();
}

function getUserInfo() {
    return authManager.getUserInfo();
}

function signin() {
    authManager.signin();
}

function signout() {
    authManager.signout();
}
