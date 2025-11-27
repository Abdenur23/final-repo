// checkout-manager.js
// checkout-manager.js
class CheckoutManager {
    constructor(cartManager, promoManager, authManager) {
        this.cartManager = cartManager;
        this.promoManager = promoManager;
        this.authManager = authManager;
        this.shippingCost = 8.90;
        this.taxRates = {
            'CA': 0.0825, // 8.25%
            'NY': 0.08875, // 8.875%
            'TX': 0.0825, // 8.25%
            'FL': 0.07, // 7%
            'IL': 0.1025, // 10.25%
            'PA': 0.06, // 6%
            'OH': 0.075, // 7.5%
            'GA': 0.07, // 7%
            'NC': 0.06975, // 6.975%
            'MI': 0.06 // 6%
            // Other states will default to 0%
        };
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Same as shipping checkbox
        document.addEventListener('change', (e) => {
            if (e.target.id === 'same-as-shipping') {
                this.toggleBillingAddress(e.target.checked);
            }
        });

        // Shipping address changes
        document.addEventListener('input', (e) => {
            if (e.target.closest('#shipping-address-fields')) {
                this.syncBillingAddressIfEnabled();
            }
        });

        // Billing state change for tax calculation
        document.addEventListener('change', (e) => {
            if (e.target.id === 'billing-state') {
                this.updateTaxAndTotals();
            }
        });

        // Promo code application from checkout
        document.addEventListener('click', (e) => {
            if (e.target.closest('#checkout-promo-apply')) {
                this.applyPromoFromCheckout();
            }
        });
    }

    applyPromoFromCheckout() {
        const promoInput = document.getElementById('checkout-promo-input');
        if (promoInput && promoInput.value) {
            this.promoManager.applyPromoCode(promoInput.value).then(() => {
                // Refresh checkout display after promo application
                this.renderCheckout();
            });
        }
    }

    getCartTotal() {
        const subtotal = this.cartManager.cart.reduce((sum, item) => sum + item.price, 0);
        const discountAmount = subtotal * this.cartManager.promoDiscount;
        const finalSubtotal = subtotal - discountAmount;

        return {
            subtotal: subtotal.toFixed(2),
            discount: discountAmount.toFixed(2),
            finalSubtotal: finalSubtotal.toFixed(2)
        };
    }

    updateTaxAndTotals() {
        const billingState = document.getElementById('billing-state')?.value || '';
        const cartTotals = this.getCartTotal();
        const subtotal = parseFloat(cartTotals.finalSubtotal);
        const tax = this.calculateTax(subtotal, billingState);
        const finalTotal = subtotal + this.shippingCost + tax;

        // Update display
        this.updateSummaryDisplay({
            subtotal: cartTotals.subtotal,
            discount: cartTotals.discount,
            finalSubtotal: subtotal.toFixed(2),
            shipping: this.shippingCost.toFixed(2),
            tax: tax.toFixed(2),
            total: finalTotal.toFixed(2),
            showTax: tax > 0,
            showDiscount: parseFloat(cartTotals.discount) > 0
        });
    }

    updateSummaryDisplay(totals) {
        const elements = {
            'checkout-subtotal': `$${totals.subtotal}`,
            'checkout-shipping': `$${totals.shipping}`,
            'checkout-tax': totals.showTax ? `$${totals.tax}` : '$0.00',
            'checkout-total': `$${totals.total}`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Hide/show tax line
        const taxElement = document.getElementById('checkout-tax').closest('div');
        if (taxElement) {
            taxElement.style.display = totals.showTax ? 'flex' : 'none';
        }

        // Add/update discount line
        this.updateDiscountDisplay(totals);
    }

    updateDiscountDisplay(totals) {
        let discountElement = document.getElementById('checkout-discount');
        
        if (totals.showDiscount) {
            if (!discountElement) {
                // Create discount element if it doesn't exist
                const shippingElement = document.getElementById('checkout-shipping').closest('div');
                discountElement = document.createElement('div');
                discountElement.id = 'checkout-discount';
                discountElement.className = 'flex justify-between text-green-600';
                discountElement.innerHTML = `<span>Discount</span><span>-$${totals.discount}</span>`;
                shippingElement.parentNode.insertBefore(discountElement, shippingElement.nextSibling);
            } else {
                // Update existing discount element
                discountElement.innerHTML = `<span>Discount</span><span>-$${totals.discount}</span>`;
                discountElement.style.display = 'flex';
            }
        } else if (discountElement) {
            // Hide discount element if no discount
            discountElement.style.display = 'none';
        }
    }

    renderCheckout() {
        this.renderOrderItems();
        this.updateTaxAndTotals();
        this.togglePromoSection();
        this.initializeBillingAddress();
        this.updatePromoDisplay();
    }

    updatePromoDisplay() {
        const promoMessage = document.getElementById('checkout-promo-message');
        if (promoMessage && this.promoManager.activePromoCode) {
            promoMessage.textContent = `Promo ${this.promoManager.activePromoCode} applied: ${this.cartManager.promoDiscount * 100}% off`;
            promoMessage.className = 'text-sm mt-2 text-green-700';
        }
    }

    togglePromoSection() {
        const promoSection = document.querySelector('#checkout-page .section-background:has(#checkout-promo-input)');
        if (promoSection) {
            promoSection.style.display = this.promoManager.activePromoCode ? 'none' : 'block';
        }
    }

    validateForm() {
        // Validate shipping address
        const shippingFields = [
            { id: 'shipping-full-name', name: 'Full Name' },
            { id: 'shipping-street-address', name: 'Street Address' },
            { id: 'shipping-city', name: 'City' },
            { id: 'shipping-state', name: 'State' },
            { id: 'shipping-zip-code', name: 'ZIP Code' }
        ];

        for (const field of shippingFields) {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                this.showError(`Please fill in the ${field.name} field`);
                element?.focus();
                return false;
            }
        }

        // Validate ZIP code format
        const zipCode = document.getElementById('shipping-zip-code').value;
        if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
            this.showError('Please enter a valid ZIP code');
            document.getElementById('shipping-zip-code').focus();
            return false;
        }

