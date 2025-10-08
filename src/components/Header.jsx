import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, signOut, redirectToLogin, redirectToSignup } from '../auth/cognitoAuth';

const Header = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="logo">The Weer</div>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/product1">Product 1</Link></li>
            <li><Link to="/product2">Product 2</Link></li>
          </ul>
          <div className="auth-section">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Welcome, {user.attributes.email || user.username}!</span>
                <button onClick={handleSignOut} className="btn btn-secondary">
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={redirectToLogin} className="btn btn-primary">
                  Sign In
                </button>
                <button onClick={redirectToSignup} className="btn btn-primary">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
