// js/stripe-payment.js

class StripePayment {
    constructor() {
        this.stripe = null;
        this.initializeStripe();
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    async processCheckout(cartManager) {
        if (cartManager.isEmpty()) {
            this.showError('Your cart is empty');
            return;
        }

        try {
            const session = getSession();
            if (!session || !session.id_token) {
                alert('Please sign in to proceed with checkout');
                return;
            }

            const userInfo = getUserInfo();
            const cartData = cartManager.getCartData();
            const totalAmount = Math.round(cartData.total * 100);

            // DEBUG: Log everything being sent
            console.log('=== CHECKOUT DEBUG ===');
            console.log('Gift option:', cartData.isGift);
            console.log('Total amount:', totalAmount);
            console.log('Cart items:', cartData.cart.length);
            console.log('User email:', userInfo?.email);
            console.log('=====================');

            // Prepare the request body - match what Lambda expects
            const requestBody = {
                action: 'createCheckoutSession',
                user_email: userInfo ? userInfo.email : null,
                amount: totalAmount,
                cart_items: cartData.cart,
                item_count: cartData.cart.length,
                is_gift: cartData.isGift
            };

            console.log('Sending to API:', requestBody);

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Checkout API error response:', errorText);
                throw new Error('Failed to create checkout session: ' + errorText);
            }

            const checkoutSession = await response.json();
            console.log('Checkout session created successfully:', checkoutSession);
            
            const result = await this.stripe.redirectToCheckout({
                sessionId: checkoutSession.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Checkout error:', error);
            this.showError('Error starting checkout: ' + error.message);
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">❌ Error</div>
            <div style="font-size: 14px;">${message}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Additional Stripe-specific methods can be added here
    // For example: handlePaymentElements, confirmPayment, etc.
    
    async handlePaymentSuccess(sessionId) {
        // Handle successful payment confirmation
        console.log('Payment successful for session:', sessionId);
    }

    async handlePaymentFailure(error) {
        // Handle payment failure
        console.error('Payment failed:', error);
        this.showError('Payment failed: ' + error.message);
    }
}

// Initialize globally
window.stripePayment = new StripePayment();
