// js/stripe-payment.js
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.initializeStripe();
        this.loadCartFromStorage();
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('shoppingCart');
        const savedGiftOption = localStorage.getItem('isGiftOption');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
        if (savedGiftOption) {
            this.isGift = JSON.parse(savedGiftOption);
        }
        this.updateCartUI();
    }

    saveCartToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
    }

    addToCart(designId, realtimeUpdates) {
        const design = realtimeUpdates.progressTracker.getCompletedDesign(designId);
        if (!design) {
            console.error('Design not found:', designId);
            return;
        }

        const currentDiscount = realtimeUpdates.promoManager.getActiveDiscount();
        const originalPrice = CONFIG.PRODUCT_PRICE;
        const discountedPrice = originalPrice * (1 - currentDiscount / 100);
        
        const cartItem = {
            designId: designId,
            designData: design,
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            discount: currentDiscount,
            paletteName: design.paletteName || 'Custom Design',
            imageUrl: design.imageUrls ? design.imageUrls[0] : null,
            addedAt: new Date().toISOString()
        };

        const existingIndex = this.cart.findIndex(item => item.designId === designId);
        if (existingIndex > -1) {
            this.cart[existingIndex] = cartItem;
        } else {
            this.cart.push(cartItem);
        }

        this.saveCartToStorage();
        this.updateCartUI();
        this.showAddToCartConfirmation(cartItem);
    }

    showAddToCartConfirmation(item) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">✅ Added to Cart</div>
            <div style="font-size: 14px;">${item.paletteName}</div>
            <div style="font-size: 12px; opacity: 0.9;">$${item.discountedPrice.toFixed(2)}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
            cartCount.style.display = this.cart.length > 0 ? 'flex' : 'none';
        }
    }

    removeFromCart(designId) {
        this.cart = this.cart.filter(item => item.designId !== designId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.renderCartItems();
    }

    toggleGiftOption() {
        this.isGift = !this.isGift;
        this.saveCartToStorage();
        this.updateCartTotal();
        this.renderCartItems();
    }

    getCartTotal() {
        const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
        const giftFee = this.isGift ? 12.00 : 0;
        return subtotal + giftFee;
    }

    updateCartTotal() {
        const totalElement = document.getElementById('cart-total');
        const giftFeeElement = document.getElementById('gift-fee');
        const subtotalElement = document.getElementById('cart-subtotal');
        
        if (totalElement) {
            totalElement.textContent = this.getCartTotal().toFixed(2);
        }
        if (giftFeeElement) {
            giftFeeElement.textContent = this.isGift ? '12.00' : '0.00';
            giftFeeElement.style.display = this.isGift ? 'block' : 'none';
            document.getElementById('gift-fee-line').style.display = this.isGift ? 'flex' : 'none';
        }
        if (subtotalElement) {
            const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
            subtotalElement.textContent = subtotal.toFixed(2);
        }
    }

    async proceedToCheckout() {
        if (this.cart.length === 0) {
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
            const totalAmount = Math.round(this.getCartTotal() * 100);

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    user_email: userInfo ? userInfo.email : null,
                    amount: totalAmount,
                    cart_items: this.cart,
                    item_count: this.cart.length,
                    is_gift: this.isGift
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const checkoutSession = await response.json();
            
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

    openCartModal() {
        this.renderCartItems();
        document.getElementById('cart-modal').style.display = 'block';
    }

    closeCartModal() {
        document.getElementById('cart-modal').style.display = 'none';
    }

    renderCartItems() {
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Your cart is empty</p>';
            this.updateCartTotal();
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item" style="display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #eee; gap: 12px;">
                <img src="${item.imageUrl}" alt="${item.paletteName}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px; line-height: 1.3;">${item.paletteName}</div>
                    <div style="color: #666; font-size: 13px;">
                        $${item.discountedPrice.toFixed(2)}
                        ${item.discount > 0 ? `<span style="color: #28a745; font-size: 12px;">(${item.discount}% off)</span>` : ''}
                    </div>
                </div>
                <button onclick="window.stripePayment.removeFromCart('${item.designId}')" 
                        style="background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; flex-shrink: 0;">
                    Remove
                </button>
            </div>
        `).join('');

        this.updateCartTotal();
    }
}

// Initialize globally
window.stripePayment = new StripePayment();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
