// js/stripe-payment.js
// js/stripe-payment.js
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.taxRate = 0.0825; // 8.25% CA sales tax
        this.shipping = {};
        this.billing = {};
        this.isBillingSame = true;
        this.initializeStripe();
        this.loadCartFromStorage();
        this.setupModalCloseHandlers();
        this.setupEventListeners();
    }

    initializeStripe() {
        this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('shoppingCart');
        const savedGift = localStorage.getItem('isGiftOption');
        if (savedCart) this.cart = JSON.parse(savedCart);
        if (savedGift !== null) this.isGift = JSON.parse(savedGift);
        this.updateCartUI();
    }

    saveCartToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
    }

    setupModalCloseHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('cart-modal').style.display === 'block') {
                this.closeCartModal();
            }
        });

        document.getElementById('cart-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cart-modal') this.closeCartModal();
        });
    }

    setupEventListeners() {
        // Gift checkbox
        document.getElementById('gift-checkbox')?.addEventListener('change', (e) => {
            this.isGift = e.target.checked;
            this.saveCartToStorage();
            this.updateCartTotal();
        });

        // Billing same as shipping
        document.getElementById('same-billing')?.addEventListener('change', (e) => {
            this.isBillingSame = e.target.checked;
            document.getElementById('billing-fields').style.display = this.isBillingSame ? 'none' : 'block';
            this.updateTax();
        });

        // Real-time tax update on billing state change
        document.getElementById('billing-state')?.addEventListener('change', () => this.updateTax());
        document.getElementById('shipping-state')?.addEventListener('change', () => {
            if (this.isBillingSame) this.updateTax();
        });
    }

    addToCart(designId, realtimeUpdates) {
        if (this.isInCart(designId)) {
            this.showError('This design is already in your cart');
            return;
        }

        const design = realtimeUpdates.progressTracker.getCompletedDesign(designId);
        if (!design) return;

        const discount = realtimeUpdates.promoManager.getActiveDiscount();
        const price = CONFIG.PRODUCT_PRICE * (1 - discount / 100);

        this.cart.push({
            designId, designData: design, originalPrice: CONFIG.PRODUCT_PRICE,
            discountedPrice: price, discount, paletteName: design.paletteName || 'Custom',
            imageUrl: design.imageUrls?.[0], addedAt: new Date().toISOString()
        });

        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons();
        this.showAddToCartConfirmation(this.cart[this.cart.length - 1]);
    }

    isInCart(designId) { return this.cart.some(i => i.designId === designId); }

    showAddToCartConfirmation(item) {
        const notif = document.createElement('div');
        notif.style.cssText = `position:fixed;top:20px;right:20px;background:#28a745;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;max-width:300px;cursor:pointer;`;
        notif.innerHTML = `<div style="font-weight:bold;">✅ Added to Cart</div><div style="font-size:14px;">${item.paletteName}</div><div style="font-size:12px;">$${item.discountedPrice.toFixed(2)}</div>`;
        notif.onclick = () => { this.openCartModal(); notif.remove(); };
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    updateCartUI() {
        const count = document.getElementById('cart-count');
        if (count) count.style.display = this.cart.length > 0 ? 'flex' : 'none', count.textContent = this.cart.length;
    }

    updateProductCardButtons() {
        document.querySelectorAll('.product-card').forEach(card => {
            const id = card.id.replace('design-', '');
            const btn = card.querySelector('.add-to-cart-btn');
            if (!btn) return;
            const inCart = this.isInCart(id);
            btn.textContent = inCart ? '✓ Added' : 'Add to Cart';
            btn.style.background = inCart ? '#6c757d' : '#28a745';
            btn.disabled = inCart;
        });
    }

    removeFromCart(designId) {
        this.cart = this.cart.filter(i => i.designId !== designId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons();
        this.renderCartItems();
    }

    getSubtotal() {
        return this.cart.reduce((sum, item) => sum + item.discountedPrice, 0);
    }

    getTax() {
        const state = this.isBillingSame
            ? document.getElementById('shipping-state').value
            : document.getElementById('billing-state').value;
        return state === 'CA' ? this.getSubtotal() * this.taxRate : 0;
    }

    getCartTotal() {
        return this.getSubtotal() + (this.isGift ? 12 : 0) + this.getTax();
    }

    updateTax() {
        const tax = this.getTax();
        const taxLine = document.getElementById('tax-line');
        const taxAmount = document.getElementById('tax-amount');
        if (taxLine && taxAmount) {
            const show = tax > 0;
            taxLine.style.display = show ? 'flex' : 'none';
            taxAmount.textContent = tax.toFixed(2);
        }
        this.updateCartTotal();
    }

    updateCartTotal() {
        const subtotal = this.getSubtotal();
        const tax = this.getTax();
        const total = this.getCartTotal();

        document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('gift-fee-line').style.display = this.isGift ? 'flex' : 'none';
        document.getElementById('tax-line').style.display = tax > 0 ? 'flex' : 'none';
        document.getElementById('tax-amount').textContent = tax.toFixed(2);
        document.getElementById('cart-total').textContent = total.toFixed(2);
        document.getElementById('final-total').textContent = total.toFixed(2);
    }

    showCheckoutForm() {
        document.getElementById('modal-title').textContent = 'Checkout';
        document.getElementById('cart-items-container').style.display = 'none';
        document.getElementById('checkout-form').style.display = 'block';
        document.getElementById('cart-actions').style.display = 'none';
        document.getElementById('checkout-actions').style.display = 'block';
        this.updateTax();
    }

    goBackToCart() {
        document.getElementById('modal-title').textContent = '🛒 Shopping Cart';
        document.getElementById('cart-items-container').style.display = 'block';
        document.getElementById('checkout-form').style.display = 'none';
        document.getElementById('cart-actions').style.display = 'block';
        document.getElementById('checkout-actions').style.display = 'none';
        this.renderCartItems();
    }

    validateForm() {
        const req = (id) => document.getElementById(id).value.trim();
        const shipping = ['name', 'address1', 'city', 'state', 'zip'].every(f => req(`shipping-${f}`));
        if (!this.isBillingSame) {
            const billing = ['name', 'address1', 'city', 'state', 'zip'].every(f => req(`billing-${f}`));
            return shipping && billing;
        }
        return shipping;
    }

    collectAddresses() {
        const get = (prefix) => ({
            name: document.getElementById(`${prefix}-name`).value,
            line1: document.getElementById(`${prefix}-address1`).value,
            line2: document.getElementById(`${prefix}-address2`).value || '',
            city: document.getElementById(`${prefix}-city`).value,
            state: document.getElementById(`${prefix}-state`).value,
            postal_code: document.getElementById(`${prefix}-zip`).value,
            country: 'US'
        });

        this.shipping = get('shipping');
        this.billing = this.isBillingSame ? this.shipping : get('billing');
    }

    async finalizeCheckout() {
        if (!this.validateForm()) {
            this.showError('Please fill in all required fields');
            return;
        }

        this.collectAddresses();
        const totalCents = Math.round(this.getCartTotal() * 100);

        try {
            const session = getSession();
            if (!session?.id_token) throw new Error('Please sign in');

            const userInfo = getUserInfo();
            const response = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    user_email: userInfo?.email,
                    amount: totalCents,
                    cart_items: this.cart,
                    item_count: this.cart.length,
                    is_gift: this.isGift,
                    shipping_address: this.shipping,
                    billing_address: this.billing,
                    tax_amount: Math.round(this.getTax() * 100)
                })
            });

            if (!response.ok) throw new Error(await response.text());
            const { id } = await response.json();

            const result = await this.stripe.redirectToCheckout({ sessionId: id });
            if (result.error) throw result.error;

        } catch (err) {
            console.error(err);
            this.showError('Checkout failed: ' + err.message);
        }
    }

    openCartModal() {
        this.renderCartItems();
        document.getElementById('cart-modal').style.display = 'block';
        document.getElementById('same-billing').checked = true;
        document.getElementById('billing-fields').style.display = 'none';
        this.isBillingSame = true;
        this.updateTax();
    }

    closeCartModal() {
        document.getElementById('cart-modal').style.display = 'none';
        this.goBackToCart(); // Reset to cart view
    }

    renderCartItems() {
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">Your cart is empty</p>';
            this.updateCartTotal();
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div style="display:flex;align-items:center;padding:16px;border-bottom:1px solid #eee;gap:12px;">
                <img src="${item.imageUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
                <div style="flex:1;">
                    <div style="font-weight:bold;font-size:14px;">${item.paletteName}</div>
                    <div style="color:#666;font-size:13px;">$${item.discountedPrice.toFixed(2)}</div>
                </div>
                <button onclick="window.stripePayment.removeFromCart('${item.designId}')"
                        style="background:#dc3545;color:white;border:none;padding:6px 10px;border-radius:4px;font-size:11px;">
                    Remove
                </button>
            </div>
        `).join('');

        this.updateCartTotal();
        document.getElementById('gift-checkbox').checked = this.isGift;
    }

    showError(msg) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;top:20px;right:20px;background:#dc3545;color:white;padding:12px 20px;border-radius:8px;z-index:10000;max-width:300px;`;
        el.innerHTML = `<div style="font-weight:bold;">❌ Error</div><div style="font-size:14px;">${msg}</div>`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

window.stripePayment = new StripePayment();

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);
