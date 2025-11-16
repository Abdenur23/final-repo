// js/stripe-payment.js
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.TAX_RATE_CA = 0.0875;          // 8.75 % – adjust if needed
        this.initializeStripe();
        this.loadCartFromStorage();
        this.setupModalCloseHandlers();
        this.setupAddressHandlers();
    }

    /* ------------------------------------------------------------------ */
    /*  Stripe & storage                                                  */
    /* ------------------------------------------------------------------ */
    initializeStripe() { this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY); }
    loadCartFromStorage() {
        const saved = localStorage.getItem('shoppingCart');
        const gift  = localStorage.getItem('isGiftOption');
        if (saved) this.cart = JSON.parse(saved);
        if (gift)  this.isGift = JSON.parse(gift);
        this.updateCartUI();
    }
    saveCartToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
    }

    /* ------------------------------------------------------------------ */
    /*  Modal open / close                                                */
    /* ------------------------------------------------------------------ */
    setupModalCloseHandlers() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && document.getElementById('cart-modal').style.display === 'block')
                this.closeCartModal();
        });
        document.getElementById('cart-modal').addEventListener('click', e => {
            if (e.target.id === 'cart-modal') this.closeCartModal();
        });
    }
    openCartModal() {
        this.renderCartItems();
        this.resetAddressForm();                 // <-- NEW
        document.getElementById('cart-modal').style.display = 'block';
        this.initializeGiftCheckbox();
    }
    closeCartModal() { document.getElementById('cart-modal').style.display = 'none'; }

    /* ------------------------------------------------------------------ */
    /*  Gift checkbox (unchanged but kept for completeness)               */
    /* ------------------------------------------------------------------ */
    initializeGiftCheckbox() {
        const check = () => {
            const cb = document.getElementById('gift-checkbox');
            if (cb) {
                cb.checked = this.isGift;
                cb.onchange = () => {
                    this.isGift = cb.checked;
                    this.saveCartToStorage();
                    this.updateTotals();
                };
            } else setTimeout(check, 80);
        };
        check();
    }

    /* ------------------------------------------------------------------ */
    /*  ADDRESS FORM HANDLERS                                             */
    /* ------------------------------------------------------------------ */
    setupAddressHandlers() {
        // “same as shipping” toggle
        const sameCb = document.getElementById('same-billing');
        const billSec = document.getElementById('billing-section');
        sameCb && sameCb.addEventListener('change', () => {
            billSec.style.display = sameCb.checked ? 'none' : 'block';
            if (sameCb.checked) this.copyShippingToBilling();
        });
    }
    resetAddressForm() {
        // clear fields
        const ids = ['ship-name','ship-phone','ship-line1','ship-line2','ship-city',
                     'ship-state','ship-zip','ship-country',
                     'bill-name','bill-phone','bill-line1','bill-line2','bill-city',
                     'bill-state','bill-zip','bill-country'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

        document.getElementById('same-billing').checked = true;
        document.getElementById('billing-section').style.display = 'none';
    }
    copyShippingToBilling() {
        const map = {
            name:  ['ship-name','bill-name'],
            phone: ['ship-phone','bill-phone'],
            line1: ['ship-line1','bill-line1'],
            line2: ['ship-line2','bill-line2'],
            city:  ['ship-city','bill-city'],
            state: ['ship-state','bill-state'],
            zip:   ['ship-zip','bill-zip'],
            country:['ship-country','bill-country']
        };
        Object.values(map).forEach(([src, dst]) => {
            const s = document.getElementById(src);
            const d = document.getElementById(dst);
            if (s && d) d.value = s.value;
        });
    }

    /* ------------------------------------------------------------------ */
    /*  CART UI (items, totals, tax)                                      */
    /* ------------------------------------------------------------------ */
    renderCartItems() {
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        if (!this.cart.length) {
            container.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">Your cart is empty</p>';
            this.updateTotals();
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item" style="display:flex;align-items:center;padding:16px;border-bottom:1px solid #eee;gap:12px;">
                <img src="${item.imageUrl}" alt="${item.paletteName}"
                     style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:14px;line-height:1.3;">${item.paletteName}</div>
                    <div style="color:#666;font-size:13px;">
                        $${item.discountedPrice.toFixed(2)}
                        ${item.discount>0?`<span style="color:#28a745;font-size:12px;">(${item.discount}% off)</span>`:''}
                    </div>
                </div>
                <button onclick="window.stripePayment.removeFromCart('${item.designId}')"
                        style="background:#dc3545;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:11px;flex-shrink:0;">
                    Remove
                </button>
            </div>`).join('');

        this.updateTotals();
    }
    updateTotals() {
        const subtotal = this.cart.reduce((s, i) => s + i.discountedPrice, 0);
        const giftFee  = this.isGift ? 12 : 0;

        // ---- TAX ----
        const shipState = (document.getElementById('ship-state')?.value || '').trim().toUpperCase();
        const taxRate  = (shipState === 'CA' || shipState === 'CALIFORNIA') ? this.TAX_RATE_CA : 0;
        const taxAmt   = subtotal * taxRate;

        const total = subtotal + giftFee + taxAmt;

        // UI
        document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('gift-fee').textContent     = giftFee.toFixed(2);
        document.getElementById('gift-fee-line').style.display = this.isGift ? 'flex' : 'none';

        const taxLine = document.getElementById('tax-line');
        const taxAmtEl = document.getElementById('tax-amount');
        if (taxRate > 0) {
            taxLine.style.display = 'flex';
            taxAmtEl.textContent = taxAmt.toFixed(2);
        } else {
            taxLine.style.display = 'none';
        }

        document.getElementById('cart-total').textContent = total.toFixed(2);
    }

    /* ------------------------------------------------------------------ */
    /*  Checkout – collect addresses, calculate final amount, hit Lambda */
    /* ------------------------------------------------------------------ */
    async proceedToCheckout() {
        if (!this.cart.length) { this.showError('Cart is empty'); return; }

        // ---- 1. Validate addresses ----
        if (!this.validateAddress('ship')) { this.showError('Please fill all required shipping fields'); return; }
        const sameBilling = document.getElementById('same-billing').checked;
        if (!sameBilling && !this.validateAddress('bill')) { this.showError('Please fill all required billing fields'); return; }

        // ---- 2. Build address objects ----
        const shipping = this.collectAddress('ship');
        const billing  = sameBilling ? shipping : this.collectAddress('bill');

        // ---- 3. Recalculate final amount (tax already in UI) ----
        const finalCents = Math.round(this.getCartTotal() * 100);   // includes tax

        // ---- 4. Prepare payload for Lambda ----
        const session = getSession();
        if (!session?.id_token) { alert('Please sign in'); return; }

        const userInfo = getUserInfo() || {};
        const payload = {
            action: 'createCheckoutSession',
            user_email: userInfo.email || null,
            amount: finalCents,
            cart_items: this.cart,
            item_count: this.cart.length,
            is_gift: this.isGift,
            shipping_address: shipping,
            billing_address: billing
        };

        try {
            const resp = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error(await resp.text());

            const { id } = await resp.json();
            const result = await this.stripe.redirectToCheckout({ sessionId: id });
            if (result.error) throw result.error;
        } catch (e) {
            console.error(e);
            this.showError('Checkout error: ' + e.message);
        }
    }

    validateAddress(prefix) {
        const required = [`${prefix}-name`, `${prefix}-phone`, `${prefix}-line1`,
                          `${prefix}-city`, `${prefix}-state`, `${prefix}-zip`];
        return required.every(id => {
            const el = document.getElementById(id);
            return el && el.value.trim() !== '';
        });
    }
    collectAddress(prefix) {
        return {
            name:  document.getElementById(`${prefix}-name`).value.trim(),
            phone: document.getElementById(`${prefix}-phone`).value.trim(),
            line1: document.getElementById(`${prefix}-line1`).value.trim(),
            line2: document.getElementById(`${prefix}-line2`).value.trim(),
            city:  document.getElementById(`${prefix}-city`).value.trim(),
            state: document.getElementById(`${prefix}-state`).value.trim(),
            zip:   document.getElementById(`${prefix}-zip`).value.trim(),
            country: document.getElementById(`${prefix}-country`).value.trim()
        };
    }
    getCartTotal() {
        const subtotal = this.cart.reduce((s, i) => s + i.discountedPrice, 0);
        const gift = this.isGift ? 12 : 0;
        const shipState = (document.getElementById('ship-state')?.value || '').trim().toUpperCase();
        const taxRate = (shipState === 'CA' || shipState === 'CALIFORNIA') ? this.TAX_RATE_CA : 0;
        const tax = subtotal * taxRate;
        return subtotal + gift + tax;
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers (add/remove, UI updates, notifications)                  */
    /* ------------------------------------------------------------------ */
    addToCart(designId, realtimeUpdates) { /* unchanged – omitted for brevity */ }
    isInCart(designId) { return this.cart.some(i => i.designId === designId); }
    removeFromCart(designId) {
        this.cart = this.cart.filter(i => i.designId !== designId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.renderCartItems();
    }
    updateCartUI() {
        const el = document.getElementById('cart-count');
        if (el) { el.textContent = this.cart.length; el.style.display = this.cart.length ? 'flex' : 'none'; }
    }
    showError(msg) {
        const n = document.createElement('div');
        n.style.cssText = `position:fixed;top:20px;right:20px;background:#dc3545;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10000;`;
        n.innerHTML = `<strong>Error</strong><div style="font-size:14px;margin-top:4px;">${msg}</div>`;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 4500);
    }
}

/* --------------------------------------------------------------- */
window.stripePayment = new StripePayment();

/* animation keyframes (unchanged) */
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideOut {from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
`;
document.head.appendChild(style);
