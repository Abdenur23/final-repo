// js/checkout-manager.js
class CheckoutManager {
    constructor() {
        this.cartManager = window.cartManager;
        this.addressVerifier = new AddressVerifier();
        this.shippingAddress = null;
        this.billingAddress = null;
        this.taxRate = 0;
        this.isCalculatingTax = false;
    }

    async initialize() {
        this.setupEventListeners();
        this.populateStates();
        await this.loadCartItems();
        this.updateOrderSummary();
        this.setupAddressVerification();
    }

    setupEventListeners() {
        // Gift option
        document.getElementById('is-gift').addEventListener('change', (e) => {
            this.toggleGiftSection(e.target.checked);
            this.cartManager.setGiftOption(e.target.checked);
            this.updateOrderSummary();
        });

        // Same as shipping address
        document.getElementById('same-as-shipping').addEventListener('change', (e) => {
            this.toggleBillingForm(!e.target.checked);
        });

        // Form submissions
        document.getElementById('shipping-form').addEventListener('input', () => {
            this.validateForms();
        });

        document.getElementById('billing-form').addEventListener('input', () => {
            this.validateForms();
        });

        // State change for tax calculation
        document.getElementById('state').addEventListener('change', () => {
            this.calculateTax();
        });

        // Stripe checkout button
        document.getElementById('stripe-checkout-btn').addEventListener('click', () => {
            this.proceedToStripeCheckout();
        });
    }

    populateStates() {
        const states = [
            'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
            'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
            'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
            'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
            'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
        ];

        const stateSelect = document.getElementById('state');
        const billingStateSelect = document.getElementById('billing-state');
        
        states.forEach(state => {
            stateSelect.appendChild(new Option(state, state));
            billingStateSelect.appendChild(new Option(state, state));
        });
    }

