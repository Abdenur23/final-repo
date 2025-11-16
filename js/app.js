class Application {
    constructor() {
        this.deviceManager = null;
        this.promoManager = null;
        this.uploadManager = null;
        this.realtimeUpdates = null;
        this.cartManager = null;
    }

    async initialize() {
        // Initialize managers
        this.promoManager = new PromoManager();
        this.deviceManager = new DeviceManager();
        this.uploadManager = new UploadManager(this.deviceManager, this.promoManager);
        this.realtimeUpdates = new RealTimeUpdates(this.promoManager, this.uploadManager);
        this.cartManager = new CartManager()
         // Apply new theme classes to existing elements
        this.applyNewTheme();
        // Set up global references
        window.app = this;

        // Initialize auth and UI
        const isAuthenticated = await initializeAuth();
        
        // Force re-check of actual authentication status
        const actualAuthStatus = isAuthenticated && !isTokenExpired();
        
        this.showSessionInfo();
        this.toggleAppContent(actualAuthStatus);
        this.renderAuthActions();
    
        if (actualAuthStatus) {
            this.realtimeUpdates.initialize();
        }
    }
    applyNewTheme() {
        // This will automatically apply to elements with existing classes
        // The new CSS will override the old styles
        console.log('New theme applied!');
    }
    showSessionInfo() {
        const userInfo = getUserInfo();
        const tokenDiv = document.getElementById('token-display');
        
        if (userInfo) {
            const session = getSession();
            const payload = JSON.parse(atob(session.id_token.split('.')[1]));
            tokenDiv.innerHTML = `<h2>Signed in as ${userInfo.displayName}</h2>`;
        } else {
            tokenDiv.innerHTML = `<h2>Not signed in</h2>`;
        }
    }

    renderAuthActions() {
        const authActionDiv = document.getElementById('auth-action');
        const userInfo = getUserInfo();
        
        if (userInfo) {
            authActionDiv.innerHTML = `
                <p>Welcome, <strong>${userInfo.displayName}</strong>!</p>
                <button onclick="window.app.signout()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Sign Out
                </button>
            `;
        } else {
            authActionDiv.innerHTML = `
                <button onclick="window.app.signin()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Sign In / Sign Up
                </button>
            `;
        }
        
        // Update the main UI visibility
        if (window.checkAuthAndUpdateUI) {
            checkAuthAndUpdateUI();
        }
    }

    toggleAppContent(show) {
        const appContent = document.getElementById('app-content');
        const authRequired = document.getElementById('auth-required-message');
        const promoSection = document.getElementById('promoSection');
        const deviceSection = document.querySelector('.device-selection'); // Add device section
        
        // Check if session is actually valid
        const isActuallyAuthenticated = show && isAuthenticated();
        
        if (isActuallyAuthenticated) {
            appContent.style.display = 'block';
            authRequired.style.display = 'none';
            promoSection.style.display = 'block';
            if (deviceSection) deviceSection.style.display = 'block';
            this.deviceManager.updateDeviceOptions();
        } else {
            appContent.style.display = 'none';
            authRequired.style.display = 'block';
            promoSection.style.display = 'none';
            if (deviceSection) deviceSection.style.display = 'none';
            // Clear any sensitive data
            this.promoManager.clearPromoData();
        }
    }

    // Global functions for HTML onclick handlers
    applyPromoCode() {
        this.promoManager.applyPromoCode();
    }

    uploadFiles() {
        this.uploadManager.uploadFiles();
    }

    startOver() {
        this.uploadManager.startOver();
    }

    // Auth functions
    signin() {
        signin();
    }

    signout() {
        // Clear promo data through the manager
        this.promoManager.clearPromoData();
        
        // Call the global signout function
        signout();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new Application();
    await window.app.initialize();
});
