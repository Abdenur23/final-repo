// js/stripe-payment.js
// js/stripe-payment.js
class StripePayment {
  constructor() {
    this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
    this.cart = [];
    this.isGift = false;
    this.shipping = {};
    this.billing = {};
    this.isBillingSame = true;

    this.loadCartFromStorage();
    this.setupEventListeners();
    this.populateStateSelects();
  }

  // ──────────────────────────────────────────────────────────────
  // STORAGE & UI
  // ──────────────────────────────────────────────────────────────
  loadCartFromStorage() {
    const saved = localStorage.getItem('shoppingCart');
    const gift = localStorage.getItem('isGiftOption');
    if (saved) this.cart = JSON.parse(saved);
    if (gift !== null) this.isGift = JSON.parse(gift);
    this.updateCartCount();
  }

  saveCartToStorage() {
    localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
    localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
  }

  updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) {
      el.textContent = this.cart.length;
      el.style.display = this.cart.length ? 'flex' : 'none';
    }
  }

  // ──────────────────────────────────────────────────────────────
  // MODAL CONTROL
  // ──────────────────────────────────────────────────────────────
  openCartModal() {
    this.renderCartItems();
    this.updateSummary();
    document.getElementById('cart-modal').style.display = 'block';
  }

  closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
  }

  // ──────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ──────────────────────────────────────────────────────────────
  setupEventListeners() {
    // Gift checkbox
    document.getElementById('gift-checkbox')?.addEventListener('change', (e) => {
      this.isGift = e.target.checked;
      this.saveCartToStorage();
      this.updateSummary();
    });

    // Billing same checkbox
    document.getElementById('billing-same')?.addEventListener('change', (e) => {
      this.isBillingSame = e.target.checked;
      document.getElementById('billing-section').style.display = this.isBillingSame ? 'none' : 'block';
      this.updateSummary();
    });

    // Pay button
    document.getElementById('pay-button')?.addEventListener('click', () => this.finalizeCheckout());

    // Close on ESC / backdrop
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeCartModal();
    });
    document.getElementById('cart-modal').addEventListener('click', (e) => {
      if (e.target.id === 'cart-modal') this.closeCartModal();
    });
  }

  // ──────────────────────────────────────────────────────────────
  // STATE SELECT POPULATION
  // ──────────────────────────────────────────────────────────────
  populateStateSelects() {
    const states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    const inject = (id) => {
      const sel = document.getElementById(id);
      states.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        sel.appendChild(opt);
      });
    };
    inject('shipping-state');
    inject('billing-state');
  }

  // ──────────────────────────────────────────────────────────────
  // CART RENDERING
  // ──────────────────────────────────────────────────────────────
  renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (!this.cart.length) {
      container.innerHTML = '<p style="text-align:center; color:#666; padding:40px;">Your cart is empty</p>';
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #eee; gap:12px;">
        <img src="${item.imageUrl}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
        <div style="flex:1;">
          <div style="font-weight:600; font-size:14px;">${item.paletteName}</div>
          <div style="color:#666; font-size:13px;">$${item.discountedPrice.toFixed(2)}</div>
        </div>
        <button onclick="window.stripePayment.removeFromCart('${item.designId}')" 
                style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px;">
          Remove
        </button>
      </div>
    `).join('');
  }

  removeFromCart(designId) {
    this.cart = this.cart.filter(i => i.designId !== designId);
    this.saveCartToStorage();
    this.updateCartCount();
    this.renderCartItems();
    this.updateSummary();
  }

  // ──────────────────────────────────────────────────────────────
  // SUMMARY & TAX CALC
  // ──────────────────────────────────────────────────────────────
  getSubtotal() {
    return this.cart.reduce((sum, i) => sum + i.discountedPrice, 0);
  }

  getGiftFee() {
    return this.isGift ? 12.00 : 0;
  }

  getTax() {
    const state = this.isBillingSame
      ? document.getElementById('shipping-state').value
      : document.getElementById('billing-state').value;
    return state === 'CA' ? this.getSubtotal() * 0.0825 : 0;
  }

  getTotal() {
    return this.getSubtotal() + this.getGiftFee() + this.getTax();
  }

  updateSummary() {
    const subtotal = this.getSubtotal();
    const gift = this.getGiftFee();
    const tax = this.getTax();
    const total = this.getTotal();

    document.getElementById('summary-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('summary-gift').style.display = gift ? 'flex' : 'none';
    document.getElementById('summary-tax').style.display = tax ? 'flex' : 'none';
    document.getElementById('summary-tax-amount').textContent = tax.toFixed(2);
    document.getElementById('summary-total').textContent = total.toFixed(2);
    document.getElementById('pay-amount').textContent = total.toFixed(2);

    // Sync gift checkbox
    document.getElementById('gift-checkbox').checked = this.isGift;
  }

  // ──────────────────────────────────────────────────────────────
  // FORM VALIDATION & DATA COLLECTION
  // ──────────────────────────────────────────────────────────────
  validateForm() {
    const required = ['shipping-name', 'shipping-line1', 'shipping-city', 'shipping-state', 'shipping-zip'];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.focus();
        return false;
      }
    }
    if (!this.isBillingSame) {
      const bill = ['billing-name', 'billing-line1', 'billing-city', 'billing-state', 'billing-zip'];
      for (const id of bill) {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          el.focus();
          return false;
        }
      }
    }
    return true;
  }

  collectAddresses() {
    const get = (prefix) => ({
      name: document.getElementById(`${prefix}-name`).value.trim(),
      line1: document.getElementById(`${prefix}-line1`).value.trim(),
      line2: document.getElementById(`${prefix}-line2`).value.trim(),
      city: document.getElementById(`${prefix}-city`).value.trim(),
      state: document.getElementById(`${prefix}-state`).value,
      postal_code: document.getElementById(`${prefix}-zip`).value.trim(),
      country: 'US'
    });

    this.shipping = get('shipping');
    this.billing = this.isBillingSame ? this.shipping : get('billing');
  }

  // ──────────────────────────────────────────────────────────────
  // FINAL CHECKOUT
  // ──────────────────────────────────────────────────────────────
  async finalizeCheckout() {
    if (!this.validateForm()) {
      this.showError('Please fill in all required fields');
      return;
    }

    this.collectAddresses();

    const totalCents = Math.round(this.getTotal() * 100);
    const taxCents = Math.round(this.getTax() * 100);
    const giftFeeCents = this.isGift ? 1200 : 0;

    try {
      const session = getSession();
      if (!session?.id_token) throw new Error('Please sign in');

      const userInfo = getUserInfo();

      const payload = {
        action: 'createCheckoutSession',
        user_email: userInfo?.email || null,
        amount: totalCents,
        cart_items: this.cart,
        item_count: this.cart.length,
        is_gift: this.isGift,
        tax_amount: taxCents,
        shipping_address: this.shipping,
        billing_address: this.billing
      };

      console.log('Checkout payload:', payload);

      const res = await fetch(CONFIG.CHECKOUT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.id_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Checkout failed');
      }

      const { id } = await res.json();
      const result = await this.stripe.redirectToCheckout({ sessionId: id });
      if (result.error) throw result.error;

    } catch (err) {
      console.error('Checkout error:', err);
      this.showError('Checkout failed: ' + err.message);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // UTILITIES
  // ──────────────────────────────────────────────────────────────
  showError(msg) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed; top:20px; right:20px; background:#dc3545; color:white; padding:12px 20px; border-radius:8px; z-index:10000;`;
    div.innerHTML = `<strong>Error:</strong> ${msg}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  }
}

// Global instance
window.stripePayment = new StripePayment();


// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
