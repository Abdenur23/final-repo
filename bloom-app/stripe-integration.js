// stripe-integration.js
class StripeIntegration {
    constructor(checkoutManager) {
        this.checkoutManager = checkoutManager;
        this.stripe = null;
        this.initializeStripe();
    }

    initializeStripe() {
        // Stripe will be loaded from CDN, this is just a placeholder
        if (typeof Stripe !== 'undefined') {
            this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
        } else {
            console.warn('Stripe.js not loaded yet');
            // Retry initialization when Stripe might be available
            setTimeout(() => this.initializeStripe(), 100);
        }
    }

    async createCheckoutSession(orderData) {
        try {
            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    user_email: orderData.user_email,
                    cart_items: orderData.items,
                    promo_code: orderData.promoCode,
                    billing_address: orderData.billingAddress,
                    shipping_address: orderData.shippingAddress
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data;

        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw error;
        }
    }

    async processCheckout() {
        // Validate form before proceeding
        if (!this.checkoutManager.validateForm()) {
            return;
        }

        const userInfo = this.checkoutManager.authManager.getUserInfo();
        if (!userInfo) {
            this.checkoutManager.showError('Please sign in to place an order');
            return;
        }

        // Get order data
        const orderData = this.checkoutManager.collectOrderData();
        
        // Add user email to order data
        orderData.user_email = userInfo.email;

        // Update button state
        const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
        const originalText = placeOrderBtn?.textContent || 'Place Your Order';
        
        if (placeOrderBtn) {
            placeOrderBtn.textContent = 'Processing...';
            placeOrderBtn.disabled = true;
        }

        try {
            // Create checkout session with server
            const sessionData = await this.createCheckoutSession(orderData);
            
            // Ensure Stripe is initialized
            if (!this.stripe) {
                this.initializeStripe();
                if (!this.stripe) {
                    throw new Error('Stripe not initialized');
                }
            }

            // Redirect to Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionData.session_id
            });

            if (error) {
                throw error;
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data;

        } catch (error) {
            console.error('Error getting session status:', error);
            throw error;
        }
    }
}

// Update CheckoutManager to use Stripe integration
class CheckoutManager {
    // ... existing constructor and methods ...

    async placeOrder() {
        // Clear previous errors
        this.clearErrors();
        
        if (!this.validateForm()) {
            return;
        }

        // Use Stripe integration instead of direct order placement
        await this.stripeIntegration.processCheckout();
    }

    // Remove the old placeOrder method and update collectOrderData to match lambda expectations
    collectOrderData() {
        const shippingAddress = this.collectAddressData('shipping');
        const billingAddress = document.getElementById('same-as-shipping')?.checked ? 
            shippingAddress : this.collectAddressData('billing');

        const cartTotals = this.getCartTotal();

        return {
            items: this.cartManager.getCart(),
            subtotal: parseFloat(cartTotals.subtotal),
            discount: parseFloat(cartTotals.discount),
            finalSubtotal: parseFloat(cartTotals.finalSubtotal),
            shippingCost: this.shippingCost,
            tax: this.calculateTax(parseFloat(cartTotals.finalSubtotal), billingAddress.state),
            shippingAddress: this.formatAddressForAPI(shippingAddress),
            billingAddress: this.formatAddressForAPI(billingAddress),
            promoCode: this.promoManager.activePromoCode,
            giftWrapping: this.cartManager.hasGiftWrapping()
        };
    }

    formatAddressForAPI(address) {
        return {
            fullName: address.fullName,
            streetAddress: address.streetAddress,
            address2: address.address2,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode
        };
    }
}
