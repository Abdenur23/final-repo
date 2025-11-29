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

    async getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add Cognito token if available
        try {
            const session = await this.checkoutManager.authManager.getSession();
            if (session && session.idToken) {
                headers['Authorization'] = `Bearer ${session.idToken.jwtToken}`;
                console.log('✅ Added Bearer token to request');
            } else {
                console.warn('No session or idToken available');
            }
        } catch (error) {
            console.warn('Could not get auth token:', error);
        }
        
        return headers;
    }

    async createCheckoutSession(orderData, token) {
        try {
            console.log('Creating checkout session with token');
            
            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    user_email: orderData.user_email,
                    // cart_items: orderData.items,
                    items: orderData.items,
                    promo_code: orderData.promoCode,
                    billing_address: orderData.billingAddress,
                    shipping_address: orderData.shippingAddress
                })
            });
    
            console.log('API Response status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
    
            const data = await response.json();
            console.log('Checkout session created:', data);
            
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
        console.log('processing checkout...');
        
        if (!this.checkoutManager.validateForm()) {
            return;
        }
        console.log('form validation passed');
        
        const userInfo = this.checkoutManager.authManager.getUserInfo();
        if (!userInfo) {
            this.checkoutManager.showError('Please sign in to place an order');
            return;
        }
        console.log('user info found:', userInfo.email);
    
        // Get token directly
        const token = getSession()?.id_token;
        if (!token) {
            this.checkoutManager.showError('Your session has expired. Please sign in again.');
            return;
        }
        console.log('token found');
    
        const orderData = this.checkoutManager.collectOrderData();
        orderData.user_email = userInfo.email;
    
        const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
        const originalText = placeOrderBtn?.textContent || 'Place Your Order';
        
        if (placeOrderBtn) {
            placeOrderBtn.textContent = 'Processing...';
            placeOrderBtn.disabled = true;
        }
    
        try {
            const sessionData = await this.createCheckoutSession(orderData, token);
            
            if (!this.stripe) {
                this.initializeStripe();
                if (!this.stripe) {
                    throw new Error('Stripe not initialized. Please refresh the page.');
                }
            }
    
            console.log('Redirecting to Stripe checkout...');
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionData.session_id
            });
    
            if (error) {
                throw error;
            }
    
        } catch (error) {
            console.error('Checkout error:', error);
            
            let userMessage = error.message || 'Failed to process checkout. Please try again.';
            
            if (error.message.includes('401')) {
                userMessage = 'Authentication failed. Please sign in again.';
            } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
                userMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('Invalid promo code')) {
                userMessage = 'The promo code you entered is invalid or has expired.';
            }
            
            this.checkoutManager.showError(userMessage);
            
            if (placeOrderBtn) {
                placeOrderBtn.textContent = originalText;
                placeOrderBtn.disabled = false;
            }
        }
    }

    async getSessionStatus(sessionId) {
        try {
            const token = getSession()?.id_token;
            if (!token) {
                throw new Error('No authentication token');
            }
    
            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
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
