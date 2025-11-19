//app.js
// Main application orchestrator
class Application {
    constructor() {
        this.authManager = new AuthManager();
        this.cartManager = new CartManager();
        this.promoManager = new PromoManager(this.cartManager);
        this.studioManager = new StudioManager(this.cartManager);
        this.navigationManager = new NavigationManager();
        this.uiManager = new UIManager(this.authManager, this.cartManager);
        
        // Set up global references
        window.app = this;
        window.signin = () => this.authManager.signin();
        window.signout = () => this.authManager.signout();
        window.getSession = () => this.authManager.getSession();
        window.isAuthenticated = () => this.authManager.isAuthenticated();
        window.getUserInfo = () => this.authManager.getUserInfo();
    }

    async initialize() {
        // Load saved promo if any
        this.promoManager.loadSavedPromo();
        
        // Initialize authentication
        const isAuthenticatedStatus = await this.authManager.initialize();
        
        // Initialize cart badge
        this.cartManager.updateCartBadge();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Render initial UI
        this.renderCurrentPage();
        
        // Set up token refresh
        this.authManager.setupTokenRefresh();
        
        console.log('Bloom application initialized successfully');
    }

    setupEventListeners() {
        // Floating cart click event
        const floatingCart = document.getElementById('floating-cart');
        if (floatingCart) {
            floatingCart.addEventListener('click', () => {
                this.openCartModal();
            });
        }
        
        // Cart modal close event
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target.id === 'cart-modal') {
                    this.closeCartModal();
                }
            });
        }
    }

    openCartModal() {
        this.uiManager.renderCart();
        document.getElementById('cart-modal').style.display = 'flex';
    }
    
    closeCartModal() {
        document.getElementById('cart-modal').style.display = 'none';
    }

    navigateTo(page) {
        this.navigationManager.navigateTo(page);
    }

    renderCurrentPage() {
        const currentPage = this.navigationManager.getCurrentPage();
        
        // Hide all main sections first
        const sections = ['homepage', 'studio-page', 'checkout-page'];
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
