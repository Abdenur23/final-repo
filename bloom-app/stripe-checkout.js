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
        if (!this.checkoutManager.validateForm()) {
            return;
        }

        const userInfo = this.checkoutManager.authManager.getUserInfo();
        if (!userInfo) {
            this.checkoutManager.showError('Please sign in to place an order');
            return;
        }

        // Update button state
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
            const session = await this.createCheckoutSession(orderData);
            
            // Redirect to Stripe Checkout
            if (session.url && this.stripe) {
                const result = await this.stripe.redirectToCheckout({
                    sessionId: session.session_id
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
            } else {
                throw new Error('Failed to create checkout session');
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

    // In your collectCheckoutData method, ensure you're using the right field names
    collectCheckoutData() {
        const shippingAddress = this.collectAddressData('shipping');
        const billingAddress = document.getElementById('same-as-shipping')?.checked ? 
            shippingAddress : this.collectAddressData('billing');
    
        const cartItems = this.checkoutManager.cartManager.getCart().map(item => ({
            designId: item.designId,
            paletteName: item.paletteName,
            name: item.name,
            product_type: item.isGiftWrapping ? "Gift Wrapping" : item.product_type,
            isGiftWrapping: item.isGiftWrapping || false,
            device: item.device,
            thumbnail: item.thumbnail
        }));
    
        return {
            user_email: this.checkoutManager.authManager.getUserInfo()?.email,
            items: cartItems, // Make sure this is 'items' not 'cart_items'
            promo_code: this.checkoutManager.promoManager.activePromoCode,
            shipping_address: shippingAddress,
            billing_address: billingAddress
        };
    }

    collectAddressData(prefix) {
        return {
            fullName: document.getElementById(`${prefix}-full-name`)?.value || '',
            streetAddress: document.getElementById(`${prefix}-street-address`)?.value || '',
            address2: document.getElementById(`${prefix}-address-2`)?.value || '',
            city: document.getElementById(`${prefix}-city`)?.value || '',
            state: document.getElementById(`${prefix}-state`)?.value || '',
            zipCode: document.getElementById(`${prefix}-zip-code`)?.value || ''
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
        return data;
    }

    async getSessionStatus(sessionId) {
        try {
            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getSessionDetails',
                    session_id: sessionId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get session status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting session status:', error);
            return null;
        }
    }

    // Handle return from Stripe Checkout
    async handleCheckoutReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
            try {
                const sessionStatus = await this.getSessionStatus(sessionId);
                
                if (sessionStatus && sessionStatus.payment_status === 'paid') {
                    // Clear cart and promo data on successful payment
                    this.checkoutManager.cartManager.clearCart();
                    this.checkoutManager.promoManager.clearPromoData();
                    this.checkoutManager.clearSavedFormData();
                    
                    // Show success message
                    this.showSuccessMessage();
                } else {
                    this.showErrorMessage('Payment was not completed. Please try again.');
                }
            } catch (error) {
                console.error('Error handling checkout return:', error);
                this.showErrorMessage('Error verifying payment status.');
            }
        }
    }

    showSuccessMessage() {
        // You can customize this to show a better success UI
        const successHtml = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div class="text-green-600 text-6xl mb-4">✓</div>
                <h3 class="text-xl font-semibold text-green-800 mb-2">Order Successful!</h3>
                <p class="text-green-700">Thank you for your purchase. You will receive a confirmation email shortly.</p>
                <button onclick="window.app.navigateTo('homepage')" 
                        class="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Continue Shopping
                </button>
            </div>
        `;
        
        const checkoutPage = document.getElementById('checkout-page');
        if (checkoutPage) {
            checkoutPage.innerHTML = successHtml;
        }
    }

    showErrorMessage(message) {
        this.checkoutManager.showError(message);
    }
}

// Update the CheckoutManager to use StripeCheckout
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

    // Replace the existing placeOrder method
    async placeOrder() {
        await this.stripeCheckout.processCheckout();
    }

    // Keep all other existing methods from your original CheckoutManager
    initializeEventListeners() {
        // ... existing event listener code ...
    }

    saveFormData() {
        // ... existing saveFormData code ...
    }

    loadSavedAddresses() {
        // ... existing loadSavedAddresses code ...
    }

    // ... include all other existing methods from your original CheckoutManager ...

}

// Handle checkout return if we're on the success page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('success.html')) {
        const stripeCheckout = new StripeCheckout(window.app?.checkoutManager);
        stripeCheckout.handleCheckoutReturn();
    }
});
