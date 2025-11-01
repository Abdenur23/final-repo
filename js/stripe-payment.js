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

            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    designId: designData.designId,
                    paletteName: designData.paletteName || 'Custom Phone Case',
                    imageUrls: designData.imageUrls,
                    price: priceInfo.discounted,
                    originalPrice: priceInfo.original,
                    discount: priceInfo.discount,
                    currency: 'usd'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const result = await response.json();
            
            if (result.sessionId) {
                // Redirect to Stripe Checkout
                const stripeResult = await this.stripe.redirectToCheckout({ 
                    sessionId: result.sessionId 
                });
                
                if (stripeResult.error) {
                    alert('Checkout error: ' + stripeResult.error.message);
                }
            } else {
                throw new Error('No session ID received from server');
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error starting checkout. Please try again.');
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
