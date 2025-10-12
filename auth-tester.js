// auth-tester.js

// --- 1. CONFIGURE COGNITO DETAILS ---
const COGNITO_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_TJDOamTpp',
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: 'https://theweer.com/tester.html',
    // We request the ID Token and Access Token directly using the 'token' response type (Implicit Flow)
    responseType: 'token', 
    scope: 'openid profile email' // Scopes define the information requested
};

/**
 * Builds the URL to redirect to the Cognito Hosted UI for sign-in/sign-up.
 * @returns {string} The Cognito authorize endpoint URL.
 */
function getSignInUrl() {
    const { domain, clientId, redirectUri, responseType, scope } = COGNITO_CONFIG;
    const authUrl = `https://${domain}/oauth2/authorize?` +
        `response_type=${responseType}&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}`;
    return authUrl;
}

/**
 * Parses the tokens from the URL hash (e.g., #id_token=...&access_token=...).
 * @returns {Object|null} An object containing the tokens, or null if none found.
 */
function parseTokensFromHash() {
    // Check for tokens in the URL hash
    if (window.location.hash) {
        const hash = window.location.hash.substring(1); // Remove '#'
        const params = new URLSearchParams(hash.replace(/&/g, ',').replace(/=/g, '§')); // Simple parsing hack for hash
        
        const tokens = {};
        hash.split('&').forEach(pair => {
            let parts = pair.split('=');
            if (parts.length === 2) {
                tokens[parts[0]] = parts[1];
            }
        });

        // Cognito returns id_token and access_token on successful implicit flow
        if (tokens.id_token && tokens.access_token) {
            // Clean the URL hash for a cleaner UI/UX after tokens are parsed
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
            return tokens;
        }
    }
    return null;
}

/**
 * Decodes the body of a JSON Web Token (JWT).
 * @param {string} token The JWT string.
 * @returns {Object} The decoded token payload.
 */
function decodeToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { error: "Invalid JWT format" };
        }
        const encodedPayload = parts[1];
        // Replace base64url characters with base64 standard characters
        const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
        // Decode and parse the JSON payload
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (e) {
        return { error: "Failed to decode token", details: e.message };
    }
}


/**
 * Main function to check auth status and update the UI.
 */
function checkAuthStatus() {
    const tokens = parseTokensFromHash();
    const tokenDisplay = document.getElementById('token-display');
    const authAction = document.getElementById('auth-action');

    if (tokens) {
        // --- USER IS SIGNED IN ---
        
        // 1. Display Sign-Out button
        authAction.innerHTML = `<button onclick="signOutUser()">Sign Out</button>`;
        
        // 2. Decode and display tokens (ID Token is typically used for user info)
        const idTokenPayload = decodeToken(tokens.id_token);
        const accessTokenPayload = decodeToken(tokens.access_token);

        const decodedOutput = `
            <h2>✅ User is Signed In</h2>
            <p><strong>Professional Terminology:</strong> JSON Web Tokens (JWTs) have been successfully retrieved via the Implicit Grant Flow.</p>
            
            <h3>ID Token (User Identity)</h3>
            <pre>${JSON.stringify(idTokenPayload, null, 2)}</pre>
            <p><strong>JWT Value:</strong></p>
            <textarea readonly>${tokens.id_token}</textarea>

            <h3>Access Token (API Authorization)</h3>
            <pre>${JSON.stringify(accessTokenPayload, null, 2)}</pre>
            <p><strong>JWT Value:</strong></p>
            <textarea readonly>${tokens.access_token}</textarea>
        `;
        tokenDisplay.innerHTML = decodedOutput;

    } else {
        // --- USER IS NOT SIGNED IN ---
        
        // 1. Display Sign-In button/prompt
        authAction.innerHTML = `<button onclick="promptCognito()">Sign In / Sign Up with Cognito</button>`;
        
        // 2. Display status
        tokenDisplay.innerHTML = `
            <h2>❌ User Not Authenticated</h2>
            <p>Please sign in to access content.</p>
        `;
    }
}

/**
 * Initiates the sign-in/sign-up flow by redirecting to the Cognito Hosted UI.
 */
function promptCognito() {
    window.location.href = getSignInUrl();
}

/**
 * Initiates the sign-out flow by redirecting to the Cognito logout endpoint.
 */
function signOutUser() {
    const { domain, clientId, redirectUri } = COGNITO_CONFIG;
    const logoutUrl = `https://${domain}/logout?` +
        `client_id=${clientId}&` +
        `logout_uri=${encodeURIComponent(redirectUri)}`;
        
    window.location.href = logoutUrl;
}

// Start the authentication check when the script loads
checkAuthStatus();
