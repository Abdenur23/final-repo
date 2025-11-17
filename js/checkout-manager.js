// js/checkout-manager.js
// Constants - Will be updated dynamically from server cart
    let PRODUCT_PRICE = 0.00;
    let SHIPPING_COST = 8.70;
    const GIFT_FEE = 12.00;
    const CA_TAX_RATE = 0.0725; // California State Sales Tax

    // Cart state
    let cartItems = [];
    let isGift = false;

    // DOM elements
    const giftCheckbox = document.getElementById('gift-checkbox');
    const shippingSection = document.getElementById('shipping-address-section');
    const shippingHighlightNote = document.getElementById('shipping-highlight-note');
    const billingSameCheckbox = document.getElementById('billing-same');
    const billingAddressForm = document.getElementById('billing-address-form');
    const billingStateSelect = document.getElementById('b-state');
    const giftFeeLine = document.getElementById('gift-fee-line');
    const taxLine = document.getElementById('tax-line');
    const orderTotalSpan = document.getElementById('order-total');
    const finalTotalBtnSpan = document.getElementById('final-total-btn');
    const salesTaxSpan = document.getElementById('sales-tax');
    const summaryGiftFeeSpan = document.getElementById('summary-gift-fee');
    const orderSummaryContainer = document.querySelector('.order-summary');

    // Mappings for copying fields
    const addressFields = ['name', 'address1', 'city', 'state', 'zip'];

    /**
     * Load cart items from server
     */
    async function loadCartFromServer() {
        try {
            const session = window.getSession();
            if (!session?.id_token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(CONFIG.SHOPPING_CART_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + session.id_token
                },
                body: JSON.stringify({ action: 'getCart' })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cart');
            }

            const data = await response.json();
            cartItems = data.cart_items || [];
            
            // Calculate total product price from cart items
            PRODUCT_PRICE = cartItems.reduce((total, item) => {
                return total + parseFloat(item.final_price || item.discounted_price || 0);
            }, 0);

            console.log('Cart loaded from server:', cartItems);
            updateOrderSummaryUI();
            calculateOrderTotal();
            
        } catch (error) {
            console.error('Failed to load cart from server:', error);
            showError('Failed to load cart items. Please try again.');
        }
    }

    /**
     * Update the order summary UI with cart items
     */
    function updateOrderSummaryUI() {
        const orderItemsContainer = orderSummaryContainer.querySelector('.order-items') || 
            document.createElement('div');
        
        if (!orderItemsContainer.classList.contains('order-items')) {
            orderItemsContainer.className = 'order-items';
            orderSummaryContainer.insertBefore(orderItemsContainer, orderSummaryContainer.firstChild);
        }

        if (cartItems.length === 0) {
            orderItemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">No items in cart</p>';
            return;
        }

        orderItemsContainer.innerHTML = cartItems.map(item => `
            <div class="summary-line">
                <span>${item.palette_name || 'Custom Design'} (${item.item_type || 'phone-case'})</span>
                <span>$${parseFloat(item.final_price || item.discounted_price || 0).toFixed(2)}</span>
            </div>
        `).join('');

        // Update item price display
        document.getElementById('item-price').textContent = PRODUCT_PRICE.toFixed(2);
    }

    /**
     * Copies shipping address values to billing address fields.
     */
    function copyShippingToBilling() {
        addressFields.forEach(field => {
            const shippingField = document.getElementById('s-' + field);
            const billingField = document.getElementById('b-' + field);
            
            if (shippingField && billingField) {
                billingField.value = shippingField.value;
            }
        });
        
        calculateOrderTotal();
    }

    /**
     * Calculates the total cost based on the gift option and billing state.
     */
    function calculateOrderTotal() {
        if (cartItems.length === 0) {
            orderTotalSpan.textContent = '0.00';
            finalTotalBtnSpan.textContent = '0.00';
            return;
        }

        let total = PRODUCT_PRICE + SHIPPING_COST;
        let taxAmount = 0.00;
        let isGift = giftCheckbox.checked;
        
        // Determine the state to use for tax calculation
        let taxState = '';
        if (billingSameCheckbox.checked) {
            const shippingStateField = document.getElementById('s-state');
            taxState = shippingStateField ? shippingStateField.value : '';
        } else {
            taxState = billingStateSelect.value;
        }

        let isBillingCA = (taxState === 'CA');

        // 1. Add Gift Fee
        if (isGift) {
            total += GIFT_FEE;
            giftFeeLine.classList.remove('hidden');
            summaryGiftFeeSpan.textContent = GIFT_FEE.toFixed(2);
        } else {
            giftFeeLine.classList.add('hidden');
        }

        // 2. Calculate Tax
        if (isBillingCA) {
            const taxableBase = PRODUCT_PRICE + (isGift ? GIFT_FEE : 0) + SHIPPING_COST;
            taxAmount = taxableBase * CA_TAX_RATE;
            total += taxAmount;

            salesTaxSpan.textContent = taxAmount.toFixed(2);
            taxLine.classList.remove('hidden');
        } else {
            taxLine.classList.add('hidden');
            taxAmount = 0.00;
        }

        // Update DOM
        orderTotalSpan.textContent = total.toFixed(2);
        finalTotalBtnSpan.textContent = total.toFixed(2);
        
        // Update pay button text
        const payButton = document.getElementById('pay-button');
        payButton.innerHTML = `Pay Now (Total: $${total.toFixed(2)})`;
    }

    /**
     * Handles gift checkbox logic
     */
    function handleGiftToggle() {
        if (giftCheckbox.checked) {
            shippingSection.classList.add('highlight');
            shippingHighlightNote.classList.remove('hidden');
        } else {
            shippingSection.classList.remove('highlight');
            shippingHighlightNote.classList.add('hidden');
        }
        calculateOrderTotal();
    }

    /**
     * Handles billing address same as shipping toggle.
     */
    function handleBillingSameToggle() {
        if (billingSameCheckbox.checked) {
            billingAddressForm.classList.add('hidden');
            copyShippingToBilling();
        } else {
            billingAddressForm.classList.remove('hidden');
            calculateOrderTotal();
        }
    }

    // Stripe integration
    let stripe;

    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    function hideError() {
        const errorDiv = document.getElementById('error-message');
        errorDiv.classList.add('hidden');
    }

    async function initializeStripe() {
        try {
            stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
            hideError();
        } catch (error) {
            showError('Failed to initialize payment system');
            console.error('Stripe initialization error:', error);
        }
    }

    function checkAuthState() {
        const payButton = document.getElementById('pay-button');
        const errorDiv = document.getElementById('error-message');
        
        if (window.isAuthenticated && window.isAuthenticated()) {
            payButton.disabled = cartItems.length === 0;
            payButton.style.opacity = cartItems.length === 0 ? '0.7' : '1';
            if (errorDiv && cartItems.length > 0) errorDiv.classList.add('hidden');
        } else {
            payButton.disabled = true;
            payButton.style.opacity = '0.7';
            if (errorDiv) {
                errorDiv.textContent = 'Please sign in to complete your purchase';
                errorDiv.classList.remove('hidden');
            }
        }
    }

    async function handlePayment() {
        hideError();
        
        if (!window.isAuthenticated || !window.isAuthenticated()) {
            showError('Please sign in to complete your purchase');
            setTimeout(() => {
                if (typeof signin === 'function') signin();
            }, 1500);
            return;
        }

        if (cartItems.length === 0) {
            showError('Your cart is empty');
            return;
        }

        const userInfo = window.getUserInfo();
        if (!userInfo || !userInfo.email) {
            showError('Unable to retrieve user information. Please sign in again.');
            return;
        }

        // Validate required fields
        const shippingName = document.getElementById('s-name').value.trim();
        const shippingAddress1 = document.getElementById('s-address1').value.trim();
        const shippingCity = document.getElementById('s-city').value.trim();
        const shippingState = document.getElementById('s-state').value;
        const shippingZip = document.getElementById('s-zip').value.trim();

        if (!shippingName || !shippingAddress1 || !shippingCity || !shippingState || !shippingZip) {
            showError('Please fill in all required shipping address fields');
            return;
        }

        // Calculate final amount in cents
        const totalAmount = parseFloat(document.getElementById('order-total').textContent);
        const amountInCents = Math.round(totalAmount * 100);

        const session = window.getSession();
        if (!session || !session.id_token) {
            showError('Authentication token not found. Please sign in again.');
            return;
        }

        try {
            const payButton = document.getElementById('pay-button');
            payButton.disabled = true;
            payButton.textContent = 'Processing...';

            // Prepare cart items for checkout
            const checkoutCartItems = cartItems.map(item => ({
                design_id: item.design_id,
                palette_name: item.palette_name,
                item_type: item.item_type || 'phone-case',
                final_price: parseFloat(item.final_price || item.discounted_price || 0),
                original_price: parseFloat(item.original_price || 0),
                image_url: item.image_url
            }));

            const requestBody = {
                action: 'createCheckoutSession',
                user_email: userInfo.email,
                amount: amountInCents,
                cart_items: checkoutCartItems,
                item_count: cartItems.length,
                is_gift: giftCheckbox.checked
            };

            console.log('Sending checkout request:', requestBody);

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session.id_token
                },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON response:', responseText);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            if (!data.id) {
                console.error('Invalid response data:', data);
                throw new Error('No session ID received from server');
            }

            console.log('Stripe session created:', data.id);

            const result = await stripe.redirectToCheckout({
                sessionId: data.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Payment error:', error);
            showError(error.message || 'Payment failed. Please try again.');
            
            const payButton = document.getElementById('pay-button');
            payButton.disabled = false;
            payButton.innerHTML = `Pay Now (Total: $${totalAmount.toFixed(2)})`;
        }
    }

    // Event Listeners
    giftCheckbox.addEventListener('change', handleGiftToggle);
    billingSameCheckbox.addEventListener('change', handleBillingSameToggle);
    billingStateSelect.addEventListener('change', calculateOrderTotal);

    addressFields.forEach(field => {
        const shippingField = document.getElementById('s-' + field);
        if (shippingField) {
            shippingField.addEventListener('input', () => {
                if (billingSameCheckbox.checked) {
                    copyShippingToBilling();
                }
            });
        }
    });

    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', async () => {
        // Set initial shipping cost
        document.getElementById('shipping-cost').textContent = SHIPPING_COST.toFixed(2);

        // Get gift option from localStorage
        const savedGiftOption = localStorage.getItem('checkoutGiftOption');
        if (savedGiftOption) {
            giftCheckbox.checked = JSON.parse(savedGiftOption);
            handleGiftToggle(); // Update UI
        }
        
        // Initialize Stripe
        await initializeStripe();
        
        // Load cart from server if authenticated
        if (window.isAuthenticated && window.isAuthenticated()) {
            await loadCartFromServer();
        }
        
        // Initial setup
        handleBillingSameToggle();
        
        // Update pay button event listener
        document.getElementById('pay-button').addEventListener('click', handlePayment);
        
        // Check auth state
        checkAuthState();
        
        // Set up continuous auth state monitoring
        setInterval(checkAuthState, 1000);
        document.addEventListener('visibilitychange', checkAuthState);
    });
