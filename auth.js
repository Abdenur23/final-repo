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

async function checkAuthStatus() {
    const authSection = document.getElementById('auth-section');
    const uploadSection = document.getElementById('upload-section');
    const cidDisplay = document.getElementById('cid-display');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Exchange code for token + get CID from backend
            const response = await fetch('https://YOUR_API_GATEWAY/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            const data = await response.json();
            if (data.cid) {
                localStorage.setItem('cid', data.cid);
                cidDisplay.style.display = 'block';
                cidDisplay.innerHTML = `🆔 Your Customer ID: ${data.cid}`;
            }

            localStorage.setItem('cognitoToken', data.token || 'authenticated-' + Date.now());
            window.history.replaceState({}, document.title, window.location.pathname);

            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ Successfully authenticated! Welcome back.</p>
                    <button onclick="signOut()" class="btn-secondary">Sign Out</button>
                </div>
            `;
            uploadSection.style.display = 'block';
            if (typeof updateProductContent === 'function') updateProductContent(true);
            return;
        }

        const token = localStorage.getItem('cognitoToken');
        const storedCid = localStorage.getItem('cid');

        if (token) {
            authSection.innerHTML = `
                <div class="user-info">
                    <p>✅ You are signed in</p>
                    <button onclick="signOut()" class="btn-secondary">Sign Out</button>
                </div>
            `;
            uploadSection.style.display = 'block';

            if (storedCid) {
                cidDisplay.style.display = 'block';
                cidDisplay.innerHTML = `🆔 Your Customer ID: ${storedCid}`;
            }

            if (typeof updateProductContent === 'function') updateProductContent(true);
        } else {
            authSection.innerHTML = `
                <div>
                    <p>🔒 You are not signed in</p>
                    <button onclick="signIn()" class="btn-primary">Sign In</button>
                    <button onclick="signUp()" class="btn-primary">Sign Up</button>
                </div>
            `;
            uploadSection.style.display = 'none';
            cidDisplay.style.display = 'none';
            if (typeof updateProductContent === 'function') updateProductContent(false);
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
        uploadSection.style.display = 'none';
        cidDisplay.style.display = 'none';
    }
}
