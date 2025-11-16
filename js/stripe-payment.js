// js/stripe-payment.js - ENHANCED WITH CHECKOUT FEATURES
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.giftMessage = '';
        this.shippingAddress = null;
        this.isAddressVerified = false;
        this.californiaTaxRate = 0.0825; // 8.25% CA sales tax
        this.initializeStripe();
        this.loadCartFromStorage();
        this.setupModalCloseHandlers();
        this.setupGiftCheckbox();
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('shoppingCart');
        const savedGiftOption = localStorage.getItem('isGiftOption');
        const savedGiftMessage = localStorage.getItem('giftMessage');
        
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
        if (savedGiftOption) {
            this.isGift = JSON.parse(savedGiftOption);
        }
        if (savedGiftMessage) {
            this.giftMessage = savedGiftMessage;
        }
        this.updateCartUI();
    }

    saveCartToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
        localStorage.setItem('giftMessage', this.giftMessage);
    }

    setupModalCloseHandlers() {
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('cart-modal').style.display === 'block') {
                    this.closeCartModal();
                }
                if (document.getElementById('checkout-modal').style.display === 'block') {
                    this.closeCheckoutModal();
                }
            }
        });

        // Click outside to close modals
        document.getElementById('cart-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cart-modal') {
                this.closeCartModal();
            }
        });

        document.getElementById('checkout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'checkout-modal') {
                this.closeCheckoutModal();
            }
        });
    }

    setupGiftCheckbox() {
        // Setup gift checkbox in checkout modal
        const checkoutGiftCheckbox = document.getElementById('checkout-gift-checkbox');
        if (checkoutGiftCheckbox) {
            checkoutGiftCheckbox.addEventListener('change', (e) => {
                this.isGift = e.target.checked;
                this.toggleGiftMessageSection();
                this.updateCheckoutTotals();
                this.saveCartToStorage();
            });
        }
    }

    toggleGiftMessageSection() {
        const giftMessageSection = document.getElementById('gift-message-section');
        if (giftMessageSection) {
            giftMessageSection.style.display = this.isGift ? 'block' : 'none';
        }
    }

    // Address Verification using USPS API (simplified version)
    async verifyAddress() {
        const address = this.collectShippingAddress();
        
        if (!this.validateAddressForm(address)) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Show loading state
        const verifyBtn = document.querySelector('button[onclick="window.stripePayment.verifyAddress()"]');
        const originalText = verifyBtn.textContent;
        verifyBtn.textContent = 'Verifying...';
        verifyBtn.disabled = true;

        try {
            // In a real implementation, you would call your backend which calls USPS API
            // For now, we'll simulate verification with basic validation
            const isValid = await this.simulateUSPSVerification(address);
            
            if (isValid) {
                this.isAddressVerified = true;
                this.shippingAddress = address;
                
                // Show verification success
                const verificationDiv = document.getElementById('address-verification');
                verificationDiv.style.display = 'block';
                
                // Enable payment button
                document.getElementById('pay-with-stripe-btn').disabled = false;
                
                // Update totals (for tax calculation)
                this.updateCheckoutTotals();
                
                this.showSuccess('Address verified successfully!');
            } else {
                this.showError('Address verification failed. Please check your address details.');
            }
        } catch (error) {
            console.error('Address verification error:', error);
            this.showError('Address verification service temporarily unavailable. Please proceed with caution.');
            // Allow proceeding even if verification fails
            this.isAddressVerified = true;
            this.shippingAddress = address;
            document.getElementById('pay-with-stripe-btn').disabled = false;
            this.updateCheckoutTotals();
        } finally {
            verifyBtn.textContent = originalText;
            verifyBtn.disabled = false;
        }
    }

    simulateUSPSVerification(address) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Basic validation - in real implementation, this would call USPS API
                const isValid = address.address1 && address.city && address.state && address.zipCode;
                resolve(isValid);
            }, 1500);
        });
    }

    collectShippingAddress() {
        return {
            firstName: document.getElementById('shipping-first-name').value,
            lastName: document.getElementById('shipping-last-name').value,
            address1: document.getElementById('shipping-address-1').value,
            address2: document.getElementById('shipping-address-2').value,
            city: document.getElementById('shipping-city').value,
            state: document.getElementById('shipping-state').value,
            zipCode: document.getElementById('shipping-zip').value,
            country: document.getElementById('shipping-country').value
        };
    }

    validateAddressForm(address) {
        return address.firstName && address.lastName && address.address1 && 
               address.city && address.state && address.zipCode;
    }

    calculateSalesTax(subtotal) {
        // Only calculate tax if shipping address is in California
        if (this.shippingAddress && this.shippingAddress.state === 'CA') {
            return subtotal * this.californiaTaxRate;
        }
        return 0;
    }

    updateCheckoutTotals() {
        const subtotal = this.cart.reduce((total, item) => total + item.discountedPrice, 0);
        const giftFee = this.isGift ? 12.00 : 0;
        const taxableAmount = subtotal + giftFee;
        const salesTax = this.calculateSalesTax(taxableAmount);
        const total = subtotal + giftFee + salesTax;

        // Update display elements
        const subtotalElement = document.getElementById('checkout-subtotal');
        const giftFeeElement = document.getElementById('gift-fee-checkout');
        const salesTaxElement = document.getElementById('sales-tax-line');
        const totalElement = document.getElementById('checkout-total');
        const salesTaxAmountElement = document.getElementById('sales-tax-amount');

        if (subtotalElement) subtotalElement.textContent = subtotal.toFixed(2);
        if (giftFeeElement) giftFeeElement.style.display = this.isGift ? 'flex' : 'none';
        if (totalElement) totalElement.textContent = total.toFixed(2);
        
        // Only show sales tax if it's greater than 0 (CA addresses)
        if (salesTaxElement && salesTaxAmountElement) {
            if (salesTax > 0) {
                salesTaxElement.style.display = 'flex';
                salesTaxAmountElement.textContent = salesTax.toFixed(2);
            } else {
                salesTaxElement.style.display = 'none';
            }
        }
    }

    renderCheckoutItems() {
        const container = document.getElementById('checkout-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No items in cart</p>';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="checkout-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; gap: 12px;">
                <img src="${item.imageUrl}" alt="${item.paletteName}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px; line-height: 1.3;">${item.paletteName}</div>
                    <div style="color: #666; font-size: 13px;">
                        $${item.discountedPrice.toFixed(2)}
                        ${item.discount > 0 ? `<span style="color: #28a745; font-size: 12px;">(${item.discount}% off)</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        this.updateCheckoutTotals();
    }

    async processStripePayment() {
        if (!this.isAddressVerified) {
            this.showError('Please verify your shipping address first');
            return;
        }

        if (this.cart.length === 0) {
            this.showError('Your cart is empty');
            return;
        }

        try {
            const session = getSession();
            if (!session || !session.id_token) {
                alert('Please sign in to proceed with payment');
                return;
            }

            const userInfo = getUserInfo();
            const totalAmount = Math.round(this.getCheckoutTotal() * 100);

            // Prepare checkout data
            const checkoutData = {
                action: 'createCheckoutSession',
                user_email: userInfo ? userInfo.email : null,
                amount: totalAmount,
                cart_items: this.cart,
                item_count: this.cart.length,
                is_gift: this.isGift,
                gift_message: this.giftMessage,
                shipping_address: this.shippingAddress,
                sales_tax: this.calculateSalesTax(this.getCheckoutSubtotal() + (this.isGift ? 12 : 0))
            };

            console.log('Processing checkout:', checkoutData);

            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify(checkoutData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Failed to create checkout session: ' + errorText);
            }

            const checkoutSession = await response.json();
            
            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: checkoutSession.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError('Error processing payment: ' + error.message);
        }
    }

    getCheckoutSubtotal() {
        return this.cart.reduce((total, item) => total + item.discountedPrice, 0);
    }

    getCheckoutTotal() {
        const subtotal = this.getCheckoutSubtotal();
        const giftFee = this.isGift ? 12.00 : 0;
        const taxableAmount = subtotal + giftFee;
        const salesTax = this.calculateSalesTax(taxableAmount);
        return subtotal + giftFee + salesTax;
    }

    openCheckoutModal() {
        // Reset verification state
        this.isAddressVerified = false;
        document.getElementById('pay-with-stripe-btn').disabled = true;
        document.getElementById('address-verification').style.display = 'none';
        
        // Set gift checkbox state
        const giftCheckbox = document.getElementById('checkout-gift-checkbox');
        if (giftCheckbox) {
            giftCheckbox.checked = this.isGift;
        }
        
        // Set gift message
        const giftMessageTextarea = document.getElementById('gift-message');
        if (giftMessageTextarea) {
            giftMessageTextarea.value = this.giftMessage;
        }
        
        this.toggleGiftMessageSection();
        this.renderCheckoutItems();
        document.getElementById('checkout-modal').style.display = 'block';
    }

    closeCheckoutModal() {
        // Save gift message
        const giftMessageTextarea = document.getElementById('gift-message');
        if (giftMessageTextarea) {
            this.giftMessage = giftMessageTextarea.value;
            this.saveCartToStorage();
        }
        
        document.getElementById('checkout-modal').style.display = 'none';
    }

    // Update the existing proceedToCheckout method in cart modal
    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showError('Your cart is empty');
            return;
        }
        
        this.closeCartModal();
        setTimeout(() => {
            this.openCheckoutModal();
        }, 300);
    }

    // Keep all your existing methods for cart management
    addToCart(designId, realtimeUpdates) {
        // ... keep your existing addToCart implementation
    }

    removeFromCart(designId) {
        // ... keep your existing removeFromCart implementation
    }

    updateCartUI() {
        // ... keep your existing updateCartUI implementation
    }

    showSuccess(message) {
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
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">✅ Success</div>
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
        }, 3000);
    }

    showError(message) {
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
}

// Initialize globally
window.stripePayment = new StripePayment();
