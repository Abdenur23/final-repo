// Cognito Configuration
const poolData = {
    UserPoolId: 'us-east-1_TJDOamTpp',
    ClientId: '7irso7dmmnp793egs9bhkl0t81'
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// OAuth Configuration for Google
const cognitoDomain = 'https://auth.theweer.com';
const redirectUri = 'https://theweer.com/'; // Must match your allowed callback URL

// DOM Elements
let currentUser = null;

// Show/Hide sections
function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('user-section').classList.add('hidden');
    clearMessage();
}

function showSignup() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.remove('hidden');
    document.getElementById('user-section').classList.add('hidden');
    clearMessage();
}

function showUserSection() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('user-section').classList.remove('hidden');
}

// Message handling
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
}

function clearMessage() {
    document.getElementById('message').classList.add('hidden');
}

// Google Login function
function googleLogin() {
    // Construct the Cognito Hosted UI URL for Google
    const authUrl = `${cognitoDomain}/oauth2/authorize?` +
        `identity_provider=Google&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `client_id=${poolData.ClientId}&` +
        `scope=email+openid+phone+profile`;
    
    // Redirect to Cognito Hosted UI for Google login
    window.location.href = authUrl;
}

// Handle OAuth callback when returning from Google login
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
        showMessage(`OAuth error: ${error}`, 'error');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    if (code) {
        showMessage('Exchanging authorization code for tokens...', 'success');
        
        // Exchange authorization code for tokens
        exchangeCodeForTokens(code);
    }
}

// Exchange authorization code for Cognito tokens
function exchangeCodeForTokens(code) {
    const tokenUrl = `${cognitoDomain}/oauth2/token`;
    
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: poolData.ClientId,
        code: code,
        redirect_uri: redirectUri
    });
    
    fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            // Store tokens
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('idToken', data.id_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            
            // Get user info
            getUserInfo(data.access_token);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            throw new Error(data.error || 'Failed to get tokens');
        }
    })
    .catch(error => {
        showMessage('Token exchange failed: ' + error.message, 'error');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    });
}

// Get user information using access token
function getUserInfo(accessToken) {
    const userInfoUrl = `${cognitoDomain}/oauth2/userInfo`;
    
    fetch(userInfoUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(userInfo => {
        showMessage('Google login successful!', 'success');
        displayUserInfo(userInfo);
        showUserSection();
    })
    .catch(error => {
        showMessage('Failed to get user info: ' + error.message, 'error');
    });
}

// Regular login function (kept from previous version)
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }

    const authenticationData = {
        Username: username,
        Password: password,
    };

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    const userData = {
        Username: username,
        Pool: userPool
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            currentUser = cognitoUser;
            const idToken = result.getIdToken().getJwtToken();
            const accessToken = result.getAccessToken().getJwtToken();
            const refreshToken = result.getRefreshToken().getToken();
            
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            showMessage('Login successful!', 'success');
            displayUserInfo(result.getIdToken().payload);
            showUserSection();
        },
        onFailure: function (err) {
            showMessage('Login failed: ' + err.message, 'error');
        }
    });
}

// Signup function (kept from previous version)
function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const email = document.getElementById('signup-email').value;

    if (!username || !password || !email) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    const attributeList = [];
    const emailAttribute = {
        Name: 'email',
        Value: email
    };
    const emailAttr = new AmazonCognitoIdentity.CognitoUserAttribute(emailAttribute);
    attributeList.push(emailAttr);

    userPool.signUp(username, password, attributeList, null, function (err, result) {
        if (err) {
            showMessage('Signup failed: ' + err.message, 'error');
            return;
        }
        currentUser = result.user;
        showMessage('Signup successful! Please check your email for verification code.', 'success');
        setTimeout(() => {
            showLogin();
        }, 2000);
    });
}

// Display user information
function displayUserInfo(userData) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
        <p><strong>Username:</strong> ${userData['cognito:username'] || userData.username || userData.email}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        ${userData.name ? `<p><strong>Name:</strong> ${userData.name}</p>` : ''}
        <p><strong>Login Method:</strong> ${userData.identities ? 'Google' : 'Email/Password'}</p>
    `;
}

// Call protected API (example)
function callProtectedAPI() {
    const idToken = localStorage.getItem('idToken');
    
    if (!idToken) {
        showMessage('No authentication token found', 'error');
        return;
    }

    fetch('/your-protected-endpoint', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API call failed');
        }
        return response.json();
    })
    .then(data => {
        showMessage('Protected API call successful!', 'success');
        console.log('API response:', data);
    })
    .catch(error => {
        showMessage('API call failed: ' + error.message, 'error');
    });
}

// Logout function
function logout() {
    if (currentUser) {
        currentUser.signOut();
    }
    
    // Clear stored tokens
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    currentUser = null;
    showMessage('Logged out successfully', 'success');
    showLogin();
}

// Check if user is already logged in on page load
window.onload = function() {
    // First check for OAuth callback
    handleOAuthCallback();
    
    // Then check for regular Cognito session
    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser) {
        cognitoUser.getSession(function (err, session) {
            if (err || !session.isValid()) {
                showLogin();
            } else {
                currentUser = cognitoUser;
                const idToken = session.getIdToken().getJwtToken();
                localStorage.setItem('idToken', idToken);
                displayUserInfo(session.getIdToken().payload);
                showUserSection();
                showMessage('Welcome back!', 'success');
            }
        });
    }
};
