// js/checkout-manager.js
class CheckoutManager {
    constructor() {
        this.SHIPPING_COST = 8.70;
        this.GIFT_FEE = 12.00;
        this.CA_TAX_RATE = 0.0725;
        
        this.cartItems = [];
        this.isGift = false;
        this.stripe = null;
        
        this.initialize();
    }

    async initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.initializeEventListeners();
        this.loadInitialState();
        this.initializeStripe();
        this.updateUI();
    }

    initializeEventListeners() {
        // Gift checkboxes
        document.getElementById('gift-checkbox').addEventListener('change', (e) => {
            this.handleGiftToggle(e.target.checked);
        });

        document.getElementById('cart-gift-checkbox').addEventListener('change', (e) => {
            this.handleGiftToggle(e.target.checked);
        });

        // Billing address
        document.getElementById('billing-same').addEventListener('change', (e) => {
            this.handleBillingSameToggle(e.target.checked);
        });

        // Payment
        document.getElementById('pay-button').addEventListener('click', () => {
            this.handlePayment();
        });

        // Cart button
        document.getElementById('cart-button').addEventListener('click', () => {
            this.openCartModal();
        });

        // Shipping address changes
        ['s-name', 's-address1', 's-city', 's-state', 's-zip'].forEach(field => {
            document.getElementById(field).addEventListener('input', () => {
                if (document.getElementById('billing-same').checked) {
                    this.copyShippingToBilling();
                }
            });
        });

        // Billing state tax calculation
        document.getElementById('b-state').addEventListener('change', () => {
            this.calculateOrderTotal();
        });
    }

    loadInitialState() {
        // Load gift option from localStorage
        const savedGiftOption = localStorage.getItem('checkoutGiftOption');
        this.isGift = savedGiftOption ? JSON.parse(savedGiftOption) : false;
        
        // Set initial shipping cost
        document.getElementById('shipping-cost').textContent = this.SHIPPING_COST.toFixed(2);
        
        // Load cart data
        this.loadCartData();
    }

    loadCartData() {
        // Use stripe-payment cart data as single source of truth
        if (window.stripePayment && window.stripePayment.cart) {
            this.cartItems = window.stripePayment.cart;
            this.isGift = window.stripePayment.isGift;
        }
        
        // Update checkboxes
        document.getElementById('gift-checkbox').checked = this.isGift;
        document.getElementById('cart-gift-checkbox').checked = this.isGift;
        
        this.updateUI();
    }

    handleGiftToggle(isGift) {
        this.isGift = isGift;
        
        // Update both checkboxes
        document.getElementById('gift-checkbox').checked = isGift;
        document.getElementById('cart-gift-checkbox').checked = isGift;
        
        // Save to localStorage
        localStorage.setItem('checkoutGiftOption', JSON.stringify(isGift));
        
        // Save to stripe-payment if available
        if (window.stripePayment) {
            window.stripePayment.isGift = isGift;
            window.stripePayment.saveCartToStorage();
        }
        
        this.updateGiftUI();
        this.calculateOrderTotal();
    }

    updateGiftUI() {
        const shippingSection = document.getElementById('shipping-address-section');
        const shippingNote = document.getElementById('shipping-highlight-note');
        const giftFeeLine = document.getElementById('gift-fee-line');
        
        if (this.isGift) {
            shippingSection.classList.add('highlight');
            shippingNote.classList.remove('hidden');
            giftFeeLine.classList.remove('hidden');
        } else {
            shippingSection.classList.remove('highlight');
            shippingNote.classList.add('hidden');
            giftFeeLine.classList.add('hidden');
        }
    }

    handleBillingSameToggle(isSame) {
        const billingForm = document.getElementById('billing-address-form');
        if (isSame) {
            billingForm.classList.add('hidden');
            this.copyShippingToBilling();
        } else {
            billingForm.classList.remove('hidden');
        }
        this.calculateOrderTotal();
    }

    copyShippingToBilling() {
        const fields = ['name', 'address1', 'city', 'state', 'zip'];
        fields.forEach(field => {
            const shippingField = document.getElementById('s-' + field);
            const billingField = document.getElementById('b-' + field);
            if (shippingField && billingField) {
                billingField.value = shippingField.value;
            }
        });
    }

    updateUI() {
        this.renderCheckoutItems();
        this.updateGiftUI();
        this.calculateOrderTotal();
        this.checkAuthState();
    }

    renderCheckoutItems() {
        const container = document.getElementById('checkout-items-container');
        const orderSummary = document.getElementById('order-items-summary');
        
        if (this.cartItems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Your cart is empty</p>';
            orderSummary.innerHTML = '<div class="summary-line"><span>No items</span><span>$0.00</span></div>';
            return;
        }

        // Render items in checkout section (above Order Summary)
        container.innerHTML = this.cartItems.map(item => `
            <div class="cart-item" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee; gap: 12px;">
                <img src="${item.imageUrl}" alt="${item.paletteName}" class="cart-item-image">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px; line-height: 1.3;">${item.paletteName}</div>
                    <div style="color: #666; font-size: 12px; margin-bottom: 2px;">
                        ${item.itemType}
                    </div>
                    <div style="color: #666; font-size: 13px;">
                        $${item.discountedPrice.toFixed(2)}
                        ${item.discount > 0 ? `<span style="color: #28a745; font-size: 12px;">(${item.discount}% off)</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Render ONLY in order summary section (remove duplicate above)
        orderSummary.innerHTML = this.cartItems.map(item => `
            <div class="summary-line">
                <span>${item.paletteName} (${item.itemType})</span>
                <span>$${item.discountedPrice.toFixed(2)}</span>
            </div>
        `).join('');
    }

    

    calculateOrderTotal() {
        if (this.cartItems.length === 0) {
            this.updateTotalDisplay(0);
            return;
        }

        const subtotal = this.cartItems.reduce((total, item) => total + item.discountedPrice, 0);
        let total = subtotal + this.SHIPPING_COST;
        
        // Add gift fee
        if (this.isGift) {
            total += this.GIFT_FEE;
            document.getElementById('summary-gift-fee').textContent = this.GIFT_FEE.toFixed(2);
        }

        // Calculate tax based on billing address
        const taxState = this.getTaxState();
        const isBillingCA = (taxState === 'CA');
        
        let taxAmount = 0;
        if (isBillingCA) {
            const taxableBase = subtotal + (this.isGift ? this.GIFT_FEE : 0) + this.SHIPPING_COST;
            taxAmount = taxableBase * this.CA_TAX_RATE;
            total += taxAmount;
            
            document.getElementById('sales-tax').textContent = taxAmount.toFixed(2);
            document.getElementById('tax-line').classList.remove('hidden');
        } else {
            document.getElementById('tax-line').classList.add('hidden');
        }

        this.updateTotalDisplay(total);
    }

    getTaxState() {
        if (document.getElementById('billing-same').checked) {
            const shippingState = document.getElementById('s-state').value;
            return shippingState;
        } else {
            const billingState = document.getElementById('b-state').value;
            return billingState;
        }
    }

    updateTotalDisplay(total) {
        document.getElementById('order-total').textContent = total.toFixed(2);
        document.getElementById('final-total-btn').textContent = total.toFixed(2);
        
        const payButton = document.getElementById('pay-button');
        payButton.innerHTML = `Pay Now (Total: $${total.toFixed(2)})`;
    }

    async initializeStripe() {
        try {
            this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
            this.hideError();
        } catch (error) {
            this.showError('Failed to initialize payment system');
            console.error('Stripe initialization error:', error);
        }
    }

    checkAuthState() {
        const payButton = document.getElementById('pay-button');
        const errorDiv = document.getElementById('error-message');
        const authRequired = document.getElementById('auth-required-message');
        const checkoutContent = document.getElementById('checkout-content');
        
        const isAuthenticated = window.isAuthenticated && window.isAuthenticated();
        const hasCartItems = this.cartItems.length > 0;
        
        if (isAuthenticated && hasCartItems) {
            authRequired.style.display = 'none';
            checkoutContent.style.display = 'block';
            payButton.disabled = false;
            payButton.style.opacity = '1';
            if (errorDiv) errorDiv.classList.add('hidden');
        } else if (!isAuthenticated) {
            authRequired.style.display = 'block';
            checkoutContent.style.display = 'none';
            payButton.disabled = true;
            payButton.style.opacity = '0.7';
        } else {
            authRequired.style.display = 'none';
            checkoutContent.style.display = 'block';
            payButton.disabled = true;
            payButton.style.opacity = '0.7';
            if (errorDiv) {
                errorDiv.textContent = 'Your cart is empty';
                errorDiv.classList.remove('hidden');
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    hideError() {
        const errorDiv = document.getElementById('error-message');
        errorDiv.classList.add('hidden');
    }

    async handlePayment() {
        this.hideError();
        
        if (!window.isAuthenticated || !window.isAuthenticated()) {
            this.showError('Please sign in to complete your purchase');
            return;
        }

        if (this.cartItems.length === 0) {
            this.showError('Your cart is empty');
            return;
        }

        // Validate shipping address
        if (!this.validateShippingAddress()) {
            this.showError('Please fill in all required shipping address fields');
            return;
        }

        try {
            await this.processPayment();
        } catch (error) {
            console.error('Payment error:', error);
            this.showError(error.message || 'Payment failed. Please try again.');
        }
    }

    validateShippingAddress() {
        const requiredFields = ['s-name', 's-address1', 's-city', 's-state', 's-zip'];
        return requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });
    }

    async processPayment() {
        const payButton = document.getElementById('pay-button');
        payButton.disabled = true;
        payButton.textContent = 'Processing...';
    
        const totalAmount = parseFloat(document.getElementById('order-total').textContent);
        const amountInCents = Math.round(totalAmount * 100);
        const userInfo = window.getUserInfo();
        const session = window.getSession();
    
        if (!userInfo?.email || !session?.id_token) {
            throw new Error('Authentication information missing');
        }
    
        const checkoutCartItems = this.cartItems.map(item => ({
            design_id: item.designId || item.design_id,
            palette_name: item.paletteName,
            item_type: item.itemType || 'phone-case',
            final_price: item.discountedPrice,
            original_price: item.originalPrice,
            image_url: item.imageUrl
        }));
    
        const requestBody = {
            action: 'createCheckoutSession',
            user_email: userInfo.email,
            amount: amountInCents,
            cart_items: checkoutCartItems,
            item_count: this.cartItems.length,
            is_gift: this.isGift
        };
    
        console.log('Creating checkout session with data:', requestBody);
    
        const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + session.id_token
            },
            body: JSON.stringify(requestBody)
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
    
        if (!data.id) {
            throw new Error('No session ID received from server');
        }
    
        console.log('Stripe session created, redirecting to:', data.id);
    
        // ✅ CRITICAL FIX: Use direct URL redirect for new Stripe Checkout
        // The old stripe.redirectToCheckout() doesn't work with the new session format
        window.location.href = data.url; // Use the session URL returned by Stripe
        
        // Alternative: If you want to use Stripe.js (make sure you're loading it)
        // const result = await this.stripe.redirectToCheckout({
        //     sessionId: data.id
        // });
        // 
        // if (result.error) {
        //     throw new Error(result.error.message);
        // }
    }
    // Cart modal functions
    openCartModal() {
        if (window.stripePayment) {
            window.stripePayment.openCartModal();
        }
    }

    closeCartModal() {
        if (window.stripePayment) {
            window.stripePayment.closeCartModal();
        }
    }

    proceedToCheckout() {
        if (window.stripePayment) {
            window.stripePayment.proceedToCheckout();
        }
    }
}

// Initialize the checkout manager
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('cart-modal');
    if (event.target === modal) {
        window.checkoutManager.closeCartModal();
    }
});
