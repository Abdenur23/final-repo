import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import cognitoConfig from './config.js';

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.UserPoolId,
  ClientId: cognitoConfig.ClientId
});

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    
    if (!user) {
      resolve(null);
      return;
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }
      
      user.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }
        
        const userData = {
          username: user.getUsername(),
          attributes: {}
        };
        
        attributes.forEach(attr => {
          userData.attributes[attr.Name] = attr.Value;
        });
        
        resolve(userData);
      });
    });
  });
};

export const signOut = () => {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
  window.location.href = '/';
};

export const redirectToLogin = () => {
  const redirectUri = encodeURIComponent(window.location.origin);
  const loginUrl = `https://${cognitoConfig.Domain}/login?client_id=${cognitoConfig.ClientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
  window.location.href = loginUrl;
};

export const redirectToSignup = () => {
  const redirectUri = encodeURIComponent(window.location.origin);
  const signupUrl = `https://${cognitoConfig.Domain}/signup?client_id=${cognitoConfig.ClientId}&response_type=code&scope=email+openid&redirect_uri=${redirectUri}`;
  window.location.href = signupUrl;
};
