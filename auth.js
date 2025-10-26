// // // Cognito configuration
// // const cognitoConfig = {
// //     clientId: '7irso7dmmnp793egs9bhkl0t81',
// //     domain: 'auth.theweer.com',
// //     redirectUri: window.location.origin
// // };

// // // Check if user is authenticated
// // async function checkAuthStatus() {
// //     const authSection = document.getElementById('auth-section');
    
// //     try {
// //         // Check for authentication code in URL (callback from Cognito)
// //         const urlParams = new URLSearchParams(window.location.search);
// //         const code = urlParams.get('code');
        
// //         if (code) {
// //             // User just returned from Cognito - clear URL and show success
// //             window.history.replaceState({}, document.title, window.location.pathname);
// //             localStorage.setItem('cognitoToken', 'authenticated-' + Date.now());
// //             authSection.innerHTML = `
// //                 <div class="user-info">
// //                     <p>✅ Successfully authenticated! Welcome back.</p>
// //                     <button onclick="signOut()" class="btn-secondary">Sign Out</button>
// //                 </div>
// //             `;
// //             if (typeof updateProductContent === 'function') {
// //                 updateProductContent(true);
// //             }
// //             return;
// //         }

// //         // Check if we have a token in localStorage
// //         const token = localStorage.getItem('cognitoToken');
        
// //         if (token) {
// //             // User is signed in
// //             authSection.innerHTML = `
// //                 <div class="user-info">
// //                     <p>✅ You are signed in</p>
// //                     <button onclick="signOut()" class="btn-secondary">Sign Out</button>
// //                 </div>
// //             `;
// //             if (typeof updateProductContent === 'function') {
// //                 updateProductContent(true);
// //             }
// //         } else {
// //             // User is not signed in
// //             authSection.innerHTML = `
// //                 <div>
// //                     <p>🔒 You are not signed in</p>
// //                     <button onclick="signIn()" class="btn-primary">Sign In</button>
// //                     <button onclick="signUp()" class="btn-primary">Sign Up</button>
// //                 </div>
// //             `;
// //             if (typeof updateProductContent === 'function') {
// //                 updateProductContent(false);
// //             }
// //         }
// //     } catch (error) {
// //         console.error('Auth check error:', error);
// //         authSection.innerHTML = `
// //             <div>
// //                 <p>❌ Error checking authentication status</p>
// //                 <button onclick="signIn()" class="btn-primary">Sign In</button>
// //                 <button onclick="signUp()" class="btn-primary">Sign Up</button>
// //             </div>
// //         `;
// //     }
// // }

// // // Redirect to Cognito Hosted UI for sign in
// // function signIn() {
// //     const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
// //     const loginUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
// //     window.location.href = loginUrl;
// // }

// // // Redirect to Cognito Hosted UI for sign up
// // function signUp() {
// //     const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
// //     const signupUrl = `https://${cognitoConfig.domain}/oauth2/authorize?client_id=${cognitoConfig.clientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
// //     window.location.href = signupUrl;
// // }

// // // Sign out function
// // function signOut() {
// //     // Clear local storage
// //     localStorage.removeItem('cognitoToken');
    
// //     // Redirect to Cognito logout
// //     const redirectUri = encodeURIComponent(cognitoConfig.redirectUri);
// //     const logoutUrl = `https://${cognitoConfig.domain}/logout?client_id=${cognitoConfig.clientId}&logout_uri=${redirectUri}`;
// //     window.location.href = logoutUrl;
// // }
// // Cognito configuration
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

function clearSession() {
    localStorage.removeItem('cognitoSession');
    localStorage.removeItem('pkce_verifier');
}

function isAuthenticated() {
    const session = getSession();
    return !!(session && session.id_token);
}

function getUserInfo() {
    const session = getSession();
    if (session && session.id_token) {
        try {
            const payload = JSON.parse(atob(session.id_token.split('.')[1]));
            return {
                email: payload.email,
                sub: payload.sub,
                name: payload.name || payload.email
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
      + `&scope=email+openid+profile`
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
                <span>Welcome, ${userInfo.email}</span>
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
    
    let navHTML = '<div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">';
    navHTML += '<strong>Navigation:</strong> ';
    
    if (currentPage !== 'index.html' && currentPage !== '') {
        navHTML += '<a href="index.html" style="margin: 0 10px;">Home</a>';
    }
    
    if (currentPage !== 'case.html') {
        navHTML += '<a href="case.html" style="margin: 0 10px;">Phone Cases</a>';
    }
    
    navHTML += '</div>';
    navContainer.innerHTML = navHTML;
}

// Initialize auth for any page
async function initializeAuth() {
    await handleCodeExchange();
    renderNavigation();
    
    // Render auth UI if container exists
    const authContainer = document.querySelector('[id*="auth"], #auth-action, #auth-container');
    if (authContainer) {
        renderAuthUI(authContainer.id);
    }
    
    return isAuthenticated();
}

// Make functions available globally
window.signin = signin;
window.signout = signout;
window.getSession = getSession;
window.isAuthenticated = isAuthenticated;
window.getUserInfo = getUserInfo;
