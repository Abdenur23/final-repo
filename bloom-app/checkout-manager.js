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

    updateTaxAndTotals() {
        const billingState = document.getElementById('billing-state')?.value || '';
        const totals = this.cartManager.getCartTotal();
        const subtotal = parseFloat(totals.subtotal);
        const tax = this.calculateTax(subtotal, billingState);
        const finalTotal = subtotal + this.shippingCost + tax;

        // Update display
        this.updateSummaryDisplay({
            subtotal: subtotal.toFixed(2),
            shipping: this.shippingCost.toFixed(2),
            tax: tax.toFixed(2),
            total: finalTotal.toFixed(2),
            showTax: tax > 0
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

        // Hide tax line if 0
        const taxElement = document.getElementById('checkout-tax').closest('div');
        if (taxElement) {
            taxElement.style.display = totals.showTax ? 'flex' : 'none';
        }
    }

    renderCheckout() {
        this.renderOrderItems();
        this.updateTaxAndTotals();
        this.togglePromoSection();
        this.initializeBillingAddress();
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
                        ${item.device ? `<p class="text-sm text-gray-500">${item.device}</p>` : ''}
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
            promoSection.style.display = this.promoManager.activePromoCode ? 'none' : 'block';
        }
    }

    initializeBillingAddress() {
        const sameAsShipping = document.getElementById('same-as-shipping');
        if (sameAsShipping) {
            sameAsShipping.checked = true;
            this.toggleBillingAddress(true);
        }
    }

    validateForm() {
        const shippingFields = [
            'shipping-full-name', 'shipping-street-address', 'shipping-city', 'shipping-state', 'shipping-zip-code'
        ];

        for (const fieldId of shippingFields) {
            const field = document.getElementById(fieldId);
            if (!field?.value.trim()) {
                this.showError(`Please fill in all required shipping fields`);
                return false;
            }
        }

        // Validate billing address if different from shipping
        const sameAsShipping = document.getElementById('same-as-shipping');
        if (!sameAsShipping?.checked) {
            const billingFields = [
                'billing-full-name', 'billing-street-address', 'billing-city', 'billing-state', 'billing-zip-code'
            ];

            for (const fieldId of billingFields) {
                const field = document.getElementById(fieldId);
                if (!field?.value.trim()) {
                    this.showError(`Please fill in all required billing fields`);
                    return false;
                }
            }
        }

        return true;
    }

    showError(message) {
        // Simple error display - you might want to enhance this
        alert(message);
    }

    async placeOrder() {
        if (!this.validateForm()) {
            return;
        }

        const userInfo = this.authManager.getUserInfo();
        if (!userInfo) {
            this.showError('Please sign in to place an order');
            return;
        }

        try {
            // Get form data
            const orderData = this.collectOrderData();
            
            // Here you would integrate with your order API
            console.log('Placing order:', orderData);
            
            // For now, just show success message
            this.showSuccess('Order placed successfully!');
            this.cartManager.clearCart();
            window.app.navigateTo('homepage');
            
        } catch (error) {
            console.error('Order placement error:', error);
            this.showError('Failed to place order. Please try again.');
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
