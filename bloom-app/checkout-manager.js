// checkout-manager.js
class CheckoutManager {
    constructor(cartManager, promoManager, authManager) {
        this.cartManager = cartManager;
        this.promoManager = promoManager;
        this.authManager = authManager;
        this.shippingCost = 8.90;
        this.stripeIntegration = new StripeIntegration(this);
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

        // Save form data as user types
        document.addEventListener('input', (e) => {
            this.saveFormData();
        });
        
        document.addEventListener('change', (e) => {
            this.saveFormData();
        });
    }

    saveFormData() {
        // Save shipping address
        const shippingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        shippingFields.forEach(field => {
            const element = document.getElementById(`shipping-${field}`);
            if (element) {
                localStorage.setItem(`checkout_shipping_${field}`, element.value);
            }
        });
        
        // Save billing address only if different from shipping
        const sameAsShipping = document.getElementById('same-as-shipping');
        if (!sameAsShipping?.checked) {
            const billingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
            billingFields.forEach(field => {
                const element = document.getElementById(`billing-${field}`);
                if (element) {
                    localStorage.setItem(`checkout_billing_${field}`, element.value);
                }
            });
        } else {
            // Clear saved billing data if using same as shipping
            const billingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
            billingFields.forEach(field => {
                localStorage.removeItem(`checkout_billing_${field}`);
            });
        }
    }

