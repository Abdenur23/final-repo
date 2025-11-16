// js/stripe-payment.js - REFACTORED TO USE CART MANAGER
class StripePayment {
    constructor() {
        this.stripe = null;
        this.initializeStripe();
        this.setupModalCloseHandlers();
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    setupModalCloseHandlers() {
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('cart-modal').style.display === 'block') {
                this.closeCartModal();
            }
        });

        // Click outside to close modal
        document.getElementById('cart-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cart-modal') {
                this.closeCartModal();
            }
        });
    }

    addToCart(designId, realtimeUpdates) {
        // Use the new cart manager
        const success = window.cartManager.addToCart(designId, realtimeUpdates);
        if (success) {
            this.updateCartUI();
            this.updateProductCardButtons();
            this.showAddToCartConfirmation(window.cartManager.getCartItems().find(item => item.designId === designId));
        } else {
            this.showError('This design is already in your cart');
        }
    }

    isInCart(designId) {
        return window.cartManager.isInCart(designId);
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
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">✅ Added to Cart</div>
            <div style="font-size: 14px;">${item.paletteName}</div>
            <div style="font-size: 12px; opacity: 0.9;">$${item.discountedPrice.toFixed(2)}</div>
            <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">Click to view cart</div>
        `;

        // Make notification clickable to open cart
        notification.addEventListener('click', () => {
            this.openCartModal();
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = window.cartManager.getCartCount();
            cartCount.style.display = window.cartManager.getCartCount() > 0 ? 'flex' : 'none';
        }
    }

    updateProductCardButtons() {
        // Update all product card buttons to show correct state
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const designId = card.id.replace('design-', '');
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                if (this.isInCart(designId)) {
                    addToCartBtn.textContent = '✓ Added to Cart';
                    addToCartBtn.style.background = '#6c757d';
                    addToCartBtn.style.cursor = 'not-allowed';
                    addToCartBtn.disabled = true;
                } else {
                    addToCartBtn.textContent = 'Add to Cart';
                    addToCartBtn.style.background = '#28a745';
                    addToCartBtn.style.cursor = 'pointer';
                    addToCartBtn.disabled = false;
                }
            }
        });
    }

    removeFromCart(designId) {
        window.cartManager.removeFromCart(designId);
        this.updateCartUI();
        this.updateProductCardButtons();
        this.renderCartItems();
    }

    getCartTotal() {
        return window.cartManager.getSubtotal();
    }

    updateCartTotal() {
        const totalElement = document.getElementById('cart-total');
        const subtotalElement = document.getElementById('cart-subtotal');
        
        if (totalElement) {
            totalElement.textContent = this.getCartTotal().toFixed(2);
        }
        if (subtotalElement) {
            const subtotal = window.cartManager.getSubtotal();
            subtotalElement.textContent = subtotal.toFixed(2);
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

        const cartItems = window.cartManager.getCartItems();

        if (cartItems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Your cart is empty</p>';
            this.updateCartTotal();
            return;
        }

        container.innerHTML = cartItems.map(item => `
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
