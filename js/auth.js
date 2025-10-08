const poolDomain = "auth.theweer.com";
const clientId = "7irso7dmmnp793egs9bhkl0t81";
const redirectUri = window.location.origin + window.location.pathname;
const region = "us-east-1";

// Parse query string for token (Cognito redirects with hash fragment)
const params = new URLSearchParams(window.location.hash.substring(1));
const idToken = params.get("id_token");

// Check if we're on a product page
const isProductPage = window.location.pathname.includes('product1.html') || 
                     window.location.pathname.includes('product2.html');

// If no token AND we're on a product page, redirect to login
if (!idToken && isProductPage) {
    const loginUrl = `https://${poolDomain}/oauth2/authorize?client_id=${clientId}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl;
} else if (idToken) {
    console.log("User logged in with token:", idToken);
    
    // Store token for future use
    localStorage.setItem('idToken', idToken);
    
    // Clean URL by removing hash fragment after login
    if (window.location.hash) {
        window.history.replaceState(null, null, window.location.pathname);
    }
}
