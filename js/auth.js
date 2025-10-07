const poolDomain = "YOUR_COGNITO_DOMAIN"; // e.g. theweer.auth.us-east-1.amazoncognito.com
const clientId = "YOUR_APP_CLIENT_ID";
const redirectUri = window.location.href;
const region = "us-east-1";

// Parse query string
const params = new URLSearchParams(window.location.hash.substring(1));
const idToken = params.get("id_token");

// If no token, redirect to login
if (!idToken) {
  const loginUrl = `https://${poolDomain}/login?client_id=${clientId}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = loginUrl;
} else {
  console.log("User logged in with token:", idToken);
}
