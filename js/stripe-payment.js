// js/stripe-payment.js
class StripePayment {
    constructor() {
        this.stripe = null;
        this.cart = [];
        this.isGift = false;
        this.TAX_RATE_CA = 0.0875;               // 8.75 % – change if needed
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
        this.updateProductCardButtons();          // <-- restore button state on load
    }
    saveCartToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
    }

    /* ------------------------------------------------------------------ */
    /*  ADD TO CART – **RESTORED**                                        */
    /* ------------------------------------------------------------------ */
    addToCart(designId, realtimeUpdates) {
        // Prevent duplicates
        if (this.isInCart(designId)) {
            this.showError('This design is already in your cart');
            return;
        }

        const design = realtimeUpdates.progressTracker.getCompletedDesign(designId);
        if (!design) {
            console.error('Design not found:', designId);
            return;
        }

        const currentDiscount = realtimeUpdates.promoManager.getActiveDiscount();
        const originalPrice   = CONFIG.PRODUCT_PRICE;
        const discountedPrice = originalPrice * (1 - currentDiscount / 100);

        const cartItem = {
            designId: designId,
            designData: design,
            originalPrice: originalPrice,
            discountedPrice: discountedPrice,
            discount: currentDiscount,
            paletteName: design.paletteName || 'Custom Design',
            imageUrl: design.imageUrls ? design.imageUrls[0] : null,
            addedAt: new Date().toISOString()
        };

        this.cart.push(cartItem);
        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons();          // <-- update all buttons
        this.showAddToCartConfirmation(cartItem);
    }

    isInCart(designId) { return this.cart.some(i => i.designId === designId); }

    showAddToCartConfirmation(item) {
        const n = document.createElement('div');
        n.style.cssText = `
            position:fixed;top:20px;right:20px;background:#28a745;color:white;
            padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);
            z-index:10000;animation:slideIn .3s ease;max-width:300px;cursor:pointer;
        `;
        n.innerHTML = `
            <div style="font-weight:bold;margin-bottom:4px;">Added to Cart</div>
            <div style="font-size:14px;">${item.paletteName}</div>
            <div style="font-size:12px;opacity:.9;">$${item.discountedPrice.toFixed(2)}</div>
            <div style="font-size:11px;opacity:.7;margin-top:4px;">Click to view cart</div>
        `;
        n.onclick = () => { this.openCartModal(); n.remove(); };
        document.body.appendChild(n);
        setTimeout(() => {
            n.style.animation = 'slideOut .3s ease';
            setTimeout(() => n.remove(), 300);
        }, 3000);
    }

    /* ------------------------------------------------------------------ */
    /*  PRODUCT CARD BUTTON STATE (Added to Cart / Add to Cart)          */
    /* ------------------------------------------------------------------ */
    updateProductCardButtons() {
        document.querySelectorAll('.product-card').forEach(card => {
            const designId = card.id.replace('design-', '');
            const btn = card.querySelector('.add-to-cart-btn');
            if (!btn) return;

            if (this.isInCart(designId)) {
                btn.textContent = 'Added to Cart';
                btn.style.background = '#6c757d';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
            } else {
                btn.textContent = 'Add to Cart';
                btn.style.background = '#28a745';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            }
        });
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
        this.resetAddressForm();
        document.getElementById('cart-modal').style.display = 'block';
        this.initializeGiftCheckbox();
    }
    closeCartModal() { document.getElementById('cart-modal').style.display = 'none'; }

    /* ------------------------------------------------------------------ */
    /*  Gift checkbox                                                     */
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
    /*  ADDRESS FORM (unchanged from previous answer)                     */
    /* ------------------------------------------------------------------ */
    setupAddressHandlers() {
        const sameCb = document.getElementById('same-billing');
        const billSec = document.getElementById('billing-section');
        sameCb && sameCb.addEventListener('change', () => {
            billSec.style.display = sameCb.checked ? 'none' : 'block';
            if (sameCb.checked) this.copyShippingToBilling();
            this.updateTotals();               // tax may change when state changes
        });

        // Re-calc tax whenever shipping state changes
        const shipState = document.getElementById('ship-state');
        shipState && shipState.addEventListener('input', () => this.updateTotals());
    }
    resetAddressForm() {
        const ids = ['ship-name','ship-phone','ship-line1','ship-line2','ship-city',
                     'ship-state','ship-zip','ship-country',
                     'bill-name','bill-phone','bill-line1','bill-line2','bill-city',
                     'bill-state','bill-zip','bill-country'];
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        document.getElementById('same-billing').checked = true;
        document.getElementById('billing-section').style.display = 'none';
    }
    copyShippingToBilling() {
        const map = {name:['ship-name','bill-name'],phone:['ship-phone','bill-phone'],
                     line1:['ship-line1','bill-line1'],line2:['ship-line2','bill-line2'],
                     city:['ship-city','bill-city'],state:['ship-state','bill-state'],
                     zip:['ship-zip','bill-zip'],country:['ship-country','bill-country']};
        Object.values(map).forEach(([s,d]) => {
            const src = document.getElementById(s), dst = document.getElementById(d);
            if (src && dst) dst.value = src.value;
        });
    }

    /* ------------------------------------------------------------------ */
    /*  CART UI + TOTALS (tax logic)                                      */
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
        const shipState = (document.getElementById('ship-state')?.value || '').trim().toUpperCase();
        const taxRate  = (shipState === 'CA' || shipState === 'CALIFORNIA') ? this.TAX_RATE_CA : 0;
        const taxAmt   = subtotal * taxRate;
        const total    = subtotal + giftFee + taxAmt;

        document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('gift-fee').textContent = giftFee.toFixed(2);
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
    /*  Checkout – address validation, final amount, call Lambda          */
    /* ------------------------------------------------------------------ */
    async proceedToCheckout() {
        if (!this.cart.length) { this.showError('Cart is empty'); return; }

        if (!this.validateAddress('ship')) { this.showError('Complete all required shipping fields'); return; }
        const same = document.getElementById('same-billing').checked;
        if (!same && !this.validateAddress('bill')) { this.showError('Complete all required billing fields'); return; }

        const shipping = this.collectAddress('ship');
        const billing  = same ? shipping : this.collectAddress('bill');
        const finalCents = Math.round(this.getCartTotal() * 100);

        const session = getSession();
        if (!session?.id_token) { alert('Sign in required'); return; }

        const payload = {
            action: 'createCheckoutSession',
            user_email: getUserInfo()?.email || null,
            amount: finalCents,
            cart_items: this.cart,
            item_count: this.cart.length,
            is_gift: this.isGift,
            shipping_address: shipping,
            billing_address: billing
        };

        try {
            const r = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify(payload)
            });
            if (!r.ok) throw new Error(await r.text());
            const { id } = await r.json();
            const result = await this.stripe.redirectToCheckout({ sessionId: id });
            if (result.error) throw result.error;
        } catch (e) {
            console.error(e);
            this.showError('Checkout error: ' + e.message);
        }
    }

    validateAddress(p) {
        const req = [`${p}-name`,`${p}-phone`,`${p}-line1`,`${p}-city`,`${p}-state`,`${p}-zip`];
        return req.every(id => document.getElementById(id)?.value.trim());
    }
    collectAddress(p) {
        return {
            name:  document.getElementById(`${p}-name`).value.trim(),
            phone: document.getElementById(`${p}-phone`).value.trim(),
            line1: document.getElementById(`${p}-line1`).value.trim(),
            line2: document.getElementById(`${p}-line2`).value.trim(),
            city:  document.getElementById(`${p}-city`).value.trim(),
            state: document.getElementById(`${p}-state`).value.trim(),
            zip:   document.getElementById(`${p}-zip`).value.trim(),
            country: document.getElementById(`${p}-country`).value.trim()
        };
    }
    getCartTotal() {
        const subtotal = this.cart.reduce((s,i)=>s+i.discountedPrice,0);
        const gift = this.isGift ? 12 : 0;
        const shipState = (document.getElementById('ship-state')?.value||'').trim().toUpperCase();
        const taxRate = (shipState==='CA'||shipState==='CALIFORNIA') ? this.TAX_RATE_CA : 0;
        return subtotal + gift + subtotal*taxRate;
    }

    /* ------------------------------------------------------------------ */
    /*  Remove / UI helpers                                               */
    /* ------------------------------------------------------------------ */
    removeFromCart(designId) {
        this.cart = this.cart.filter(i => i.designId !== designId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.updateProductCardButtons();
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

/* animation keyframes */
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideOut {from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
`;
document.head.appendChild(style);
