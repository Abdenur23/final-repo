class StripePayment {
    constructor() {
        this.stripe = null;
        this.isInitialized = false;
        this.initializeStripe();
    }

    initializeStripe() {
        // Load Stripe.js with your publishable key
        if (typeof Stripe === 'undefined') {
            console.error('Stripe.js not loaded');
            return;
        }
        
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
        this.isInitialized = true;
        console.log('Stripe initialized');
    }

    async createCheckoutSession(designData, priceInfo) {
        if (!this.isInitialized) {
            alert('Payment system not ready. Please try again.');
            return;
        }
    
        try {
            // Get user session for authentication
            const session = this.getUserSession();
            if (!session || !session.access_token) {
                alert('Please sign in to proceed with checkout.');
                return;
            }
    
            console.log('Creating checkout session for design:', designData.designId);
            console.log('Price info:', priceInfo);
            console.log('Using API endpoint:', CONFIG.API_ENDPOINT);
    
            const requestBody = {
                action: 'createCheckoutSession',
                designId: designData.designId,
                paletteName: designData.paletteName || 'Custom Phone Case',
                imageUrls: designData.imageUrls,
                price: priceInfo.discounted,
                originalPrice: priceInfo.original,
                discount: priceInfo.discount,
                currency: 'usd'
            };
    
            console.log('Request body:', requestBody);
    
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(requestBody)
            });
    
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
    
            const responseText = await response.text();
            console.log('Response text:', responseText);
    
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }
    
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', responseText);
                throw new Error('Invalid response from server');
            }
    
            console.log('Parsed result:', result);
            
            if (result.sessionId) {
                console.log('Redirecting to Stripe Checkout with session:', result.sessionId);
                // Redirect to Stripe Checkout
                const stripeResult = await this.stripe.redirectToCheckout({ 
                    sessionId: result.sessionId 
                });
                
                if (stripeResult.error) {
                    console.error('Stripe redirect error:', stripeResult.error);
                    alert('Checkout error: ' + stripeResult.error.message);
                }
            } else {
                console.error('No sessionId in response:', result);
                throw new Error('No session ID received from server: ' + (result.error || JSON.stringify(result)));
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error starting checkout. Please try again. Check console for details.');
        }
    }
    async addToCart(designId, realTimeUpdates) {
        const design = realTimeUpdates.progressTracker.getCompletedDesign(designId);
        if (!design) {
            alert('Design not found. Please try again.');
            return;
        }

        const currentDiscount = realTimeUpdates.promoManager.getActiveDiscount();
        const originalPrice = CONFIG.PRODUCT_PRICE;
        const discountedPrice = originalPrice * (1 - currentDiscount / 100);
        
        const priceInfo = {
            original: originalPrice,
            discounted: discountedPrice,
            discount: currentDiscount
        };

        // Show loading state
        const button = document.querySelector(`#design-${designId} .add-to-cart-btn`);
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Processing...';
            button.disabled = true;

            try {
                await this.createCheckoutSession(design, priceInfo);
            } finally {
                // Reset button state
                button.textContent = originalText;
                button.disabled = false;
            }
        }
    }

    getUserSession() {
        try {
            const session = localStorage.getItem('cognitoSession');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error getting user session:', error);
            return null;
        }
    }
}

// Initialize Stripe Payment globally
window.stripePayment = new StripePayment();
