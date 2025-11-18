// js/checkout-manager.js
class CheckoutManager {
    constructor() {
        this.SHIPPING_COST = 8.70;
        this.GIFT_FEE = 12.00;
        this.CA_TAX_RATE = 0.0725;
        
        this.cartItems = [];
        this.isGift = false;
        this.stripe = null;
        
        // Fix: Ensure CONFIG is available
        this.ensureConfig();
        
        this.initialize();
    }

    ensureConfig() {
        // Ensure CONFIG and CHECKOUT_API_ENDPOINT are available
        if (typeof CONFIG === 'undefined') {
            console.warn('CONFIG not found, creating empty config');
            window.CONFIG = {};
        }
        
        // Set the correct Lambda endpoint
        if (!CONFIG.CHECKOUT_API_ENDPOINT) {
            CONFIG.CHECKOUT_API_ENDPOINT = 'https://qohagpc75m.execute-api.us-east-1.amazonaws.com/prod';
            console.log('Set CHECKOUT_API_ENDPOINT to:', CONFIG.CHECKOUT_API_ENDPOINT);
        }
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
        const giftCheckbox = document.getElementById('gift-checkbox');
        const cartGiftCheckbox = document.getElementById('cart-gift-checkbox');
        
        if (giftCheckbox) {
            giftCheckbox.addEventListener('change', (e) => {
                this.handleGiftToggle(e.target.checked);
            });
        }
        
        if (cartGiftCheckbox) {
            cartGiftCheckbox.addEventListener('change', (e) => {
                this.handleGiftToggle(e.target.checked);
            });
        }

        // Billing address
        const billingSame = document.getElementById('billing-same');
        if (billingSame) {
            billingSame.addEventListener('change', (e) => {
                this.handleBillingSameToggle(e.target.checked);
            });
        }

        // Payment
        const payButton = document.getElementById('pay-button');
        if (payButton) {
            payButton.addEventListener('click', () => {
                this.handlePayment();
            });
        }

        // Cart button
        const cartButton = document.getElementById('cart-button');
        if (cartButton) {
            cartButton.addEventListener('click', () => {
                this.openCartModal();
            });
        }

        // Shipping address changes
        ['s-name', 's-address1', 's-city', 's-state', 's-zip'].forEach(field => {
            const fieldElement = document.getElementById(field);
            if (fieldElement) {
                fieldElement.addEventListener('input', () => {
                    if (document.getElementById('billing-same')?.checked) {
                        this.copyShippingToBilling();
                        this.calculateOrderTotal(); 
                    }
                });
            }
        });

        // Billing state tax calculation
        const bState = document.getElementById('b-state');
        if (bState) {
            bState.addEventListener('change', () => {
                this.calculateOrderTotal();
            });
        }
    }

    loadInitialState() {
        // Load gift option from localStorage
        const savedGiftOption = localStorage.getItem('checkoutGiftOption');
        this.isGift = savedGiftOption ? JSON.parse(savedGiftOption) : false;
        
        // Set initial shipping cost
        const shippingCostElement = document.getElementById('shipping-cost');
        if (shippingCostElement) {
            shippingCostElement.textContent = this.SHIPPING_COST.toFixed(2);
        }
        
        // Load cart data
        this.loadCartData();
        // Copy shipping to billing if checkbox is checked
        if (document.getElementById('billing-same')?.checked) {
            this.copyShippingToBilling();
        }
    }

    loadCartData() {
        // Use stripe-payment cart data as single source of truth
        if (window.stripePayment && window.stripePayment.cart) {
            this.cartItems = window.stripePayment.cart;
            this.isGift = window.stripePayment.isGift;
        }
        
        // Update checkboxes
        const giftCheckbox = document.getElementById('gift-checkbox');
        const cartGiftCheckbox = document.getElementById('cart-gift-checkbox');
        
        if (giftCheckbox) giftCheckbox.checked = this.isGift;
        if (cartGiftCheckbox) cartGiftCheckbox.checked = this.isGift;
        
        this.updateUI();
    }

    handleGiftToggle(isGift) {
        this.isGift = isGift;
        
        // Update both checkboxes
        const giftCheckbox = document.getElementById('gift-checkbox');
        const cartGiftCheckbox = document.getElementById('cart-gift-checkbox');
        
        if (giftCheckbox) giftCheckbox.checked = isGift;
        if (cartGiftCheckbox) cartGiftCheckbox.checked = isGift;
        
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
        
        if (shippingSection) {
            if (this.isGift) {
                shippingSection.classList.add('highlight');
            } else {
                shippingSection.classList.remove('highlight');
            }
        }
        
        if (shippingNote) {
            if (this.isGift) {
                shippingNote.classList.remove('hidden');
            } else {
                shippingNote.classList.add('hidden');
            }
        }
        
        if (giftFeeLine) {
            if (this.isGift) {
                giftFeeLine.classList.remove('hidden');
            } else {
                giftFeeLine.classList.add('hidden');
            }
        }
    }

