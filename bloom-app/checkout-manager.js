// checkout-manager.js
class CheckoutManager {
    constructor(cartManager, promoManager, authManager) {
        this.cartManager = cartManager;
        this.promoManager = promoManager;
        this.authManager = authManager;
        this.shippingCost = 8.90;
        this.taxRates = {
            'AL': 0,
            'AK': 0,
            'AZ': 0,
            'AR': 0,
            'CA': 0,
            'CO': 0,
            'CT': 0,
            'DE': 0,
            'FL': 0,
            'GA': 0,
            'HI': 0,
            'ID': 0,
            'IL': 0,
            'IN': 0,
            'IA': 0,
            'KS': 0,
            'KY': 0,
            'LA': 0,
            'ME': 0,
            'MD': 0,
            'MA': 0,
            'MI': 0,
            'MN': 0,
            'MS': 0,
            'MO': 0,
            'MT': 0,
            'NE': 0,
            'NV': 0,
            'NH': 0,
            'NJ': 0,
            'NM': 0,
            'NY': 0,
            'NC': 0,
            'ND': 0,
            'OH': 0,
            'OK': 0,
            'OR': 0,
            'PA': 0,
            'RI': 0,
            'SC': 0,
            'SD': 0,
            'TN': 0,
            'TX': 0,
            'UT': 0,
            'VT': 0,
            'VA': 0,
            'WA': 0,
            'WV': 0,
            'WI': 0,
            'WY': 0,
            'DC': 0
        };
        
        // Initialize Stripe integration
        this.stripeIntegration = new StripeIntegration(this);
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.addEventListener('change', (e) => {
            if (e.target.id === 'same-as-shipping') {
                this.toggleBillingAddress(e.target.checked);
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.closest('#shipping-address-fields')) {
                this.syncBillingAddressIfEnabled();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'billing-state') {
                this.updateTaxAndTotals();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#checkout-promo-apply')) {
                this.applyPromoFromCheckout();
            }
        });

        document.addEventListener('input', (e) => {
            this.saveFormData();
        });
        
        document.addEventListener('change', (e) => {
            this.saveFormData();
        });
    }

