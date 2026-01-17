//app.js
class Application {
    constructor() {
       this.authManager = new AuthManager();
        this.cartManager = new CartManager();
        this.deviceManager = new DeviceManager();
        this.promoManager = new PromoManager(this.cartManager);
        this.checkoutManager = new CheckoutManager(this.cartManager, this.promoManager, this.authManager);
        this.uploadManager = new UploadManager();
        this.studioManager = new StudioManager(this.cartManager, this.deviceManager, this.uploadManager);
        this.realTimeUpdates = new RealTimeUpdates(this.studioManager);
        this.navigationManager = new NavigationManager();
        this.uiManager = new UIManager(this.authManager, this.cartManager);
        this.consentManager = this.studioManager.consentManager; // Reference to consent manager
        
        // Pass realTimeUpdates to studioManager
        this.studioManager.setRealTimeUpdates(this.realTimeUpdates);
        
        // Set up global references
        window.app = this;
        window.signin = () => this.authManager.signin();
        window.signout = () => this.authManager.signout();
        window.getSession = () => this.authManager.getSession();
        window.isAuthenticated = () => this.authManager.isAuthenticated();
        window.getUserInfo = () => this.authManager.getUserInfo();
    }

    async initialize() {
        try {
            // Load saved promo if any
            this.promoManager.loadSavedPromo();
            
            // Initialize authentication FIRST
            await this.authManager.initialize();
            
            // Initialize cart badge
            this.cartManager.updateCartBadge();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Render initial UI - force update auth state
            this.uiManager.checkAuthAndUpdateUI();
            this.renderCurrentPage();
            
            // Set up token refresh
            this.authManager.setupTokenRefresh();
            
            console.log('Bloom application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    setupEventListeners() {
        // Floating cart click event - FIXED: Use event delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('#floating-cart')) {
                this.openCartModal();
            }
        });
        
        // Cart modal close event
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target.id === 'cart-modal' || e.target.classList.contains('cart-modal-close')) {
                    this.closeCartModal();
                }
            });
        }
    }

    openCartModal() {
        console.log('Opening cart modal'); // Debug log
        this.uiManager.renderCart();
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    closeCartModal() {
        const modal = document.getElementById('cart-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    navigateTo(page) {
        this.navigationManager.navigateTo(page);
    }

    renderCurrentPage() {
        const currentPage = this.navigationManager.getCurrentPage();
        
        // Hide all main sections first
        const sections = ['home', 'studio-page', 'checkout-page'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show the current page
        if (currentPage !== 'cart') {
            const targetElement = document.getElementById(`${currentPage}-page`) || document.getElementById(currentPage);
            if (targetElement) {
                targetElement.style.display = 'block';
            }
        }
    
        // Call page-specific render functions
        if (currentPage === 'studio') {
            this.uiManager.checkAuthAndUpdateUI();
            if (this.authManager.getUserInfo()) {
                this.studioManager.renderProductList();
            }
        } else if (currentPage === 'checkout') {
            this.uiManager.renderCheckout();
        }
    
        this.navigationManager.renderNavigation(currentPage);
        this.uiManager.showSessionInfo();
    }

    // Convenience methods for global access
    signin() { this.authManager.signin(); }
    signout() { this.authManager.signout(); }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new Application();
    await window.app.initialize();
});
