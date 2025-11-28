// stripe-integration.js
class StripeIntegration {
    constructor(checkoutManager) {
        this.checkoutManager = checkoutManager;
        this.stripe = null;
        this.initializeStripe();
    }

    initializeStripe() {
        if (typeof Stripe !== 'undefined') {
            this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
        } else {
            console.warn('Stripe.js not loaded yet');
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
        if (!this.checkoutManager.validateForm()) {
            return;
        }

        const userInfo = this.checkoutManager.authManager.getUserInfo();
        if (!userInfo) {
            this.checkoutManager.showError('Please sign in to place an order');
            return;
        }

        const orderData = this.checkoutManager.collectOrderData();
        orderData.user_email = userInfo.email;

        const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
        const originalText = placeOrderBtn?.textContent || 'Place Your Order';
        
        if (placeOrderBtn) {
            placeOrderBtn.textContent = 'Processing...';
            placeOrderBtn.disabled = true;
        }

        try {
            const sessionData = await this.createCheckoutSession(orderData);
            
            if (!this.stripe) {
                this.initializeStripe();
                if (!this.stripe) {
                    throw new Error('Stripe not initialized');
                }
            }

            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionData.session_id
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Checkout error:', error);
            this.checkoutManager.showError(error.message || 'Failed to process checkout. Please try again.');
            
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