    saveFormData() {
        const shippingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        shippingFields.forEach(field => {
            const element = document.getElementById(`shipping-${field}`);
            if (element) {
                localStorage.setItem(`checkout_shipping_${field}`, element.value);
            }
        });
        
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
            const billingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
            billingFields.forEach(field => {
                localStorage.removeItem(`checkout_billing_${field}`);
            });
        }
    }

    loadSavedAddresses() {
        const shippingFields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        shippingFields.forEach(field => {
            const savedValue = localStorage.getItem(`checkout_shipping_${field}`);
            const element = document.getElementById(`shipping-${field}`);
            if (element && savedValue) {
                element.value = savedValue;
            }
        });
        
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

        const taxElement = document.getElementById('checkout-tax')?.closest('div');
        if (taxElement) {
            taxElement.style.display = totals.showTax ? 'flex' : 'none';
        }

        this.updateDiscountDisplay(totals);
    }

    updateDiscountDisplay(totals) {
        let discountElement = document.getElementById('checkout-discount');
        
        if (totals.showDiscount) {
            if (!discountElement) {
                const shippingElement = document.getElementById('checkout-shipping')?.closest('div');
                if (!shippingElement) return;

                discountElement = document.createElement('div');
                discountElement.id = 'checkout-discount';
                discountElement.className = 'flex justify-between text-green-600';
                shippingElement.parentNode.insertBefore(discountElement, shippingElement); 
            }
            discountElement.innerHTML = `<span>Discount</span><span>-$${totals.discount}</span>`;
            discountElement.style.display = 'flex';
        } else if (discountElement) {
            discountElement.style.display = 'none';
        }
    }

    renderCheckout() {
        this.renderOrderItems();
        this.initializeBillingAddress();
        this.updateTaxAndTotals();
        this.togglePromoSection();
        this.updatePromoDisplay();
        this.renderGiftNoteInput();
    }

    initializeBillingAddress() {
        const sameAsShipping = document.getElementById('same-as-shipping');
        
        this.loadSavedAddresses();
        
        if (sameAsShipping) {
            const hasSeparateBilling = localStorage.getItem('checkout_billing_full-name');
            sameAsShipping.checked = !hasSeparateBilling;
            this.toggleBillingAddress(!hasSeparateBilling);
        }
        
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

        this.updateShippingLabel();
    }

    updateShippingLabel() {
        const hasGiftWrapping = this.cartManager.hasGiftWrapping();
        const shippingTitle = document.querySelector('#shipping-address h3');
        
        if (shippingTitle && hasGiftWrapping) {
            shippingTitle.textContent = 'Gift Recipient Address';
        }
    }

    renderGiftNoteInput() {
        const hasGiftWrapping = this.cartManager.hasGiftWrapping();
        
        // Remove existing if present
        const existingGiftNote = document.getElementById('gift-note-section');
        if (existingGiftNote) existingGiftNote.remove();
    
        if (!hasGiftWrapping) return;
    
        // Create simple input section
        const giftNoteSection = document.createElement('div');
        giftNoteSection.id = 'gift-note-section';
        giftNoteSection.className = 'section-background p-6 mt-6';
        giftNoteSection.innerHTML = `
            <h3 class="text-xl font-semibold mb-2">Gift Message</h3>
            <p class="text-sm text-gray-600 mb-3">Add a personal note to go with your gift wrapping</p>
            <textarea 
                id="gift-note-input" 
                placeholder="Write your personal message here..."
                class="input-style w-full h-32"
            ></textarea>
        `;
    
        // Insert it in the left column (forms side)
        const leftColumn = document.querySelector('#checkout-page .lg\\:grid-cols-2 > div:first-child');
        if (leftColumn) {
            // Insert after billing address section
            const billingSection = leftColumn.querySelector('.section-background:has(#same-as-shipping)');
            if (billingSection) {
                billingSection.parentNode.insertBefore(giftNoteSection, billingSection.nextSibling);
            }
        }
    
        // Load saved note if exists
        const savedNote = localStorage.getItem('gift_wrapping_note');
        if (savedNote) {
            document.getElementById('gift-note-input').value = savedNote;
        }
    }
    
    togglePromoSection() {
        const promoSection = document.querySelector('#checkout-page .section-background:has(#checkout-promo-input)');
        if (promoSection) {
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

        const zipCode = document.getElementById('shipping-zip-code').value;
        if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
            this.showError('Please enter a valid shipping ZIP code (e.g., 90210 or 90210-0000)');
            document.getElementById('shipping-zip-code').focus();
            return false;
        }

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

            const billingZipCode = document.getElementById('billing-zip-code').value;
            if (!/^\d{5}(-\d{4})?$/.test(billingZipCode)) {
                this.showError('Please enter a valid billing ZIP code (e.g., 90210 or 90210-0000)');
                document.getElementById('billing-zip-code').focus();
                return false;
            }
        }

        if (this.cartManager.getCart().length === 0) {
            this.showError('Your cart is empty. Please add items before checking out.');
            return false;
        }

        return true;
    }

    showError(message) {
        this.clearErrors();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 error-message-temp';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <span class="text-red-500 mr-2">⚠</span>
                <span>${message}</span>
            </div>
        `;
        
        const checkoutPage = document.getElementById('checkout-page');
        if (!checkoutPage) {
            alert(message);
            return;
        }
        
        const firstChild = checkoutPage.firstElementChild;
        checkoutPage.insertBefore(errorDiv, firstChild);
        
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
        this.clearErrors();
        
        if (!this.validateForm()) {
            return;
        }
    
        // Save gift note before processing ← ADD THIS CODE
        const giftNoteInput = document.getElementById('gift-note-input');
        if (giftNoteInput) {
            localStorage.setItem('gift_wrapping_note', giftNoteInput.value.trim());
        }
    
        await this.stripeIntegration.processCheckout();
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
            shippingAddress: this.formatAddressForAPI(shippingAddress),
            billingAddress: this.formatAddressForAPI(billingAddress),
            promoCode: this.promoManager.activePromoCode,
            giftWrapping: this.cartManager.hasGiftWrapping(),
            giftNote: document.getElementById('gift-note-input')?.value || ''
        };
    }

    formatAddressForAPI(address) {
        return {
            fullName: address.fullName,
            streetAddress: address.streetAddress,
            address2: address.address2,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode
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

    clearSavedFormData() {
        const fields = ['full-name', 'street-address', 'address-2', 'city', 'state', 'zip-code'];
        fields.forEach(field => {
            localStorage.removeItem(`checkout_shipping_${field}`);
            localStorage.removeItem(`checkout_billing_${field}`);
        });
    }

    showSuccess(message) {
        alert(message);
    }
}
