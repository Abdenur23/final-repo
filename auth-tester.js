// Standalone Auth System for API Testing
const authTesterConfig = {
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin + window.location.pathname
};

// Exchange authorization code for JWT tokens
async function exchangeCodeForTokens(code) {
    try {
        const tokenUrl = `https://${authTesterConfig.domain}/oauth2/token`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: authTesterConfig.clientId,
                code: code,
                redirect_uri: authTesterConfig.redirectUri
            })
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        const tokens = await response.json();
        return tokens;
    } catch (error) {
        console.error('Token exchange error:', error);
        throw error;
    }
}

// Check authentication status for API testing
async function checkTesterAuthStatus() {
    const authSection = document.getElementById('auth-section');
    
    try {
        // Check for authentication code in URL (callback from Cognito)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // Exchange code for real JWT tokens
            const tokens = await exchangeCodeForTokens(code);
            
            // Store real tokens for API Gateway
            localStorage.setItem('testerIdToken', tokens.id_token);
            localStorage.setItem('testerAccessToken', tokens.access_token);
            localStorage.setItem('testerAuth', 'authenticated-' + Date.now());
            
            // Clear the code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ API Authentication Successful!</p>
                    <p><small>JWT tokens stored for API calls</small></p>
                    <button onclick="testerSignOut()" class="btn-secondary">Sign Out</button>
                </div>
            `;
            if (typeof updateTesterContent === 'function') {
                updateTesterContent(true);
            }
            return;
        }

        // Check if we have API tokens
        const idToken = localStorage.getItem('testerIdToken');
        const authFlag = localStorage.getItem('testerAuth');
        
        if (idToken && authFlag) {
            // User is signed in with API tokens
            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ Ready for API Testing</p>
                    <p><small>JWT tokens available for API calls</small></p>
                    <button onclick="testerSignOut()" class="btn-secondary">Sign Out</button>
                </div>
            `;
            if (typeof updateTesterContent === 'function') {
                updateTesterContent(true);
            }
        } else {
            // User is not signed in for API testing
            authSection.innerHTML = `
                <div>
                    <p>🔒 API Authentication Required</p>
                    <p><small>Sign in to get JWT tokens for API Gateway</small></p>
                    <button onclick="testerSignIn()" class="btn-primary">Sign In for API Test</button>
                </div>
            `;
            if (typeof updateTesterContent === 'function') {
                updateTesterContent(false);
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        authSection.innerHTML = `
            <div>
                <p>❌ API Authentication Error</p>
                <button onclick="testerSignIn()" class="btn-primary">Sign In for API Test</button>
            </div>
        `;
    }
}

// Redirect to Cognito Hosted UI for sign in
function testerSignIn() {
    const redirectUri = encodeURIComponent(authTesterConfig.redirectUri);
    const loginUrl = `https://${authTesterConfig.domain}/oauth2/authorize?client_id=${authTesterConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
}

// Sign out function
function testerSignOut() {
    // Clear tester auth data
    localStorage.removeItem('testerIdToken');
    localStorage.removeItem('testerAccessToken');
    localStorage.removeItem('testerAuth');
    
    // Redirect to Cognito logout
    const redirectUri = encodeURIComponent(authTesterConfig.redirectUri);
    const logoutUrl = `https://${authTesterConfig.domain}/logout?client_id=${authTesterConfig.clientId}&logout_uri=${redirectUri}`;
    window.location.href = logoutUrl;
}

// Get JWT token for API calls
function getTesterToken() {
    return localStorage.getItem('testerIdToken');
}
