// js/stripe-payment.js
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.initializeStripe();
        this.loadCartFromStorage();
        this.setupModalCloseHandlers();
        this.loadCart(); // Combined local + server loading
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    async loadCart() {
        // Load from localStorage first for immediate UI update
        this.loadCartFromStorage();
        
        // Then sync with server if user is authenticated
        try {
            await this.syncCartWithServer();
        } catch (error) {
            console.log('Server cart sync failed, using local cart:', error);
        }
    }

    async syncCartWithServer() {
        const session = this.getSession();
        if (!session?.id_token) return;

        try {
            const response = await fetch(CONFIG.SHOPPING_CART_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + session.id_token
                },
                body: JSON.stringify({ action: 'getCart' })
            });

            if (!response.ok) throw new Error('Failed to fetch cart');
            
            const data = await response.json();
            const serverCart = data.cart_items || [];

            if (serverCart.length > 0) {
                // Transform server cart items to match local format
                this.cart = serverCart.map(item => ({
                    designId: item.design_id,
                    designData: { paletteName: item.palette_name },
                    originalPrice: item.original_price,
                    discountedPrice: item.final_price,
                    discount: item.discount_percentage,
                    paletteName: item.palette_name,
                    imageUrl: item.image_url,
                    addedAt: item.created_at,
                    phoneModel: item.phone_model_display
                }));
                
                this.saveCartToStorage();
                this.updateCartUI();
                this.updateProductCardButtons();
            }
        } catch (error) {
            console.error('Server cart sync failed:', error);
            throw error;
        }
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

    setupModalCloseHandlers() {
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('cart-modal').style.display === 'block') {
                this.closeCartModal();
            }
        });

        // Click outside to close modal
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                if (e.target.id === 'cart-modal') {
                    this.closeCartModal();
                }
            });
        }
    }

    async addToCart(designId, realtimeUpdates) {
        // Check if already in cart
        if (this.isInCart(designId)) {
            this.showError('This design is already in your cart');
            return;
        }

        const design = realtimeUpdates.progressTracker.getCompletedDesign(designId);
        if (!design) {
            console.error('Design not found:', designId);
            return;
        }

        const session = this.getSession();
        if (!session?.id_token) {
            console.error('User not authenticated');
            this.showError('Please sign in to add items to cart');
            return;
        }

        // Get design details
        const paletteName = design.paletteName || 'Custom Design';
        const currentDiscount = realtimeUpdates.promoManager.getActiveDiscount();
        const originalPrice = CONFIG.PRODUCT_PRICE;
        const discountedPrice = originalPrice * (1 - currentDiscount / 100);
        const displayPrice = (currentDiscount > 0) ? discountedPrice : originalPrice;
        const thumbnailUrl = design.imageUrls ? Object.values(design.imageUrls)[3] : '';

        // Prepare cart item data
        const cartItem = {
            designId: designId,
            paletteName: paletteName,
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            finalPrice: displayPrice,
            discountPercentage: currentDiscount,
            imageUrl: thumbnailUrl,
            timestamp: new Date().toISOString()
        };

        console.log('Adding to cart:', cartItem);

        try {
            // Call the shopping cart API
            const result = await this.callAddToCartAPI(cartItem, session.id_token);
            console.log('✅ Item added to cart successfully:', result);
            
            // Add to local cart after successful API call
            const localCartItem = {
                designId: designId,
                designData: design,
                originalPrice: originalPrice,
                discountedPrice: discountedPrice,
                discount: currentDiscount,
                paletteName: paletteName,
                imageUrl: thumbnailUrl,
                addedAt: new Date().toISOString(),
                itemType: 'Case & wallpaper',
                phoneModel: result.phone_model_display || 'Unknown Model'
            };

            this.cart.push(localCartItem);
            this.saveCartToStorage();
            this.updateCartUI();
            this.updateProductCardButtons();
            this.showAddToCartConfirmation(localCartItem);
            
        } catch (error) {
            console.error('❌ Failed to add item to cart:', error);
            this.showError('Failed to add item to cart. Please try again.');
        }
    }

    async callAddToCartAPI(cartItem, idToken) {
        if (!CONFIG.SHOPPING_CART_API_ENDPOINT) {
            throw new Error('Shopping cart API endpoint not configured');
        }

        const response = await fetch(CONFIG.SHOPPING_CART_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + idToken
            },
            body: JSON.stringify({
                action: 'addToCart',
                item: cartItem
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    isInCart(designId) {
        return this.cart.some(item => item.designId === designId);
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
            <div style="font-size: 12px; opacity: 0.9;">${item.phoneModel}</div>
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
            cartCount.textContent = this.cart.length;
            cartCount.style.display = this.cart.length > 0 ? 'flex' : 'none';
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
        // Remove from local cart first
        this.cart = this.cart.filter(item => item.designId !== designId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons();
        this.renderCartItems();

        // Call Lambda API to remove from server-side cart
        this.callRemoveFromCartAPI(designId)
            .then(result => {
                console.log('✅ Item removed from server cart successfully:', result);
            })
            .catch(error => {
                console.error('❌ Failed to remove item from server cart:', error);
            });
    }

    async callRemoveFromCartAPI(designId) {
        const session = this.getSession();
        if (!session?.id_token) {
            console.log('User not authenticated, skipping server cart removal');
            return;
        }

        if (!CONFIG.SHOPPING_CART_API_ENDPOINT) {
            throw new Error('Shopping cart API endpoint not configured');
        }

        const response = await fetch(CONFIG.SHOPPING_CART_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + session.id_token
            },
            body: JSON.stringify({
                action: 'removeFromCart',
                designId: designId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    toggleGiftOption() {
        this.isGift = !this.isGift;
        this.saveCartToStorage();
        this.updateCartTotal();
        this.renderCartItems();
        
        // Update checkbox state
        const giftCheckbox = document.querySelector('#cart-modal input[type="checkbox"]');
        if (giftCheckbox) {
            giftCheckbox.checked = this.isGift;
        }
    }

    getCartTotal() {
        const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
        const giftFee = this.isGift ? 12.00 : 0;
        return subtotal + giftFee;
    }

    initializeGiftCheckbox() {
        const checkModal = () => {
            const giftCheckbox = document.getElementById('gift-checkbox');
            if (giftCheckbox) {
                // Set initial state
                giftCheckbox.checked = this.isGift;
                
                // Remove any existing event listeners and add new one
                giftCheckbox.replaceWith(giftCheckbox.cloneNode(true));
                const newCheckbox = document.getElementById('gift-checkbox');
                
                newCheckbox.addEventListener('change', (e) => {
                    console.log('Gift checkbox changed to:', e.target.checked);
                    this.isGift = e.target.checked;
                    this.saveCartToStorage();
                    this.updateCartTotal();
                    this.renderCartItems();
                });
                
                console.log('Gift checkbox initialized with state:', this.isGift);
            } else {
                // Try again in a bit if not ready
                setTimeout(checkModal, 100);
            }
        };
        
        checkModal();
    }

    openCartModal() {
        this.renderCartItems();
        document.getElementById('cart-modal').style.display = 'block';
        this.initializeGiftCheckbox();
    }

    updateCartTotal() {
        const totalElement = document.getElementById('cart-total');
        const giftFeeElement = document.getElementById('gift-fee');
        const subtotalElement = document.getElementById('cart-subtotal');
        const giftFeeLine = document.getElementById('gift-fee-line');
        
        if (totalElement) {
            totalElement.textContent = this.getCartTotal().toFixed(2);
        }
        if (giftFeeElement) {
            giftFeeElement.textContent = '12.00';
        }
        if (subtotalElement) {
            const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
            subtotalElement.textContent = subtotal.toFixed(2);
        }
        if (giftFeeLine) {
            giftFeeLine.style.display = this.isGift ? 'flex' : 'none';
        }
    }

    async proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showError('Your cart is empty');
            return;
        }

        // Store gift option in localStorage for checkout page
        localStorage.setItem('checkoutGiftOption', JSON.stringify(this.isGift));
        
        // Close cart modal
        this.closeCartModal();
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
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
                     style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; flex-shrink: 0; background: #f5f5f5;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px; line-height: 1.3;">${item.paletteName}</div>
                    <div style="color: #666; font-size: 13px;">
                        ${item.phoneModel} <span style="color: #28a745; font-size: 12px;">(${item.itemType})</span>
                    </div>
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
        
        // Update gift checkbox state
        const giftCheckbox = document.querySelector('#cart-modal input[type="checkbox"]');
        if (giftCheckbox) {
            giftCheckbox.checked = this.isGift;
        }
    }

    getSession() {
        try {
            const session = localStorage.getItem('cognitoSession');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
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
