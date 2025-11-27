//ui-manager.js
// UI rendering and management
class UIManager {
    constructor(authManager, cartManager) {
        this.authManager = authManager;
        this.cartManager = cartManager;
    }

    renderAuthUI() {
        const authDiv = document.getElementById('auth-action');
        if (!authDiv) return;
        
        const userInfo = this.authManager.getUserInfo();
        
        if (userInfo) {
            authDiv.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="text-sm font-medium">Welcome, ${userInfo.displayName}</span>
                    <button onclick="window.app.authManager.signout()" class="px-3 py-1 bg-red-500 text-white text-sm rounded-full shadow-md hover:bg-red-600">Sign Out</button>
                </div>
            `;
        } else {
            authDiv.innerHTML = `
                <button onclick="window.app.authManager.signin()" class="cta-gold px-4 py-2 text-sm font-semibold rounded-full shadow-lg">Sign In / Sign Up</button>
            `;
        }
    }

    checkAuthAndUpdateUI() {
        const userInfo = this.authManager.getUserInfo();
        
        // Always update auth UI in header
        this.renderAuthUI();
        
        const appContentBox = document.getElementById('app-content-box');
        const authRequired = document.getElementById('auth-required-message');
        
        if (appContentBox && authRequired) {
            if (userInfo) {
                appContentBox.style.display = 'block';
                authRequired.style.display = 'none';
            } else {
                appContentBox.style.display = 'none';
                authRequired.style.display = 'block';
                
                // Update auth required message to be more inviting
                authRequired.innerHTML = `
                    <div class="text-center p-10 bg-blush-start border border-magenta rounded-lg mb-6">
                        <p class="font-bold text-xl mb-2">Join the Bloom Community</p>
                        <p class="mb-4">Sign in to create and view your personalized blooms</p>
                        <button onclick="window.app.authManager.signin()" class="cta-gold px-6 py-2 text-sm font-semibold rounded-full shadow-lg">
                            Sign In / Sign Up to Begin
                        </button>
                    </div>
                `;
            }
        }
        
        this.showSessionInfo();
    }

    showSessionInfo() {
        // This is now handled in the header auth UI
        const tokenDiv = document.getElementById('token-display');
        if (tokenDiv) {
            tokenDiv.innerHTML = '';
        }
    }

    updateGiftWrappingSection() {
        const section = document.getElementById('gift-wrapping-section');
        if (!section) return;
        
        const hasGiftWrapping = this.cartManager.hasGiftWrapping();
        
        if (hasGiftWrapping) {
            section.innerHTML = `
                <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🎁</span>
                        <div>
                            <p class="font-semibold">Gift Wrapping & Personal Note - $30</p>
                            <p class="text-sm text-gray-600">We'll use recipient's address for shipping</p>
                        </div>
                    </div>
                    <button onclick="window.app.cartManager.removeGiftWrapping()" class="text-red-500 hover:text-red-700 text-sm">
                        Remove
                    </button>
                </div>
            `;
        } else {
            section.innerHTML = `
                <button onclick="window.app.cartManager.addGiftWrapping()" class="w-full text-left p-4 border-2 border-dashed border-gold rounded-lg hover:bg-gold/10 transition-all duration-200">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🎁</span>
                        <div>
                            <p class="font-semibold">Add Gift Wrapping & Personal Note - $30</p>
                            <p class="text-sm text-gray-600">We'll beautifully wrap your bloom and use recipient's address for shipping</p>
                        </div>
                    </div>
                </button>
            `;
        }
    }

    renderCart() {
        const cart = this.cartManager.getCart();
        const container = document.getElementById('cart-items-container');
        const totals = this.cartManager.getCartTotal();
        
        if (!container) {
            console.error('Cart container not found');
            return;
        }
        
        const cartTotalDisplay = document.getElementById('cart-total-display');
        const checkoutButton = document.getElementById('checkout-button');
        
        if (cartTotalDisplay) {
            cartTotalDisplay.innerText = `$${totals.total}`;
        }
        
        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
        }
    
        if (cart.length === 0) {
            container.innerHTML = `<div id="empty-cart-message" class="text-center p-8 border border-gray-200 rounded-lg">
                Your cart is empty. <a href="#" onclick="window.app.closeCartModal(); window.app.navigateTo('studio')" class="text-magenta font-semibold">Begin the bloom</a>.
            </div>`;
            return;
        }
    
        container.innerHTML = cart.map(item => `
            <div class="flex items-center p-4 border border-gray-100 rounded-lg shadow-sm ${item.isGiftWrapping ? 'bg-green-50 border-green-200' : ''}">
                <div class="w-16 h-16 ${item.isGiftWrapping ? 'bg-green-100 text-2xl flex items-center justify-center' : 'bg-gray-100'} mr-4 flex-shrink-0 rounded-md">
                    ${item.isGiftWrapping ? item.thumbnail : `<img src="${item.thumbnail}" class="w-full h-full object-contain rounded-md" alt="${item.name}">`}
                </div>
                <div class="flex-grow">
                    <h4 class="font-semibold">${item.name}</h4>
                    ${item.device ? `<p class="text-sm text-gray-500">Device: ${item.device}</p>` : ''}
                    <p class="text-sm gold-highlight">$${item.price.toFixed(2)}</p>
                </div>
                <button onclick="window.app.cartManager.removeFromCart('${item.designId}')" class="text-sm text-red-500 hover:text-red-700 ml-4">
                    Remove
                </button>
            </div>
        `).join('');
        
        container.innerHTML += `
            <div class="text-right pt-4 border-t border-gray-200">
                <p class="mb-1">Subtotal: $${totals.subtotal}</p>
                ${this.cartManager.promoDiscount > 0 ? `<p class="text-green-600 mb-1">Discount: -$${totals.discount}</p>` : ''}
                <p class="font-bold text-lg">Total: $${totals.total}</p>
            </div>
        `;
        
        const promoMessage = document.getElementById('promo-message');
        if (promoMessage) {
            promoMessage.innerText = this.cartManager.promoDiscount > 0 
                ? `Active Discount: ${this.cartManager.promoDiscount * 100}%` 
                : '';
        }
    }

    renderCheckout() {
        // This will be implemented when we build the full checkout functionality
        console.log("Checkout page rendered");
    }
}
