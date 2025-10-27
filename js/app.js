class Application {
    constructor() {
        this.deviceManager = null;
        this.promoManager = null;
        this.uploadManager = null;
        this.realtimeUpdates = null;
    }

    async initialize() {
        // Initialize managers
        this.promoManager = new PromoManager();
        this.deviceManager = new DeviceManager();
        this.uploadManager = new UploadManager(this.deviceManager, this.promoManager);
        this.realtimeUpdates = new RealTimeUpdates(this.promoManager, this.uploadManager);

        // Set up global references
        window.app = this;

        // Initialize auth and UI
        const isAuthenticated = await initializeAuth();
        this.showSessionInfo();
        this.toggleAppContent(isAuthenticated);

        if (isAuthenticated) {
            this.realtimeUpdates.initialize();
        }
    }

    showSessionInfo() {
        const userInfo = getUserInfo();
        const tokenDiv = document.getElementById('token-display');
        
        if (userInfo) {
            const session = getSession();
            const payload = JSON.parse(atob(session.id_token.split('.')[1]));
            tokenDiv.innerHTML = `<h2>Signed in as ${userInfo.displayName}</h2>
            <pre>${JSON.stringify(payload, null, 2)}</pre>`;
        } else {
            tokenDiv.innerHTML = `<h2>Not signed in</h2>`;
        }
    }

    toggleAppContent(show) {
        const appContent = document.getElementById('app-content');
        const authRequired = document.getElementById('auth-required-message');
        const promoSection = document.getElementById('promoSection');
        
        if (show) {
            appContent.style.display = 'block';
            authRequired.style.display = 'none';
            promoSection.style.display = 'block'; // Always show promo when authenticated
            this.deviceManager.updateDeviceOptions();
        } else {
            appContent.style.display = 'none';
            authRequired.style.display = 'block';
            promoSection.style.display = 'none';
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
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new Application();
    await window.app.initialize();
});
