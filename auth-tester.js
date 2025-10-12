// Cognito configuration
const cognitoConfig = {
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin
};

// Function to exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
    try {
        const tokenUrl = `https://${cognitoConfig.domain}/oauth2/token`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: cognitoConfig.clientId,
                code: code,
                redirect_uri: cognitoConfig.redirectUri
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

// Check authentication status and get proper tokens
async function checkAuthStatus() {
    const authSection = document.getElementById('auth-status');
    
    try {
        // Check for authentication code in URL (callback from Cognito)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // Exchange code for real tokens
            const tokens = await exchangeCodeForTokens(code);
            
            // Store the real tokens
            localStorage.setItem('idToken', tokens.id_token);
            localStorage.setItem('accessToken', tokens.access_token);
            localStorage.setItem('refreshToken', tokens.refresh_token);
            localStorage.setItem('cognitoToken', 'authenticated');
            
            // Clear the code from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            authSection.innerHTML = `
                <div class="success">✅ Successfully authenticated! Tokens stored.</div>
            `;
            enableApiButton();
            return;
        }

        // Check if we have a real JWT token
        const idToken = localStorage.getItem('idToken');
        const hasAuthFlag = localStorage.getItem('cognitoToken');
        
        if (idToken && hasAuthFlag) {
            authSection.innerHTML = `
                <div class="success">✅ Authenticated with valid JWT token</div>
            `;
            enableApiButton();
            
            // Show user info from token
            try {
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                authSection.innerHTML += `<div><small>User: ${payload.email || payload.username || 'Unknown'}</small></div>`;
            } catch (e) {
                console.log('Could not decode token:', e);
            }
        } else if (hasAuthFlag) {
            // Has the placeholder but no real token - need to re-authenticate
            authSection.innerHTML = `
                <div class="warning">⚠️ Session expired. Please sign in again.</div>
                <button onclick="signIn()" class="btn-primary">Sign In</button>
            `;
            disableApiButton();
        } else {
            // Not authenticated at all
            authSection.innerHTML = `
                <div class="error">❌ Not authenticated</div>
                <button onclick="signIn()" class="btn-primary">Sign In</button>
            `;
            disableApiButton();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        authSection.innerHTML = `
            <div class="error">❌ Error checking authentication</div>
            <button onclick="signIn()" class="btn-primary">Sign In</button>
        `;
        disableApiButton();
    }
}

// Redirect to Cognito Hosted UI for sign in
function signIn() {
    const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
    const loginUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
}

function enableApiButton() {
    const apiButton = document.getElementById('apiButton');
    if (apiButton) {
        apiButton.disabled = false;
    }
}

function disableApiButton() {
    const apiButton = document.getElementById('apiButton');
    if (apiButton) {
        apiButton.disabled = true;
    }
}