    loadSavedAddresses() {
        // Load shipping address
        const shippingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        shippingFields.forEach(field => {
            const savedValue = localStorage.getItem(`checkout_shipping_${field}`);
            const element = document.getElementById(`shipping-${field}`);
            if (element && savedValue) {
                element.value = savedValue;
            }
        });
        
        // Load billing address if separate
        const billingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        billingFields.forEach(field => {
            const savedValue = localStorage.getItem(`checkout_billing_${field}`);
            const element = document.getElementById(`billing-${field}`);
            if (element && savedValue) {
                element.value = savedValue;
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

    toggleBillingAddress(sameAsShipping) {
        const billingFields = document.getElementById('billing-address-fields');
        if (!billingFields) return;

        if (sameAsShipping) {
            billingFields.style.display = 'none';
            this.syncBillingAddress();
        } else {
            billingFields.style.display = 'block';
        }
        this.updateTaxAndTotals();
    }

    syncBillingAddressIfEnabled() {
        const sameAsShipping = document.getElementById('same-as-shipping');
        if (sameAsShipping?.checked) {
            this.syncBillingAddress();
        }
    }

    syncBillingAddress() {
        const shippingFields = [
            'full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'
        ];

        shippingFields.forEach(field => {
            const shippingValue = document.getElementById(`shipping-${field}`)?.value;
            const billingField = document.getElementById(`billing-${field}`);
            if (billingField && shippingValue !== undefined) {
                billingField.value = shippingValue;
            }
        });
        this.updateTaxAndTotals();
    }

    getTaxRate(state) {
        return this.taxRates[state] || 0;
    }

    calculateTax(subtotal, state) {
        const taxRate = this.getTaxRate(state);
        return subtotal * taxRate;
    }

    getCartTotal() {
        const subtotal = this.cartManager.cart.reduce((sum, item) => sum + item.price, 0);
        const discountAmount = subtotal * (this.cartManager.promoDiscount || 0);
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
        const taxElement = document.getElementById('checkout-tax')?.closest('div');
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
                const shippingElement = document.getElementById('checkout-shipping')?.closest('div');
                if (!shippingElement) return;

                discountElement = document.createElement('div');
                discountElement.id = 'checkout-discount';
                discountElement.className = 'flex justify-between text-green-600';
                
                // Insert the new discount element before the shipping element
                shippingElement.parentNode.insertBefore(discountElement, shippingElement); 
            }
            // Update existing discount element
            discountElement.innerHTML = `<span>Discount</span><span>-$${totals.discount}</span>`;
            discountElement.style.display = 'flex';
        } else if (discountElement) {
            // Hide discount element if no discount
            discountElement.style.display = 'none';
        }
    }

    renderCheckout() {
        this.renderOrderItems();
        this.initializeBillingAddress();
        this.updateTaxAndTotals();
        this.togglePromoSection();
        this.updatePromoDisplay();
    }

    initializeBillingAddress() {
        const sameAsShipping = document.getElementById('same-as-shipping');
        
        // Load saved addresses from localStorage if they exist
        this.loadSavedAddresses();
        
        if (sameAsShipping) {
            // Check if we have separate billing address saved
            const hasSeparateBilling = localStorage.getItem('checkout_billing_full-name');
            sameAsShipping.checked = !hasSeparateBilling;
            this.toggleBillingAddress(!hasSeparateBilling);
        }
        
        // Update totals after loading addresses
        this.updateTaxAndTotals();
    }

    renderOrderItems() {
        const container = document.getElementById('checkout-items');
        if (!container) return;

        const cart = this.cartManager.getCart();
        
        if (cart.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Your cart is empty</p>';
            return;
        }

        container.innerHTML = cart.map(item => `
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    ${item.isGiftWrapping ? 
                        '<span class="text-xl">🎁</span>' : 
                        `<img src="${item.thumbnail}" class="w-12 h-12 object-cover rounded" alt="${item.name}">`
                    }
                    <div>
                        <p class="font-medium">${item.name}</p>
                        ${item.product_type || item.device ? `<p class="text-xs text-gray-400 italic">${item.product_type ? item.product_type : ''} ${item.device ? `for ${item.device}` : ''}</p>` : ''}
                    </div>
                </div>
                <span class="font-semibold">$${item.price.toFixed(2)}</span>
            </div>
        `).join('');

        // Update shipping address label if gift wrapping exists
        this.updateShippingLabel();
    }

    updateShippingLabel() {
        const hasGiftWrapping = this.cartManager.hasGiftWrapping();
        const shippingTitle = document.querySelector('#shipping-address h3');
        
        if (shippingTitle && hasGiftWrapping) {
            shippingTitle.textContent = 'Gift Recipient Address';
        }
    }

    togglePromoSection() {
        const promoSection = document.querySelector('#checkout-page .section-background:has(#checkout-promo-input)');
        if (promoSection) {
            // Check if there's an active promo code with valid discount
            const hasActivePromo = this.promoManager.activePromoCode && 
                                  this.cartManager.promoDiscount > 0;
            promoSection.style.display = hasActivePromo ? 'none' : 'block';
        }
    }

    updatePromoDisplay() {
        const promoMessage = document.getElementById('checkout-promo-message');
        if (promoMessage && this.promoManager.activePromoCode) {
            promoMessage.textContent = `Promo ${this.promoManager.activePromoCode} applied: ${this.cartManager.promoDiscount * 100}% off`;
            promoMessage.className = 'text-sm mt-2 text-green-700';
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
            this.showError('Please enter a valid shipping ZIP code (e.g., 90210 or 90210-0000)');
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
                this.showError('Please enter a valid billing ZIP code (e.g., 90210 or 90210-0000)');
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
        errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 error-message-temp';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <span class="text-red-500 mr-2">⚠</span>
                <span>${message}</span>
            </div>
        `;
        
        // Insert error at the top of checkout page
        const checkoutPage = document.getElementById('checkout-page');
        if (!checkoutPage) {
            alert(message); // Fallback if checkout-page element is missing
            return;
        }
        
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
        const errors = document.querySelectorAll('#checkout-page .error-message-temp');
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

        // Button State Management
        const placeOrderBtn = document.querySelector('button[onclick*="placeOrder"]');
        let originalText = 'Place Your Order';
        if (placeOrderBtn) {
             originalText = placeOrderBtn.textContent;
             placeOrderBtn.textContent = 'Processing...';
             placeOrderBtn.disabled = true;
        }

        try {
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
            
            // Clear saved form data
            this.clearSavedFormData();
            
            window.app.navigateTo('homepage');
            
        } catch (error) {
            console.error('Order placement error:', error);
            this.showError('Failed to place order. Please try again.');
            
            // Re-enable button on failure
            if (placeOrderBtn) {
                 placeOrderBtn.textContent = originalText;
                 placeOrderBtn.disabled = false;
            }
        }
    }

    clearSavedFormData() {
        const fields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        fields.forEach(field => {
            localStorage.removeItem(`checkout_shipping_${field}`);
            localStorage.removeItem(`checkout_billing_${field}`);
        });
    }

    collectOrderData() {
        const shippingAddress = this.collectAddressData('shipping');
        const billingAddress = document.getElementById('same-as-shipping')?.checked ? 
            shippingAddress : this.collectAddressData('billing');

        const cartTotals = this.getCartTotal();

        return {
            items: this.cartManager.getCart(),
            subtotal: parseFloat(cartTotals.subtotal),
            discount: parseFloat(cartTotals.discount),
            finalSubtotal: parseFloat(cartTotals.finalSubtotal),
            shippingCost: this.shippingCost,
            tax: this.calculateTax(parseFloat(cartTotals.finalSubtotal), billingAddress.state),
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
