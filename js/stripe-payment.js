// js/stripe-payment.js

class StripePayment {
    constructor() {
        this.stripe = null;
        this.initializeStripe();
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    async processCheckout(cartData) {
        if (!cartData || cartData.itemCount === 0) {
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
            const totalAmount = Math.round(cartData.total * 100);

            // DEBUG: Log everything being sent
            console.log('=== CHECKOUT DEBUG ===');
            console.log('Gift option:', cartData.isGift);
            console.log('Total amount:', totalAmount);
            console.log('Cart items:', cartData.itemCount);
            console.log('User email:', userInfo?.email);
            console.log('=====================');

            // Prepare the request body - match what Lambda expects
            const requestBody = {
                action: 'createCheckoutSession',
                user_email: userInfo ? userInfo.email : null,
                amount: totalAmount,
                cart_items: cartData.cart,
                item_count: cartData.itemCount,
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
    handlePaymentSuccess(sessionId) {
        console.log('Payment successful for session:', sessionId);
        // Clear cart on successful payment
        if (window.cartManager) {
            window.cartManager.cart = [];
            window.cartManager.saveCartToStorage();
            window.cartManager.updateCartUI();
            window.cartManager.updateProductCardButtons();
        }
    }

    handlePaymentFailure(error) {
        console.error('Payment failed:', error);
        this.showError('Payment failed: ' + error.message);
    }

    // Method to handle Stripe webhooks or post-payment processing
    async handlePaymentConfirmation(paymentIntentId) {
        try {
            // Additional payment confirmation logic if needed
            console.log('Confirming payment:', paymentIntentId);
        } catch (error) {
            console.error('Payment confirmation error:', error);
            this.showError('Payment confirmation failed');
        }
    }
}

// Initialize globally
window.stripePayment = new StripePayment();
