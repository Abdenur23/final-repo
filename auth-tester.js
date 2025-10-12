class AuthManager {
    constructor() {
        this.config = {
            clientId: '7irso7dmmnp793egs9bhkl0t81',
            cognitoDomain: 'https://auth.theweer.com',
            redirectUri: 'https://theweer.com/',
            userPoolId: 'us-east-1_TJDOamTpp'
        };
        
        this.tokens = this.loadTokens();
        this.init();
    }

    init() {
        this.handleAuthCallback();
        this.checkExistingSession();
    }

    redirectToHostedUI() {
        const authUrl = `${this.config.cognitoDomain}/oauth2/authorize?` +
            `client_id=${this.config.clientId}&` +
            `response_type=code&` +
            `scope=email+openid+phone+profile+aws.cognito.signin.user.admin&` +
            `redirect_uri=${encodeURIComponent(this.config.redirectUri)}`;
        
        window.location.href = authUrl;
    }

    async handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('OAuth error:', error);
            this.showLogin();
            return;
        }

        if (authCode) {
            try {
                await this.exchangeCodeForTokens(authCode);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Token exchange failed:', error);
            }
        }
    }

    async exchangeCodeForTokens(authCode) {
        // In production, this should call your backend to securely exchange the code
        const tokenUrl = `${this.config.cognitoDomain}/oauth2/token`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                code: authCode,
                redirect_uri: this.config.redirectUri
            })
        });

        if (!response.ok) {
            throw new Error('Token exchange failed');
        }

        const tokenData = await response.json();
        this.storeTokens(tokenData);
        this.showDashboard(tokenData);
    }

    storeTokens(tokenData) {
        const tokens = {
            accessToken: tokenData.access_token,
            idToken: tokenData.id_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000)
        };
        
        localStorage.setItem('cognito_tokens', JSON.stringify(tokens));
        this.tokens = tokens;
    }

    loadTokens() {
        const stored = localStorage.getItem('cognito_tokens');
        return stored ? JSON.parse(stored) : null;
    }

    isTokenValid() {
        if (!this.tokens || !this.tokens.expiresAt) return false;
        return Date.now() < this.tokens.expiresAt - 60000; // 1 minute buffer
    }

    async checkExistingSession() {
        if (this.isTokenValid() && this.tokens.idToken) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    showDashboard() {
        if (!this.tokens?.idToken) return;

        const tokenPayload = JSON.parse(atob(this.tokens.idToken.split('.')[1]));
        
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Display user information
        document.getElementById('user-details').innerHTML = `
            <p><strong>Username:</strong> ${tokenPayload['cognito:username'] || tokenPayload.username}</p>
            <p><strong>Email:</strong> ${tokenPayload.email}</p>
            <p><strong>User ID:</strong> ${tokenPayload.sub}</p>
            <p><strong>Email Verified:</strong> ${tokenPayload.email_verified ? 'Yes' : 'No'}</p>
            ${tokenPayload.identities ? `<p><strong>Provider:</strong> ${JSON.parse(tokenPayload.identities)[0].providerType}</p>` : ''}
        `;
        
        // Display tokens (truncated for security)
        document.getElementById('id-token').textContent = this.truncateToken(this.tokens.idToken);
        document.getElementById('access-token').textContent = this.truncateToken(this.tokens.accessToken);
        document.getElementById('token-expiry').textContent = new Date(this.tokens.expiresAt).toLocaleString();
    }

    truncateToken(token) {
        return token ? `${token.substring(0, 50)}...${token.substring(token.length - 20)}` : 'No token';
    }

    showLogin() {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        localStorage.removeItem('cognito_tokens');
        this.tokens = null;
    }

    async callProtectedAPI() {
        if (!this.tokens?.accessToken) {
            alert('No access token available');
            return;
        }

        try {
            // Example protected API call
            const response = await fetch('/your-protected-api-endpoint', {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = document.getElementById('api-result');
            if (response.ok) {
                result.innerHTML = '<div style="color: green;">✅ API call successful!</div>';
            } else {
                result.innerHTML = `<div style="color: red;">❌ API call failed: ${response.status}</div>`;
            }
        } catch (error) {
            document.getElementById('api-result').innerHTML = `<div style="color: red;">❌ API error: ${error.message}</div>`;
        }
    }

    logout() {
        const logoutUrl = `${this.config.cognitoDomain}/logout?` +
            `client_id=${this.config.clientId}&` +
            `logout_uri=${encodeURIComponent(this.config.redirectUri)}`;
        
        this.showLogin();
        // Optional: Redirect to Cognito logout
        // window.location.href = logoutUrl;
    }
}

// Global functions for HTML buttons
const authManager = new AuthManager();

function redirectToHostedUI() {
    authManager.redirectToHostedUI();
}

function logout() {
    authManager.logout();
}

function callProtectedAPI() {
    authManager.callProtectedAPI();
}
