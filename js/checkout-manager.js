class CheckoutManager {
    constructor() {
        this.cart = this.loadCartData();
        this.isGift = this.loadGiftOption();
        this.salesTaxRate = 0.0825; // Example CA State Tax Rate for demonstration
        this.shippingAddress = {};
        this.billingAddress = {};
        this.isVerified = false;

        if (this.cart.length === 0) {
            alert("Your cart is empty. Redirecting to home.");
            window.location.href = 'case.html'; // Go back if cart is empty
            return;
        }

        this.setupEventListeners();
        this.renderSummary();
        this.handleGiftOptionUI();
    }

    // --- Data Loading ---
    loadCartData() {
        try {
            const savedCart = localStorage.getItem('shoppingCart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            console.error("Failed to load cart data:", e);
            return [];
        }
    }

    loadGiftOption() {
        const savedGiftOption = localStorage.getItem('isGiftOption');
        return savedGiftOption ? JSON.parse(savedGiftOption) : false;
    }

    // --- UI Setup & Event Listeners ---
    setupEventListeners() {
        // Address verification (Simulated USPS/Professional)
        document.getElementById('verify-address-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.captureShippingAddress();
            this.simulateAddressVerification(this.shippingAddress);
        });

        // Billing/Shipping coordination
        document.getElementById('match-addresses-checkbox').addEventListener('change', (e) => {
            this.toggleBillingAddressSection(e.target.checked);
            // Re-render summary on change, in case it affects tax state (if logic were more complex)
            this.renderSummary(); 
        });

        // Checkout button
        document.getElementById('checkout-button').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCheckoutClick();
        });

        // Update button status on any input change (for address verification)
        const shippingInputs = document.querySelectorAll('#shipping-form input');
        shippingInputs.forEach(input => input.addEventListener('input', () => this.resetVerification()));
        
        // Initial setup for the checkbox to copy to billing
        this.toggleBillingAddressSection(true);
    }

    handleGiftOptionUI() {
        const titleElement = document.getElementById('shipping-address-title');
        const sectionElement = document.getElementById('shipping-address-section');
        
        if (this.isGift) {
            // 2. Highlight gift recipient address
            titleElement.textContent = '🎁 Gift Recipient Address (Shipping)';
            sectionElement.classList.add('gift-highlight');
        } else {
            titleElement.textContent = '📦 Shipping Address';
            sectionElement.classList.remove('gift-highlight');
        }
    }
    
    toggleBillingAddressSection(matchChecked) {
        const billingSection = document.getElementById('billing-address-section');
        if (matchChecked) {
            billingSection.style.display = 'none';
        } else {
            billingSection.style.display = 'block';
        }
    }

    // --- Address Handling ---

    captureShippingAddress() {
        const form = document.getElementById('shipping-form');
        this.shippingAddress = {
            name: form.elements['name'].value,
            line1: form.elements['line1'].value,
            line2: form.elements['line2'].value,
            city: form.elements['city'].value,
            state: form.elements['state'].value.toUpperCase(),
            zip: form.elements['zip'].value
        };
    }

    captureBillingAddress() {
        const matchChecked = document.getElementById('match-addresses-checkbox').checked;
        
        if (matchChecked) {
            // 3. Professional coordination: Use shipping as billing
            this.billingAddress = {...this.shippingAddress}; 
        } else {
            // Use separate billing form data
            const form = document.getElementById('billing-form');
            this.billingAddress = {
                name: form.elements['name'].value,
                line1: form.elements['line1'].value,
                line2: form.elements['line2'].value,
                city: form.elements['city'].value,
                state: form.elements['state'].value.toUpperCase(),
                zip: form.elements['zip'].value
            };
        }
    }

    resetVerification() {
        this.isVerified = false;
        document.getElementById('address-verification-feedback').style.display = 'none';
        document.getElementById('checkout-button').disabled = true;
    }

    // 1. Simulated Address Verification
    simulateAddressVerification(address) {
        const feedback = document.getElementById('address-verification-feedback');
        feedback.classList.remove('success', 'error');
        
        // Simple logic: assume verification success if main fields are not empty
        const isValid = address.line1 && address.city && address.state && address.zip;

        if (isValid) {
            // In a real app, this would be a USPS API call. 
            // It would also normalize the address, which you could update in the form fields.
            this.isVerified = true;
            feedback.textContent = `Address Verified: ${address.line1}, ${address.city}, ${address.state} ${address.zip}`;
            feedback.classList.add('success');
            feedback.style.display = 'block';
            document.getElementById('checkout-button').disabled = false;
            this.renderSummary(); // Re-render to calculate tax after verification
        } else {
            this.isVerified = false;
            feedback.textContent = 'Error: Please fill out all required shipping address fields (Line 1, City, State, ZIP) and try again.';
            feedback.classList.add('error');
            feedback.style.display = 'block';
            document.getElementById('checkout-button').disabled = true;
        }
    }

    // --- Calculation & Summary ---
    getCalculatedTotals() {
        const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
        const giftFee = this.isGift ? 12.00 : 0.00;
        
        let salesTax = 0.00;
        // 4. Calculate state sales tax ONLY if shipping address is in California (CA)
        if (this.isVerified && this.shippingAddress.state === 'CA') {
            salesTax = (subtotal + giftFee) * this.salesTaxRate;
        }

        const orderTotal = subtotal + giftFee + salesTax;

        return { subtotal, giftFee, salesTax, orderTotal };
    }

    renderSummary() {
        const { subtotal, giftFee, salesTax, orderTotal } = this.getCalculatedTotals();

        document.getElementById('summary-subtotal').textContent = subtotal.toFixed(2);
        
        const giftLine = document.getElementById('summary-gift-line');
        giftLine.style.display = giftFee > 0 ? 'flex' : 'none';
        document.getElementById('summary-gift-fee').textContent = giftFee.toFixed(2);
        
        const taxLine = document.getElementById('summary-tax-line');
        // 4. Sales Tax logic: ONLY display if salesTax > 0 (i.e., in CA)
        if (salesTax > 0.001) { // Check against a small number for floating point safety
            taxLine.style.display = 'flex';
            document.getElementById('summary-tax').textContent = salesTax.toFixed(2);
            document.getElementById('tax-rate-display').textContent = `${(this.salesTaxRate * 100).toFixed(2)}%`;
        } else {
            taxLine.style.display = 'none';
        }

        document.getElementById('summary-total').textContent = orderTotal.toFixed(2);
    }

    // --- Final Checkout ---

    async handleCheckoutClick() {
        if (!this.isVerified) {
            alert("Please verify the shipping address before proceeding.");
            return;
        }

        this.captureBillingAddress(); // Make sure billing is captured before sending

        try {
            // Get necessary data from the environment (assuming these global functions exist)
            const session = window.getSession ? window.getSession() : null;
            const userInfo = window.getUserInfo ? window.getUserInfo() : null;
            
            if (!session || !session.id_token) {
                alert('Authentication session not found. Please sign in again.');
                return;
            }

            const totals = this.getCalculatedTotals();
            const totalAmountCents = Math.round(totals.orderTotal * 100);
            
            // Prepare the full request body for the API
            const requestBody = {
                action: 'createCheckoutSession',
                user_email: userInfo ? userInfo.email : null,
                amount: totalAmountCents, // Total amount including tax and gift
                cart_items: this.cart,
                item_count: this.cart.length,
                is_gift: this.isGift,
                
                // NEW: Address and Tax Data
                shipping_address: this.shippingAddress,
                billing_address: this.billingAddress,
                sales_tax: Math.round(totals.salesTax * 100), // Send tax collected
            };

            document.getElementById('checkout-button').textContent = 'Processing...';
            document.getElementById('checkout-button').disabled = true;

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Failed to create checkout session: ' + errorText);
            }

            const checkoutSession = await response.json();
            
            // === START: CRITICAL FIX FOR "window.stripePayment is undefined" ===
            
            // 1. Check if the global StripePayment object is initialized
            if (!window.stripePayment || !window.stripePayment.stripe) {
                throw new Error("Stripe payment object is unavailable for redirection. Check script loading order.");
            }

            // 2. Redirect to Stripe to complete payment
            const result = await window.stripePayment.stripe.redirectToCheckout({
                sessionId: checkoutSession.id
            });

            // 3. Handle Stripe's own error object if redirection fails for other reasons
            if (result && result.error) {
                throw new Error(result.error.message);
            }

            // === END: CRITICAL FIX ===
            
        } catch (error) {
            console.error('Final Checkout error:', error);
            alert('Error starting payment: ' + error.message);
            document.getElementById('checkout-button').textContent = 'Proceed to Stripe Payment';
            document.getElementById('checkout-button').disabled = false;
        }
    }
}