    async loadCartItems() {
        const container = document.getElementById('checkout-items');
        const cartItems = this.cartManager.getCartItems();

        if (cartItems.length === 0) {
            container.innerHTML = '<p>Your cart is empty</p>';
            return;
        }

        container.innerHTML = cartItems.map(item => `
            <div class="cart-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
                <img src="${item.imageUrl}" alt="${item.paletteName}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 12px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 14px;">${item.paletteName}</div>
                    <div style="color: #666; font-size: 13px;">
                        $${item.discountedPrice.toFixed(2)}
                        ${item.discount > 0 ? `<span style="color: #28a745;">(${item.discount}% off)</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleGiftSection(isGift) {
        const giftSection = document.getElementById('gift-recipient-section');
        giftSection.style.display = isGift ? 'block' : 'none';
        
        // Update gift fee in summary
        const giftFeeSummary = document.getElementById('gift-fee-summary');
        giftFeeSummary.style.display = isGift ? 'flex' : 'none';
    }

    toggleBillingForm(show) {
        const billingForm = document.getElementById('billing-form');
        billingForm.style.display = show ? 'block' : 'none';
    }

    setupAddressVerification() {
        const addressInput = document.getElementById('address-line1');
        const suggestionsContainer = document.getElementById('address-suggestions');
        
        this.addressVerifier.setupAddressAutocomplete(addressInput, suggestionsContainer);
        
        // Verify address when user leaves the field
        addressInput.addEventListener('blur', () => {
            this.verifyShippingAddress();
        });
    }

    async verifyShippingAddress() {
        const address = {
            line1: document.getElementById('address-line1').value,
            line2: document.getElementById('address-line2').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zip-code').value
        };

        const result = await this.addressVerifier.verifyAddress(address);
        
        if (result.isValid) {
            document.getElementById('address-line1').classList.add('address-verified');
            this.shippingAddress = result.address;
            this.calculateTax();
        } else {
            document.getElementById('address-line1').classList.remove('address-verified');
        }
        
        this.validateForms();
    }

    async calculateTax() {
        if (this.isCalculatingTax) return;
        
        this.isCalculatingTax = true;
        const state = document.getElementById('state').value;
        
        // Only calculate tax for California
        if (state === 'CA' && this.shippingAddress) {
            try {
                // Calculate 8.5% tax for CA (adjust rate as needed)
                this.taxRate = 0.085;
                const subtotal = this.cartManager.getSubtotal();
                const giftFee = this.cartManager.getGiftFee();
                const taxableAmount = subtotal + giftFee;
                const taxAmount = taxableAmount * this.taxRate;
                
                document.getElementById('tax-amount').textContent = taxAmount.toFixed(2);
                document.getElementById('tax-line').style.display = 'flex';
            } catch (error) {
                console.error('Tax calculation failed:', error);
                this.taxRate = 0;
                document.getElementById('tax-line').style.display = 'none';
            }
        } else {
            this.taxRate = 0;
            document.getElementById('tax-line').style.display = 'none';
        }
        
        this.updateOrderSummary();
        this.isCalculatingTax = false;
    }

    updateOrderSummary() {
        const subtotal = this.cartManager.getSubtotal();
        const giftFee = this.cartManager.getGiftFee();
        const taxAmount = subtotal * this.taxRate;
        const total = subtotal + giftFee + taxAmount;

        document.getElementById('summary-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('summary-total').textContent = total.toFixed(2);
    }

    validateForms() {
        const shippingForm = document.getElementById('shipping-form');
        const billingForm = document.getElementById('billing-form');
        const sameAsShipping = document.getElementById('same-as-shipping').checked;
        
        const isShippingValid = shippingForm.checkValidity();
        const isBillingValid = sameAsShipping || billingForm.checkValidity();
        const hasCartItems = this.cartManager.getCartCount() > 0;
        
        const checkoutBtn = document.getElementById('stripe-checkout-btn');
        checkoutBtn.disabled = !(isShippingValid && isBillingValid && hasCartItems);
    }

    collectFormData() {
        const isGift = document.getElementById('is-gift').checked;
        const sameAsShipping = document.getElementById('same-as-shipping').checked;
        
        const shippingAddress = {
            name: document.getElementById('shipping-name').value,
            line1: document.getElementById('address-line1').value,
            line2: document.getElementById('address-line2').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zip-code').value
        };

        let billingAddress = shippingAddress;
        if (!sameAsShipping) {
            billingAddress = {
                name: document.getElementById('billing-name').value,
                line1: document.getElementById('billing-address-line1').value,
                line2: document.getElementById('billing-address-line2').value,
                city: document.getElementById('billing-city').value,
                state: document.getElementById('billing-state').value,
                zipCode: document.getElementById('billing-zip-code').value
            };
        }

        return {
            isGift,
            giftRecipient: isGift ? document.getElementById('gift-recipient-name').value : null,
            giftMessage: isGift ? document.getElementById('gift-message').value : null,
            shippingAddress,
            billingAddress,
            taxRate: this.taxRate,
            taxAmount: this.cartManager.getSubtotal() * this.taxRate
        };
    }

    async proceedToStripeCheckout() {
        try {
            const session = getSession();
            if (!session || !session.id_token) {
                alert('Please sign in to proceed with checkout');
                return;
            }

            const formData = this.collectFormData();
            const totalAmount = Math.round(this.cartManager.getTotal() * 100);
            const taxAmount = Math.round((this.cartManager.getSubtotal() * this.taxRate) * 100);

            const requestBody = {
                action: 'createCheckoutSession',
                user_email: getUserInfo()?.email,
                amount: totalAmount + taxAmount,
                cart_items: this.cartManager.getCartItems(),
                item_count: this.cartManager.getCartCount(),
                is_gift: formData.isGift,
                shipping_address: formData.shippingAddress,
                billing_address: formData.billingAddress,
                tax_amount: taxAmount,
                tax_rate: this.taxRate
            };

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const checkoutSession = await response.json();
            
            // Redirect to Stripe Checkout
            const stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
            const result = await stripe.redirectToCheckout({
                sessionId: checkoutSession.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error starting checkout: ' + error.message);
        }
    }
}