    handleBillingSameToggle(isSame) {
        const billingForm = document.getElementById('billing-address-form');
        if (billingForm) {
            if (isSame) {
                billingForm.classList.add('hidden');
                this.copyShippingToBilling();
            } else {
                billingForm.classList.remove('hidden');
            }
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
            if (container) {
                container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Your cart is empty</p>';
            }
            if (orderSummary) {
                orderSummary.innerHTML = '<div class="summary-line"><span>No items</span><span>$0.00</span></div>';
            }
            return;
        }

        // Render items in checkout section
        if (container) {
            container.innerHTML = this.cartItems.map(item => `
                <div class="cart-item" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee; gap: 12px;">
                    <img src="${item.imageUrl}" alt="${item.paletteName}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; flex-shrink: 0; background: #f5f5f5;">
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
        }

        // Render in order summary section
        if (orderSummary) {
            orderSummary.innerHTML = this.cartItems.map(item => `
                <div class="summary-line">
                    <span>${item.paletteName} (${item.itemType})</span>
                    <span>$${item.discountedPrice.toFixed(2)}</span>
                </div>
            `).join('');
        }
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
            const summaryGiftFee = document.getElementById('summary-gift-fee');
            if (summaryGiftFee) summaryGiftFee.textContent = this.GIFT_FEE.toFixed(2);
        }

        // Calculate tax based on billing address
        const taxState = this.getTaxState();
        const isBillingCA = (taxState === 'CA');
        
        let taxAmount = 0;
        if (isBillingCA) {
            const taxableBase = subtotal + (this.isGift ? this.GIFT_FEE : 0) + this.SHIPPING_COST;
            taxAmount = taxableBase * this.CA_TAX_RATE;
            total += taxAmount;
            
            const salesTax = document.getElementById('sales-tax');
            const taxLine = document.getElementById('tax-line');
            if (salesTax) salesTax.textContent = taxAmount.toFixed(2);
            if (taxLine) taxLine.classList.remove('hidden');
        } else {
            const taxLine = document.getElementById('tax-line');
            if (taxLine) taxLine.classList.add('hidden');
        }

        this.updateTotalDisplay(total);
    }

    getTaxState() {
        const billingSame = document.getElementById('billing-same');
        if (billingSame && billingSame.checked) {
            const shippingState = document.getElementById('s-state');
            return shippingState ? shippingState.value : '';
        } else {
            const billingState = document.getElementById('b-state');
            return billingState ? billingState.value : '';
        }
    }

    updateTotalDisplay(total) {
        const orderTotal = document.getElementById('order-total');
        const finalTotalBtn = document.getElementById('final-total-btn');
        const payButton = document.getElementById('pay-button');
        
        if (orderTotal) orderTotal.textContent = total.toFixed(2);
        if (finalTotalBtn) finalTotalBtn.textContent = total.toFixed(2);
        
        if (payButton) {
            payButton.innerHTML = `Pay Now (Total: $${total.toFixed(2)})`;
        }
    }

    async initializeStripe() {
        try {
            if (typeof Stripe === 'undefined') {
                throw new Error('Stripe.js not loaded');
            }
            if (!CONFIG.STRIPE_PUBLISHABLE_KEY) {
                throw new Error('Stripe publishable key not configured');
            }
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
            if (authRequired) authRequired.style.display = 'none';
            if (checkoutContent) checkoutContent.style.display = 'block';
            if (payButton) {
                payButton.disabled = false;
                payButton.style.opacity = '1';
            }
            if (errorDiv) errorDiv.classList.add('hidden');
        } else if (!isAuthenticated) {
            if (authRequired) authRequired.style.display = 'block';
            if (checkoutContent) checkoutContent.style.display = 'none';
            if (payButton) {
                payButton.disabled = true;
                payButton.style.opacity = '0.7';
            }
        } else {
            if (authRequired) authRequired.style.display = 'none';
            if (checkoutContent) checkoutContent.style.display = 'block';
            if (payButton) {
                payButton.disabled = true;
                payButton.style.opacity = '0.7';
            }
            if (errorDiv) {
                errorDiv.textContent = 'Your cart is empty';
                errorDiv.classList.remove('hidden');
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
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
        if (payButton) {
            payButton.disabled = true;
            payButton.textContent = 'Processing...';
        }

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
        const promoCode = localStorage.getItem('activePromoCode') || '';
        const requestBody = {
            action: 'createCheckoutSession',
            user_email: userInfo.email,
            amount: amountInCents,
            cart_items: checkoutCartItems,
            item_count: this.cartItems.length,
            is_gift: this.isGift,
            promo_code: promoCode
        };

        console.log('Sending checkout request to:', CONFIG.CHECKOUT_API_ENDPOINT);
        console.log('Request body:', requestBody);

        const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + session.id_token
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }

        if (!data.id) {
            throw new Error('No session ID received from server');
        }

        console.log('Stripe session created:', data);

        // ✅ FIX: Use the URL returned by Stripe or construct it
        if (data.url) {
            console.log('Redirecting to Stripe Checkout URL:', data.url);
            window.location.href = data.url;
        } else {
            // Fallback: construct the URL manually
            console.log('Using fallback URL construction with session ID:', data.id);
            window.location.href = `https://checkout.stripe.com/pay/${data.id}`;
        }
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
