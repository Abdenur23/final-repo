// // Cognito configuration
// const cognitoConfig = {
//     clientId: '7irso7dmmnp793egs9bhkl0t81',
//     domain: 'auth.theweer.com',
//     redirectUri: window.location.origin
// };

// // Check if user is authenticated
// async function checkAuthStatus() {
//     const authSection = document.getElementById('auth-section');
    
//     try {
//         // Check for authentication code in URL (callback from Cognito)
//         const urlParams = new URLSearchParams(window.location.search);
//         const code = urlParams.get('code');
        
//         if (code) {
//             // User just returned from Cognito - clear URL and show success
//             window.history.replaceState({}, document.title, window.location.pathname);
//             localStorage.setItem('cognitoToken', 'authenticated-' + Date.now());
//             authSection.innerHTML = `
//                 <div class="user-info">
//                     <p>✅ Successfully authenticated! Welcome back.</p>
//                     <button onclick="signOut()" class="btn-secondary">Sign Out</button>
//                 </div>
//             `;
//             if (typeof updateProductContent === 'function') {
//                 updateProductContent(true);
//             }
//             return;
//         }

//         // Check if we have a token in localStorage
//         const token = localStorage.getItem('cognitoToken');
        
//         if (token) {
//             // User is signed in
//             authSection.innerHTML = `
//                 <div class="user-info">
//                     <p>✅ You are signed in</p>
//                     <button onclick="signOut()" class="btn-secondary">Sign Out</button>
//                 </div>
//             `;
//             if (typeof updateProductContent === 'function') {
//                 updateProductContent(true);
//             }
//         } else {
//             // User is not signed in
//             authSection.innerHTML = `
//                 <div>
//                     <p>🔒 You are not signed in</p>
//                     <button onclick="signIn()" class="btn-primary">Sign In</button>
//                     <button onclick="signUp()" class="btn-primary">Sign Up</button>
//                 </div>
//             `;
//             if (typeof updateProductContent === 'function') {
//                 updateProductContent(false);
//             }
//         }
//     } catch (error) {
//         console.error('Auth check error:', error);
//         authSection.innerHTML = `
//             <div>
//                 <p>❌ Error checking authentication status</p>
//                 <button onclick="signIn()" class="btn-primary">Sign In</button>
//                 <button onclick="signUp()" class="btn-primary">Sign Up</button>
//             </div>
//         `;
//     }
// }

// // Redirect to Cognito Hosted UI for sign in
// function signIn() {
//     const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
//     const loginUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
//     window.location.href = loginUrl;
// }

// // Redirect to Cognito Hosted UI for sign up
// function signUp() {
//     const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
//     const signupUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
//     window.location.href = signupUrl;
// }

// // Sign out function
// function signOut() {
//     // Clear local storage
//     localStorage.removeItem('cognitoToken');
    
//     // Redirect to Cognito logout
//     const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
//     const logoutUrl = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${redirectUri}`;
//     window.location.href = logoutUrl;
// }
// Cognito configuration
// Cognito configuration
const cognitoConfig = {
    clientId: '7irso7dmmnp793egs9bhkl0t81',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin
};

// Decode JWT token payload
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to parse JWT', e);
        return null;
    }
}

// Get current user sub
function getCurrentUserSub() {
    const token = localStorage.getItem('cognitoToken');
    if (!token) return null;
    const payload = parseJwt(token);
    return payload ? payload.sub : null;
}

// Check if user is authenticated
async function checkAuthStatus() {
    const authSection = document.getElementById('auth-section');
    
    try {
        // Check for authentication code in URL (callback from Cognito)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            // Exchange code for tokens
            const body = new URLSearchParams();
            body.append('grant_type', 'authorization_code');
            body.append('client_id', cognitoConfig.clientId);
            body.append('code', code);
            body.append('redirect_uri', cognitoConfig.redirectUri);

            const tokenResponse = await fetch(`https://${cognitoConfig.domain}/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            });

            const tokenData = await tokenResponse.json();
            const idToken = tokenData.id_token;

            if (!idToken) throw new Error('Failed to get ID token from Cognito');

            localStorage.setItem('cognitoToken', idToken);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const token = localStorage.getItem('cognitoToken');
        
        if (token) {
            const userSub = getCurrentUserSub();
            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ You are signed in</p>
                    <p>🆔 Your user sub: ${userSub}</p>
                    <button onclick="signOut()" class="btn-secondary">Sign Out</button>
                </div>
            `;
        } else {
            authSection.innerHTML = `
                <div>
                    <p>🔒 You are not signed in</p>
                    <button onclick="signIn()" class="btn-primary">Sign In</button>
                    <button onclick="signUp()" class="btn-primary">Sign Up</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        authSection.innerHTML = `
            <div>
                <p>❌ Error checking authentication status</p>
                <button onclick="signIn()" class="btn-primary">Sign In</button>
                <button onclick="signUp()" class="btn-primary">Sign Up</button>
            </div>
        `;
    }
}

// Redirect to Cognito Hosted UI for sign in
function signIn() {
    const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
    const loginUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
}

// Redirect to Cognito Hosted UI for sign up
function signUp() {
    signIn(); // Using the same Hosted UI link
}

// Sign out function
function signOut() {
    localStorage.removeItem('cognitoToken');
    const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
    const logoutUrl = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${redirectUri}`;
    window.location.href = logoutUrl;
}

// Run auth check on page load
window.onload = checkAuthStatus;
