// js/stripe-payment.js
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.shippingAddress = null;
        this.billingAddress = null;
        this.taxAmount = 0;
        this.CALIFORNIA_TAX_RATE = 0.0825; // Example CA sales tax rate (8.25%)
        
        this.initializeStripe();
        this.loadCartFromStorage();
        this.setupModalCloseHandlers();
    }
    
    // ... (Existing initialization and storage methods) ...
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
    // ... (Existing addToCart, isInCart, showAddToCartConfirmation, updateCartUI, updateProductCardButtons, removeFromCart) ...
    addToCart(designId, realtimeUpdates) {
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
        this.cart.push(cartItem);
        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons(); // Update all product card buttons
        this.showAddToCartConfirmation(cartItem);
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
        this.cart = this.cart.filter(item => item.designId !== designId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons(); 
        this.renderCartItems();
        this.updateCartTotal(); // Ensure total is updated after removal
    }
    toggleGiftOption() {
        this.isGift = !this.isGift;
        this.saveCartToStorage();
        this.updateCartTotal();
        this.renderCartItems();
       
        // Update checkbox state (redundant if called from change listener, but safe)
        const giftCheckbox = document.querySelector('#gift-checkbox');
        if (giftCheckbox) {
            giftCheckbox.checked = this.isGift;
        }
    }
    
    // New method to calculate tax
    calculateTax(subtotal) {
        const isSame = document.getElementById('sameAsShipping').checked;
        
        // Determine the state to check for tax: Billing state if different, otherwise Shipping state
        const stateElement = isSame ? document.getElementById('shippingState') : document.getElementById('billingState');
        const state = stateElement ? stateElement.value : '';
        
        if (state === 'CA') {
            // Tax is applied only if the billing address is in CA (based on prompt)
            this.taxAmount = subtotal * this.CALIFORNIA_TAX_RATE;
            this.taxAmount = Math.round(this.taxAmount * 100) / 100; // Round to 2 decimal places
        } else {
            this.taxAmount = 0;
        }
        
        return this.taxAmount;
    }
    
    getCartTotal() {
        const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
        const giftFee = this.isGift ? 12.00 : 0;
        const tax = this.calculateTax(subtotal); // Calculate tax before adding to total
        
        return subtotal + giftFee + tax;
    }
    
    initializeGiftCheckbox() {
        // Existing method remains but is less critical since HTML listener is in place
        const giftCheckbox = document.getElementById('gift-checkbox');
        if (giftCheckbox) {
            giftCheckbox.checked = this.isGift;
        }
    }
    
    openCartModal() {
        this.showCartSummary();
        document.getElementById('cart-modal').style.display = 'block';
        this.initializeGiftCheckbox();
    }
    closeCartModal() {
        document.getElementById('cart-modal').style.display = 'none';
        this.showCartSummary(); // Reset view to cart summary on close
    }
    
    // New methods for modal steps
    showCartSummary() {
        document.getElementById('modal-title').textContent = '🛒 Shopping Cart';
        document.getElementById('cart-summary-step').style.display = 'block';
        document.getElementById('checkout-address-step').style.display = 'none';
        this.renderCartItems();
    }
    
    showCheckoutAddress() {
        if (this.cart.length === 0) {
            this.showError('Your cart is empty. Please add items to proceed.');
            return;
        }
        document.getElementById('modal-title').textContent = '🚚 Shipping & Billing';
        document.getElementById('cart-summary-step').style.display = 'none';
        document.getElementById('checkout-address-step').style.display = 'block';
        
        // Re-calculate tax with default or saved values
        this.updateCartTotal();
    }
    
    handleAddressSubmission() {
        const isSame = document.getElementById('sameAsShipping').checked;
        
        // 1. Capture Shipping Address
        this.shippingAddress = {
            name: document.getElementById('shippingName').value,
            street: document.getElementById('shippingStreet').value,
            city: document.getElementById('shippingCity').value,
            state: document.getElementById('shippingState').value,
            zip: document.getElementById('shippingZip').value
        };
        
        if (isSame) {
            this.billingAddress = { ...this.shippingAddress };
        } else {
            // 2. Capture Separate Billing Address
            this.billingAddress = {
                name: document.getElementById('billingName').value,
                street: document.getElementById('billingStreet').value,
                city: document.getElementById('billingCity').value,
                state: document.getElementById('billingState').value,
                zip: document.getElementById('billingZip').value
            };
        }
        
        // 3. Re-calculate tax one last time and proceed to payment
        this.updateCartTotal(); 
        this.proceedToCheckout();
    }
    
    updateCartTotal() {
        const totalElement = document.getElementById('cart-total');
        const giftFeeElement = document.getElementById('gift-fee');
        const subtotalElement = document.getElementById('cart-subtotal');
        const giftFeeLine = document.getElementById('gift-fee-line');
        const taxLine = document.getElementById('tax-line');
        const estimatedTaxes = document.getElementById('estimated-taxes');
        
        const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
        const tax = this.calculateTax(subtotal); // Recalculate tax
        const total = this.getCartTotal(); // Recalculate total
        
        if (subtotalElement) {
            subtotalElement.textContent = subtotal.toFixed(2);
        }
        if (giftFeeElement) {
            giftFeeElement.textContent = '12.00';
        }
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
        if (giftFeeLine) {
            giftFeeLine.style.display = this.isGift ? 'flex' : 'none';
        }
        
        // Conditional tax display
        if (estimatedTaxes) {
            estimatedTaxes.textContent = tax.toFixed(2);
            taxLine.style.display = tax > 0 ? 'flex' : 'none';
        }
    }
    
    async proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showError('Your cart is empty');
            return;
        }
        if (!this.shippingAddress || !this.billingAddress) {
            this.showError('Please fill out all address details.');
            this.showCheckoutAddress(); // Go back to address step
            return;
        }
   
        try {
            const session = getSession();
            if (!session || !session.id_token) {
                alert('Please sign in to proceed with checkout');
                return;
            }
   
            const userInfo = getUserInfo();
            // Calculate the final amount to send to Stripe in cents
            const totalAmount = Math.round(this.getCartTotal() * 100);
   
            // Prepare the request body - match what Lambda expects
            const requestBody = {
                action: 'createCheckoutSession',
                user_email: userInfo ? userInfo.email : null,
                amount: totalAmount,
                cart_items: this.cart,
                item_count: this.cart.length,
                is_gift: this.isGift,
                shipping_address: this.shippingAddress, // NEW: Include shipping address
                billing_address: this.billingAddress, // NEW: Include billing address
                tax_amount: Math.round(this.taxAmount * 100) // NEW: Include tax amount
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
           
            // Stripe handles the redirect and payment process from here
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
        // ... (Existing showError method) ...
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
       
        // Update gift checkbox state
        const giftCheckbox = document.querySelector('#gift-checkbox');
        if (giftCheckbox) {
            giftCheckbox.checked = this.isGift;
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
