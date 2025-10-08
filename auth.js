// Cognito configuration
const cognitoConfig = {
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin
};

// Check if user is authenticated
async function checkAuthStatus() {
    const authSection = document.getElementById('auth-section');
    
    try {
        // Check for authentication code in URL (callback from Cognito)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // User just returned from Cognito - clear URL and show success
            window.history.replaceState({}, document.title, window.location.pathname);
            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ Successfully authenticated! Welcome back.</p>
                    <button onclick="signOut()">Sign Out</button>
                </div>
            `;
            if (typeof updateProductContent === 'function') {
                updateProductContent(true);
            }
            return;
        }

        // Check if we have a token in localStorage (simple check)
        const token = localStorage.getItem('cognitoToken');
        
        if (token) {
            // User is signed in
            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ You are signed in</p>
                    <button onclick="signOut()">Sign Out</button>
                </div>
            `;
            if (typeof updateProductContent === 'function') {
                updateProductContent(true);
            }
        } else {
            // User is not signed in
            authSection.innerHTML = `
                <div>
                    <p>🔒 You are not signed in</p>
                    <button onclick="signIn()">Sign In</button>
                    <button onclick="signUp()">Sign Up</button>
                </div>
            `;
            if (typeof updateProductContent === 'function') {
                updateProductContent(false);
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        authSection.innerHTML = `
            <div>
                <p>❌ Error checking authentication status</p>
                <button onclick="signIn()">Sign In</button>
                <button onclick="signUp()">Sign Up</button>
            </div>
        `;
    }
}

// Redirect to Cognito Hosted UI for sign in
function signIn() {
    const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
    const loginUrl = `https://${cognitoConfig.domain}/login?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
}

// Redirect to Cognito Hosted UI for sign up
function signUp() {
    const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
    const signupUrl = `https://${cognitoConfig.domain}/signup?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
    window.location.href = signupUrl;
}

// Sign out function
function signOut() {
    // Clear local storage
    localStorage.removeItem('cognitoToken');
    
    // Redirect to Cognito logout
    const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
    const logoutUrl = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${redirectUri}`;
    window.location.href = logoutUrl;
}

// Simple token storage simulation (for demo purposes)
// In a real app, you'd properly handle the Cognito callback and store tokens securely
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Simulate storing a token
        localStorage.setItem('cognitoToken', 'demo-token-' + Date.now());
    }
});
