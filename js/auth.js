const poolDomain = "auth.theweer.com";
// Temporary fix - use Cognito domain while DNS propagates
const poolDomain = "us-east-1tjdoamtpp.auth.us-east-1.amazoncognito.com";
// OR keep your custom domain but be patient for DNS
const clientId = "7irso7dmmnp793egs9bhkl0t81";
const redirectUri = window.location.href;
const region = "us-east-1";

// Parse query string
const params = new URLSearchParams(window.location.hash.substring(1));
const idToken = params.get("id_token");

// If no token, redirect to login
if (!idToken) {
  const loginUrl = `https://${poolDomain}/oauth2/authorize?client_id=${clientId}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = loginUrl;
} else {
  console.log("User logged in with token:", idToken);
}
