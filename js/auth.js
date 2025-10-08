const poolDomain = "auth.theweer.com";
const clientId = "7irso7dmmnp793egs9bhkl0t81";
const region = "us-east-1";

// Get current page without hash
const currentPage = window.location.origin + window.location.pathname;

// Parse hash parameters (Cognito puts tokens here after redirect)
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const idToken = hashParams.get("id_token");
const accessToken = hashParams.get("access_token");

// Check if we're on a product page
const isProductPage = window.location.pathname.includes('product1.html') || 
                     window.location.pathname.includes('product2.html');

// Store token if we got one from Cognito redirect
if (idToken) {
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('accessToken', accessToken);
    
    // Remove hash from URL for clean appearance
    window.history.replaceState(null, null, window.location.pathname);
    
    console.log("User logged in successfully");
}

// Get stored token
const storedToken = localStorage.getItem('idToken');

// If no token and on product page, redirect to login
if (!storedToken && isProductPage) {
    console.log("No token found, redirecting to login...");
    
    const loginUrl = `https://${poolDomain}/oauth2/authorize?` + 
        `client_id=${clientId}` +
        `&response_type=token` +
        `&scope=email+openid+profile` +
        `&redirect_uri=${encodeURIComponent(currentPage)}`;
    
    window.location.href = loginUrl;
} else if (storedToken) {
    console.log("User is authenticated");
}
