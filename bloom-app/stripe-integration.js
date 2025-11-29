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
            setTimeout(() => this.initializeStripe(), 100);
        }
    }

    // Helper method to safely handle string values
    safeString(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).trim();
    }

    // Helper method to safely handle object values
    safeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return {};
        }
        return obj;
    }

    async createCheckoutSession(orderData, token) {
        try {
            console.log('🛒 Creating checkout session with order data:', orderData);
            
            // Safely transform cart items with null checking
            const transformedItems = (orderData.items || []).map(item => {
                const safeItem = this.safeObject(item);
                
                if (safeItem.isGiftWrapping) {
                    // Ensure gift items have proper product_type
                    return {
                        designId: this.safeString(safeItem.designId),
                        name: this.safeString(safeItem.name || 'Gift Wrapping'),
                        product_type: "Gift Wrapping",
                        isGiftWrapping: true,
                        device: this.safeString(safeItem.device || 'gift'),
                        thumbnail: this.safeString(safeItem.thumbnail),
                        price: safeItem.price || 0
                    };
                } else {
                    // Regular products with null checking
                    return {
                        designId: this.safeString(safeItem.designId),
                        paletteName: this.safeString(safeItem.paletteName),
                        name: this.safeString(safeItem.name || 'Custom Product'),
                        product_type: this.safeString(safeItem.product_type),
                        isGiftWrapping: false,
                        device: this.safeString(safeItem.device),
                        thumbnail: this.safeString(safeItem.thumbnail),
                        price: safeItem.price || 0
                    };
                }
            });

            // Safely handle addresses with null checking
            const safeBillingAddress = this.safeObject(orderData.billingAddress);
            const safeShippingAddress = this.safeObject(orderData.shippingAddress);

            const requestBody = {
                action: 'createCheckoutSession',
                user_email: this.safeString(orderData.user_email),
                items: transformedItems,
                promo_code: this.safeString(orderData.promoCode),
                billing_address: {
                    fullName: this.safeString(safeBillingAddress.fullName),
                    streetAddress: this.safeString(safeBillingAddress.streetAddress),
                    address2: this.safeString(safeBillingAddress.address2),
                    city: this.safeString(safeBillingAddress.city),
                    state: this.safeString(safeBillingAddress.state),
                    zipCode: this.safeString(safeBillingAddress.zipCode)
                },
                shipping_address: {
                    fullName: this.safeString(safeShippingAddress.fullName),
                    streetAddress: this.safeString(safeShippingAddress.streetAddress),
                    address2: this.safeString(safeShippingAddress.address2),
                    city: this.safeString(safeShippingAddress.city),
                    state: this.safeString(safeShippingAddress.state),
                    zipCode: this.safeString(safeShippingAddress.zipCode)
                }
            };

            console.log('📦 Sending to lambda:', requestBody);

            // Validate critical fields before sending
            if (!requestBody.user_email) {
                throw new Error('User email is required');
            }

            if (!requestBody.items || requestBody.items.length === 0) {
                throw new Error('Cart cannot be empty');
            }

            // Validate that all items have required fields
            for (let i = 0; i < requestBody.items.length; i++) {
                const item = requestBody.items[i];
                if (!item.product_type) {
                    throw new Error(`Item ${i + 1} is missing product type`);
                }
            }

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
                    
                    // Provide more specific error messages for common issues
                    if (errorData.error && errorData.error.includes("'NoneType'")) {
                        errorMessage = 'Server error: Missing required information. Please check your form data and try again.';
                    } else if (errorData.error && errorData.error.includes("product_type")) {
                        errorMessage = 'One or more products in your cart are missing required information. Please refresh the page and try again.';
                    }
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

            if (!data.session_id && !data.sessionId) {
                throw new Error('No session ID returned from server');
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
        if (!userInfo || !userInfo.email) {
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
    
        // Collect order data with validation
        let orderData;
        try {
            orderData = this.checkoutManager.collectOrderData();
            if (!orderData) {
                throw new Error('Failed to collect order data');
            }
            // Add user email to order data
            orderData.user_email = userInfo.email;
            console.log('✅ Order data collected:', orderData);
        } catch (error) {
            console.error('❌ Error collecting order data:', error);
            this.checkoutManager.showError('Failed to collect order information. Please refresh and try again.');
            return;
        }

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
                await new Promise(resolve => setTimeout(resolve, 200));
                if (!this.stripe) {
                    throw new Error('Stripe not initialized. Please refresh the page.');
                }
            }

            // Create checkout session
            const sessionData = await this.createCheckoutSession(orderData, token);
            
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
            } else if (error.message.includes('product_type') || error.message.includes('product type')) {
                userMessage = 'There was an issue with one of the products in your cart. Please remove it and try again.';
            } else if (error.message.includes('NoneType') || error.message.includes('Missing required')) {
                userMessage = 'Some required information is missing. Please check your form and try again.';
            } else if (error.message.includes('Stripe not initialized')) {
                userMessage = 'Payment system not ready. Please refresh the page and try again.';
            } else if (error.message.includes('Cart cannot be empty')) {
                userMessage = 'Your cart is empty. Please add items before checking out.';
            } else if (error.message.includes('User email is required')) {
                userMessage = 'Please sign in to place an order.';
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
                    session_id: this.safeString(sessionId)
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