        // Validate billing address if different from shipping
        const sameAsShipping = document.getElementById('same-as-shipping');
        if (!sameAsShipping?.checked) {
            const billingFields = [
                { id: 'billing-full-name', name: 'Billing Full Name' },
                { id: 'billing-street-address', name: 'Billing Street Address' },
                { id: 'billing-city', name: 'Billing City' },
                { id: 'billing-state', name: 'Billing State' },
                { id: 'billing-zip-code', name: 'Billing ZIP Code' }
            ];

            for (const field of billingFields) {
                const element = document.getElementById(field.id);
                if (!element || !element.value.trim()) {
                    this.showError(`Please fill in the ${field.name} field`);
                    element?.focus();
                    return false;
                }
            }

            // Validate billing ZIP code format
            const billingZipCode = document.getElementById('billing-zip-code').value;
            if (!/^\d{5}(-\d{4})?$/.test(billingZipCode)) {
                this.showError('Please enter a valid billing ZIP code');
                document.getElementById('billing-zip-code').focus();
                return false;
            }
        }

        // Validate cart has items
        if (this.cartManager.getCart().length === 0) {
            this.showError('Your cart is empty. Please add items before checking out.');
            return false;
        }

        return true;
    }

    showError(message) {
        // Remove any existing error messages
        this.clearErrors();
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <span class="text-red-500 mr-2">⚠</span>
                <span>${message}</span>
            </div>
        `;
        
        // Insert error at the top of checkout page
        const checkoutPage = document.getElementById('checkout-page');
        const firstChild = checkoutPage.firstElementChild;
        checkoutPage.insertBefore(errorDiv, firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    clearErrors() {
        const errors = document.querySelectorAll('#checkout-page .bg-red-50');
        errors.forEach(error => error.remove());
    }

    async placeOrder() {
        // Clear previous errors
        this.clearErrors();
        
        if (!this.validateForm()) {
            return;
        }

        const userInfo = this.authManager.getUserInfo();
        if (!userInfo) {
            this.showError('Please sign in to place an order');
            return;
        }

        try {
            // Disable place order button to prevent multiple submissions
            const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
            const originalText = placeOrderBtn.textContent;
            placeOrderBtn.textContent = 'Processing...';
            placeOrderBtn.disabled = true;

            // Get form data
            const orderData = this.collectOrderData();
            
            // Here you would integrate with your order API
            console.log('Placing order:', orderData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            this.showSuccess('Order placed successfully!');
            this.cartManager.clearCart();
            this.promoManager.clearPromoData();
            window.app.navigateTo('homepage');
            
        } catch (error) {
            console.error('Order placement error:', error);
            this.showError('Failed to place order. Please try again.');
            
            // Re-enable button
            const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
            placeOrderBtn.textContent = 'Place Your Order';
            placeOrderBtn.disabled = false;
        }
    }

    collectOrderData() {
        const shippingAddress = this.collectAddressData('shipping');
        const billingAddress = document.getElementById('same-as-shipping')?.checked ? 
            shippingAddress : this.collectAddressData('billing');

        return {
            items: this.cartManager.getCart(),
            totals: this.cartManager.getCartTotal(),
            shippingCost: this.shippingCost,
            tax: this.calculateTax(parseFloat(this.cartManager.getCartTotal().subtotal), billingAddress.state),
            shippingAddress,
            billingAddress,
            promoCode: this.promoManager.activePromoCode,
            giftWrapping: this.cartManager.hasGiftWrapping()
        };
    }

    collectAddressData(prefix) {
        return {
            fullName: document.getElementById(`${prefix}-full-name`)?.value || '',
            streetAddress: document.getElementById(`${prefix}-street-address`)?.value || '',
            address2: document.getElementById(`${prefix}-address-2`)?.value || '',
            city: document.getElementById(`${prefix}-city`)?.value || '',
            state: document.getElementById(`${prefix}-state`)?.value || '',
            zipCode: document.getElementById(`${prefix}-zip-code`)?.value || ''
        };
    }

    showSuccess(message) {
        // Simple success display - you might want to enhance this
        alert(message);
    }
}
