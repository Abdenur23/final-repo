// stripe-integration.js
class StripeIntegration {
    constructor(checkoutManager) {
        this.checkoutManager = checkoutManager;
        this.stripe = null;
        this.initializeStripe();
    }

    initializeStripe() {
        if (typeof Stripe !== 'undefined' && CONFIG.STRIPE_PUBLISHABLE_KEY) {
            this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
            console.log('✅ Stripe initialized successfully');
        } else {
            console.warn('Stripe.js not loaded yet or publishable key missing');
            // Retry initialization after a short delay
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
            console.log('🛒 Creating checkout session with order data:', orderData);
            
            // Transform cart items to ensure proper structure for the lambda
            const transformedItems = orderData.items.map(item => {
                if (item.isGiftWrapping) {
                    // Ensure gift items have proper product_type
                    return {
                        designId: item.designId,
                        name: item.name,
                        product_type: "Gift Wrapping",
                        isGiftWrapping: true,
                        device: item.device || 'gift',
                        thumbnail: item.thumbnail,
                        price: item.price
                    };
                } else {
                    // Regular products
                    return {
                        designId: item.designId,
                        paletteName: item.paletteName,
                        name: item.name,
                        product_type: item.product_type,
                        isGiftWrapping: false,
                        device: item.device,
                        thumbnail: item.thumbnail,
                        price: item.price
                    };
                }
            });

            const requestBody = {
                action: 'createCheckoutSession',
                user_email: orderData.user_email,
                items: transformedItems, // Use 'items' instead of 'cart_items' to match lambda
                promo_code: orderData.promoCode,
                billing_address: orderData.billingAddress,
                shipping_address: orderData.shippingAddress
            };

            console.log('📦 Sending to lambda:', requestBody);

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(requestBody)
            });
    
            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                    console.error('❌ API Error details:', errorData);
                } catch (e) {
                    console.error('❌ Failed to parse error response:', e);
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
    
            const data = await response.json();
            console.log('✅ Checkout session created:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
    
            return data;
    
        } catch (error) {
            console.error('❌ Error creating checkout session:', error);
            throw error;
        }
    }

    async processCheckout() {
        console.log('🚀 Starting checkout process...');
        
        // Validate form first
        if (!this.checkoutManager.validateForm()) {
            console.warn('❌ Form validation failed');
            return;
        }
        console.log('✅ Form validation passed');
        
        // Check user authentication
        const userInfo = this.checkoutManager.authManager.getUserInfo();
        if (!userInfo) {
            this.checkoutManager.showError('Please sign in to place an order');
            return;
        }
        console.log('✅ User authenticated:', userInfo.email);

        // Check cart has items
        const cart = this.checkoutManager.cartManager.getCart();
        if (!cart || cart.length === 0) {
            this.checkoutManager.showError('Your cart is empty');
            return;
        }
        console.log(`✅ Cart has ${cart.length} items`);
    
        // Get authentication token
        const token = getSession()?.id_token;
        if (!token) {
            this.checkoutManager.showError('Your session has expired. Please sign in again.');
            return;
        }
        console.log('✅ Authentication token obtained');
    
        // Collect order data
        const orderData = this.checkoutManager.collectOrderData();
        orderData.user_email = userInfo.email;
        console.log('✅ Order data collected');

        // Update UI - disable button
        const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
        const originalText = placeOrderBtn?.textContent || 'Place Your Order';
        
        if (placeOrderBtn) {
            placeOrderBtn.textContent = 'Processing...';
            placeOrderBtn.disabled = true;
        }
    
        try {
            // Ensure Stripe is initialized
            if (!this.stripe) {
                this.initializeStripe();
                // Wait a bit for initialization
                await new Promise(resolve => setTimeout(resolve, 100));
                if (!this.stripe) {
                    throw new Error('Stripe not initialized. Please refresh the page.');
                }
            }

            // Create checkout session
            const sessionData = await this.createCheckoutSession(orderData, token);
            
            if (!sessionData.session_id && !sessionData.sessionId) {
                throw new Error('No session ID returned from server');
            }

            const sessionId = sessionData.session_id || sessionData.sessionId;
            console.log('🔄 Redirecting to Stripe checkout with session:', sessionId);
    
            // Redirect to Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionId
            });
    
            if (error) {
                console.error('❌ Stripe redirect error:', error);
                throw error;
            }

            console.log('✅ Stripe redirect initiated successfully');
    
        } catch (error) {
            console.error('❌ Checkout process failed:', error);
            
            let userMessage = error.message || 'Failed to process checkout. Please try again.';
            
            // User-friendly error messages
            if (error.message.includes('401') || error.message.includes('authentication')) {
                userMessage = 'Authentication failed. Please sign in again.';
            } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
                userMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('Invalid promo code')) {
                userMessage = 'The promo code you entered is invalid or has expired.';
            } else if (error.message.includes('Product type') && error.message.includes('not found')) {
                userMessage = 'There was an issue with one of the products in your cart. Please remove it and try again.';
            } else if (error.message.includes('Missing product_type')) {
                userMessage = 'Some items in your cart are missing required information. Please refresh the page and try again.';
            } else if (error.message.includes('Stripe not initialized')) {
                userMessage = 'Payment system not ready. Please refresh the page and try again.';
            }
            
            this.checkoutManager.showError(userMessage);
            
            // Re-enable button
            if (placeOrderBtn) {
                placeOrderBtn.textContent = originalText;
                placeOrderBtn.disabled = false;
            }
        }
    }

    async getSessionStatus(sessionId) {
        try {
            console.log('🔍 Getting session status for:', sessionId);
            
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

            console.log('✅ Session status retrieved:', data);
    
            return data;
    
        } catch (error) {
            console.error('❌ Error getting session status:', error);
            throw error;
        }
    }

    async handleCheckoutReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
            try {
                console.log('🔄 Handling checkout return for session:', sessionId);
                
                const sessionStatus = await this.getSessionStatus(sessionId);
                
                if (sessionStatus && sessionStatus.payment_status === 'paid') {
                    console.log('✅ Payment successful, clearing cart and data');
                    
                    // Clear cart and promo data on successful payment
                    this.checkoutManager.cartManager.clearCart();
                    this.checkoutManager.promoManager.clearPromoData();
                    this.checkoutManager.clearSavedFormData();
                    
                    // Show success message
                    this.showSuccessMessage();
                } else {
                    console.warn('❌ Payment not completed, status:', sessionStatus?.payment_status);
                    this.showErrorMessage('Payment was not completed. Please try again.');
                }
            } catch (error) {
                console.error('❌ Error handling checkout return:', error);
                this.showErrorMessage('Error verifying payment status. Please contact support.');
            }
        } else {
            console.warn('No session_id found in URL');
        }
    }

    showSuccessMessage() {
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

// Handle checkout return on success page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('success.html') && window.app?.checkoutManager?.stripeIntegration) {
        console.log('🔄 Initializing checkout return handler');
        window.app.checkoutManager.stripeIntegration.handleCheckoutReturn();
    }
});
