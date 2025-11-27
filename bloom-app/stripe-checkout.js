// stripe-checkout.js
class StripeCheckout {
    constructor(checkoutManager) {
        this.checkoutManager = checkoutManager;
        this.stripe = null;
        this.initializeStripe();
    }

    initializeStripe() {
        // Initialize Stripe with publishable key
        if (typeof Stripe !== 'undefined' && CONFIG.STRIPE_PUBLISHABLE_KEY) {
            this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
        } else {
            console.error('Stripe.js not loaded or publishable key not configured');
        }
    }

    async processCheckout() {
        // Validate form before proceeding
        if (!this.checkoutManager.validateForm()) {
            return;
        }

        const userInfo = this.checkoutManager.authManager.getUserInfo();
        if (!userInfo) {
            this.checkoutManager.showError('Please sign in to proceed with checkout');
            return;
        }

        // Show loading state
        const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
        const originalText = placeOrderBtn?.textContent || 'Place Your Order';
        if (placeOrderBtn) {
            placeOrderBtn.textContent = 'Processing...';
            placeOrderBtn.disabled = true;
        }

        try {
            // Collect order data
            const orderData = this.collectCheckoutData();
            
            // Create checkout session via API
            const { session_id, url, order_id } = await this.createCheckoutSession(orderData);
            
            // Store order ID for reference
            this.currentOrderId = order_id;
            
            // Redirect to Stripe Checkout
            if (this.stripe && url) {
                const result = await this.stripe.redirectToCheckout({
                    sessionId: session_id
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
            } else {
                // Fallback: redirect directly to Stripe URL
                window.location.href = url;
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            this.checkoutManager.showError(error.message || 'Failed to process checkout. Please try again.');
            
            // Re-enable button
            if (placeOrderBtn) {
                placeOrderBtn.textContent = originalText;
                placeOrderBtn.disabled = false;
            }
        }
    }

    collectCheckoutData() {
        const cartItems = this.checkoutManager.cartManager.getCart().map(item => ({
            designId: item.designId || `custom_${Date.now()}`,
            paletteName: item.paletteName || item.name || 'Custom Design',
            product_type: item.product_type || 'Case & wallpaper',
            device: item.device || '',
            isGiftWrapping: item.isGiftWrapping || false,
            name: item.name || 'Custom Phone Case',
            imageUrl: item.imageUrl || item.thumbnail || '',
            thumbnail: item.thumbnail || ''
        }));

        const shippingAddress = this.checkoutManager.collectAddressData('shipping');
        const billingAddress = document.getElementById('same-as-shipping')?.checked ? 
            shippingAddress : this.checkoutManager.collectAddressData('billing');

        return {
            user_email: this.checkoutManager.authManager.getUserInfo()?.email,
            cart_items: cartItems,
            promo_code: this.checkoutManager.promoManager.activePromoCode,
            shipping_address: shippingAddress,
            billing_address: billingAddress
        };
    }

    async createCheckoutSession(orderData) {
        const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'createCheckoutSession',
                ...orderData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const data = await response.json();
        
        if (!data.session_id || !data.url) {
            throw new Error('Invalid response from checkout server');
        }

        return data;
    }

    async checkOrderStatus(orderId) {
        try {
            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getSessionDetails',
                    session_id: orderId
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('Error checking order status:', error);
        }
        return null;
    }

    // Handle return from Stripe Checkout
    async handleCheckoutReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
            try {
                const orderStatus = await this.checkOrderStatus(sessionId);
                
                if (orderStatus && orderStatus.payment_status === 'paid') {
                    // Clear cart and promo data on successful payment
                    this.checkoutManager.cartManager.clearCart();
                    this.checkoutManager.promoManager.clearPromoData();
                    this.checkoutManager.clearSavedFormData();
                    
                    // Show success message
                    this.showSuccessMessage();
                }
            } catch (error) {
                console.error('Error handling checkout return:', error);
            }
        }
    }

    showSuccessMessage() {
        // You can customize this to show a better success UI
        const successDiv = document.createElement('div');
        successDiv.className = 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <span class="text-green-500 mr-2">✓</span>
                <span>Order placed successfully! Thank you for your purchase.</span>
            </div>
        `;
        
        const checkoutPage = document.getElementById('checkout-page');
        if (checkoutPage) {
            const firstChild = checkoutPage.firstElementChild;
            checkoutPage.insertBefore(successDiv, firstChild);
        }
    }
}

// Update CheckoutManager to use Stripe integration
class CheckoutManager {
    constructor(cartManager, promoManager, authManager) {
        this.cartManager = cartManager;
        this.promoManager = promoManager;
        this.authManager = authManager;
        this.shippingCost = 8.90;
        this.taxRates = {
            'CA': 0.0825, 'NY': 0.08875, 'TX': 0.0825, 'FL': 0.07,
            'IL': 0.1025, 'PA': 0.06, 'OH': 0.075, 'GA': 0.07,
            'NC': 0.06975, 'MI': 0.06
        };
        
        // Initialize Stripe checkout
        this.stripeCheckout = new StripeCheckout(this);
        
        this.initializeEventListeners();
    }

    // Replace the old placeOrder method
    async placeOrder() {
        await this.stripeCheckout.processCheckout();
    }

    // Keep all other existing methods unchanged...
    initializeEventListeners() {
        // Same as original implementation
        document.addEventListener('change', (e) => {
            if (e.target.id === 'same-as-shipping') {
                this.toggleBillingAddress(e.target.checked);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.closest('#shipping-address-fields')) {
                this.syncBillingAddressIfEnabled();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'billing-state') {
                this.updateTaxAndTotals();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#checkout-promo-apply')) {
                this.applyPromoFromCheckout();
            }
        });

        document.addEventListener('input', (e) => {
            this.saveFormData();
        });
        
        document.addEventListener('change', (e) => {
            this.saveFormData();
        });

        // Handle checkout return if on success page
        if (window.location.pathname.includes('success.html')) {
            this.stripeCheckout.handleCheckoutReturn();
        }
    }

    // All other existing methods remain the same...
    saveFormData() { /* ... */ }
    loadSavedAddresses() { /* ... */ }
    applyPromoFromCheckout() { /* ... */ }
    toggleBillingAddress(sameAsShipping) { /* ... */ }
    syncBillingAddressIfEnabled() { /* ... */ }
    syncBillingAddress() { /* ... */ }
    getTaxRate(state) { /* ... */ }
    calculateTax(subtotal, state) { /* ... */ }
    getCartTotal() { /* ... */ }
    updateTaxAndTotals() { /* ... */ }
    updateSummaryDisplay(totals) { /* ... */ }
    updateDiscountDisplay(totals) { /* ... */ }
    renderCheckout() { /* ... */ }
    initializeBillingAddress() { /* ... */ }
    renderOrderItems() { /* ... */ }
    updateShippingLabel() { /* ... */ }
    togglePromoSection() { /* ... */ }
    updatePromoDisplay() { /* ... */ }
    validateForm() { /* ... */ }
    showError(message) { /* ... */ }
    clearErrors() { /* ... */ }
    collectOrderData() { /* ... */ }
    collectAddressData(prefix) { /* ... */ }
    clearSavedFormData() { /* ... */ }
}

// Update app.js to include Stripe script
function loadStripeCheckout() {
    return new Promise((resolve, reject) => {
        if (typeof Stripe !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadStripeCheckout();
        console.log('Stripe.js loaded successfully');
    } catch (error) {
        console.error('Failed to load Stripe.js:', error);
    }
});
