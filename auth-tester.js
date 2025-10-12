// Cognito Configuration
const poolData = {
    UserPoolId: 'us-east-1_TJDOamTpp', // Extract from your domain info
    ClientId: '7irso7dmmnp793egs9bhkl0t81'
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

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

// Login function
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
            
            // Store tokens for later use
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            showMessage('Login successful!', 'success');
            displayUserInfo(result.getIdToken().payload);
            showUserSection();
        },
        onFailure: function (err) {
            showMessage('Login failed: ' + err.message, 'error');
        },
        newPasswordRequired: function (userAttributes, requiredAttributes) {
            // Handle case where user needs to set new password
            showMessage('New password required', 'error');
        }
    });
}

// Signup function
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
        
        // After signup, you might want to automatically switch to verification
        // or keep the user logged in if auto-confirm is enabled
        setTimeout(() => {
            showLogin();
        }, 2000);
    });
}

// Display user information
function displayUserInfo(userData) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
        <p><strong>Username:</strong> ${userData['cognito:username'] || userData.username}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>User ID:</strong> ${userData.sub}</p>
    `;
}

// Call protected API (example)
function callProtectedAPI() {
    const idToken = localStorage.getItem('idToken');
    
    if (!idToken) {
        showMessage('No authentication token found', 'error');
        return;
    }

    // Example API call with authorization header
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
    } else {
        showLogin();
    }
};
