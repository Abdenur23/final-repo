// checkout-manager.js
class CheckoutManager {
    constructor(cartManager, promoManager) {
        this.cartManager = cartManager;
        this.promoManager = promoManager;
        this.giftWrappingPrice = 20.00;
        this.loadGiftWrappingState();
    }

    loadGiftWrappingState() {
        // Ensure gift wrapping state is loaded from cart manager
        this.cartManager.loadSavedCart();
    }

    toggleGiftWrapping(enabled) {
        this.cartManager.toggleGiftWrapping(enabled);
        this.updateCheckoutDisplay();
    }

    getCheckoutSummary() {
        const cartTotal = this.cartManager.getCartTotal();
        const discounts = this.promoManager.calculateCartDiscounts(cartTotal);
        
        return {
            items: this.cartManager.getCart(),
            subtotal: cartTotal.subtotal,
            giftWrapping: {
                enabled: this.cartManager.giftWrappingEnabled,
                price: this.giftWrappingPrice
            },
            discounts: discounts,
            finalTotal: discounts.finalTotal
        };
    }

    updateCheckoutDisplay() {
        const summary = this.getCheckoutSummary();
        
        // Update cart modal display
        this.updateCartModal(summary);
        
        // Update any other checkout displays
        if (window.app && window.app.uiManager) {
            window.app.uiManager.updateCartDisplay();
        }
    }

    updateCartModal(summary) {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartSummaryContainer = document.getElementById('cart-summary');
        
        if (cartItemsContainer) {
            this.renderCartItems(cartItemsContainer, summary.items);
        }
        
        if (cartSummaryContainer) {
            this.renderCartSummary(cartSummaryContainer, summary);
        }
    }

    renderCartItems(container, items) {
        if (items.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="cart-item flex items-center space-x-4 py-4 border-b border-gray-200">
                <div class="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <img src="${item.thumbnail}" 
                         alt="${item.name}"
                         class="w-full h-full object-cover"
                         onerror="this.src='/images/placeholder.jpg'">
                </div>
                <div class="flex-grow">
                    <h4 class="font-semibold text-gray-800">${item.name}</h4>
                    <p class="text-sm text-gray-600">For: ${item.device || 'Unknown Device'}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-800">$${this.promoManager.calculateDiscountedPrice(item.price).toFixed(2)}</p>
                    ${this.promoManager.hasActivePromo() ? `
                        <p class="text-sm text-gray-500 line-through">$${item.price.toFixed(2)}</p>
                    ` : ''}
                    <button onclick="window.app.cartManager.removeFromCart('${item.designId}')" 
                            class="text-red-500 hover:text-red-700 text-sm mt-1">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCartSummary(container, summary) {
        const hasDiscount = this.promoManager.hasActivePromo();
        const promoInfo = this.promoManager.getActivePromoInfo();

        container.innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between text-sm">
                    <span>Subtotal (${summary.items.length} items)</span>
                    <span>$${summary.subtotal.toFixed(2)}</span>
                </div>
                
                ${hasDiscount ? `
                    <div class="flex justify-between text-sm text-green-700">
                        <span>Promo Discount (${promoInfo.code} - ${promoInfo.discount}%)</span>
                        <span>-$${summary.discounts.productDiscount.toFixed(2)}</span>
                    </div>
                ` : ''}
                
                <div class="gift-wrapping-section border-t border-gray-200 pt-3">
                    <label class="flex items-center justify-between cursor-pointer">
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" 
                                   ${summary.giftWrapping.enabled ? 'checked' : ''}
                                   onchange="window.app.checkoutManager.toggleGiftWrapping(this.checked)"
                                   class="rounded border-gray-300 text-magenta focus:ring-magenta">
                            <div>
                                <span class="font-medium text-gray-800">Gift Wrapping</span>
                                <p class="text-sm text-gray-600">Perfect for gifts! We'll wrap and ship directly to recipient.</p>
                            </div>
                        </div>
                        <span class="text-gray-800 font-medium">+$${this.giftWrappingPrice.toFixed(2)}</span>
                    </label>
                </div>
                
                ${summary.giftWrapping.enabled && hasDiscount ? `
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>Note: Promo codes don't apply to gift wrapping</span>
                    </div>
                ` : ''}
                
                <div class="border-t border-gray-200 pt-3">
                    <div class="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span class="gold-highlight">$${summary.finalTotal.toFixed(2)}</span>
                    </div>
                    ${hasDiscount ? `
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                            <span>You save: $${summary.discounts.totalDiscount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="promo-section pt-3">
                    ${this.renderPromoSection()}
                </div>
                
                <button onclick="window.app.uiManager.showCheckout()" 
                        class="w-full cta-magenta py-3 rounded-lg font-semibold text-white mt-4">
                    Proceed to Checkout
                </button>
            </div>
        `;
    }

    renderPromoSection() {
        const hasActivePromo = this.promoManager.hasActivePromo();
        const promoInfo = this.promoManager.getActivePromoInfo();

        if (hasActivePromo) {
            return `
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-green-800 font-medium">Active Promo: ${promoInfo.code}</span>
                            <p class="text-green-700 text-sm">${promoInfo.discount}% discount applied to products</p>
                        </div>
                        <button onclick="window.app.promoManager.removePromoCode()" 
                                class="text-red-500 hover:text-red-700 text-sm">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="promo-input-container">
                <label class="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
                <div class="flex space-x-2">
                    <input type="text" 
                           id="promoCodeInput"
                           placeholder="Enter promo code"
                           class="flex-grow input-style">
                    <button onclick="window.app.promoManager.applyPromoCode(document.getElementById('promoCodeInput').value)"
                            class="cta-gold px-4 py-2 rounded-md font-semibold whitespace-nowrap">
                        Apply
                    </button>
                </div>
                <div id="promo-message" class="mt-2 text-sm"></div>
            </div>
        `;
    }
}
