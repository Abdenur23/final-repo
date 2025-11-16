// js/checkout-manager.js
(async () => {
  // Utility
  function $(id){ return document.getElementById(id); }

  // Read cart & gift from localStorage (your existing code stores shoppingCart & isGiftOption)
  const rawCart = localStorage.getItem('shoppingCart') || '[]';
  const cart = JSON.parse(rawCart);
  const isGiftLocal = JSON.parse(localStorage.getItem('isGiftOption') || 'false');

  const cartList = $('cart-list');
  const cartEmpty = $('cart-empty');
  const cartTotals = $('cart-totals');
  const subtotalEl = $('subtotal');
  const grandTotalEl = $('grand-total');

  function formatUSD(c) {
    return `$${(c).toFixed(2)}`;
  }

  // Render cart
  if (!cart || cart.length === 0) {
    cartEmpty.textContent = 'Your cart is empty. Please add an item first.';
  } else {
    cartEmpty.classList.add('hidden');
    cartList.classList.remove('hidden');

    cartList.innerHTML = cart.map(i => `
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:8px;">
        <img src="${i.imageUrl || 'logo.png'}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:6px;">
        <div style="flex:1;">
          <div style="font-weight:600;">${i.paletteName}</div>
          <div class="muted" style="font-size:13px;">${i.discount > 0 ? i.discount + '% off' : ''}</div>
        </div>
        <div style="min-width:90px; text-align:right;">${formatUSD(i.discountedPrice)}</div>
      </div>
    `).join('');
    cartTotals.classList.remove('hidden');
  }

  const subtotal = cart.reduce((s, it) => s + (it.discountedPrice || 0), 0);
  subtotalEl.textContent = subtotal.toFixed(2);
  // We will update grand total after server returns session/amount (server calculates tax if any).
  grandTotalEl.textContent = subtotal.toFixed(2);

  // Prefill gift checkbox from localStorage
  $('is-gift').checked = isGiftLocal;

  // Billing same toggle
  $('billing-same').addEventListener('change', (e) => {
    if (e.target.checked) {
      $('billing-panel').classList.add('hidden');
    } else {
      $('billing-panel').classList.remove('hidden');
    }
  });

  // Cancel
  $('cancel-btn').addEventListener('click', () => {
    window.location.href = '/'; // or go back to product
  });

  // Main flow: verify & create checkout session
  $('verify-btn').addEventListener('click', async () => {
    $('verify-btn').disabled = true;
    $('verify-message').textContent = 'Verifying address…';

    // Build shipping object
    const shipping = {
      name: $('ship-name').value.trim(),
      phone: $('ship-phone').value.trim(),
      line1: $('ship-line1').value.trim(),
      line2: $('ship-line2').value.trim(),
      city: $('ship-city').value.trim(),
      state: $('ship-state').value,
      postal_code: $('ship-zip').value.trim(),
      country: $('ship-country').value
    };

    if (!shipping.name || !shipping.line1 || !shipping.city || !shipping.state || !shipping.postal_code) {
      $('verify-message').textContent = 'Please complete all required shipping fields.';
      $('verify-btn').disabled = false;
      return;
    }

    // Billing (if not same)
    let billing = null;
    if (!$('billing-same').checked) {
      billing = {
        name: $('bill-name').value.trim(),
        line1: $('bill-line1').value.trim(),
        city: $('bill-city').value.trim(),
        state: $('bill-state').value,
        postal_code: $('bill-zip').value.trim(),
        country: $('bill-country').value
      };
      if (!billing.name || !billing.line1) {
        $('verify-message').textContent = 'Please complete billing address fields or check "Billing same as shipping".';
        $('verify-btn').disabled = false;
        return;
      }
    } else {
      billing = { ...shipping };
    }

    const isGift = !!$('is-gift').checked;

    // PLACEHOLDER: Address verification - always confirm as valid
    // (Remove actual API call for now, will implement verification later)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Always confirm address is valid for now
      $('verify-message').textContent = 'Address confirmed. Preparing secure payment…';
      
      console.log('PLACEHOLDER: Address verification skipped - will implement later');
      console.log('Shipping address:', shipping);
      console.log('Billing address:', billing);
      
    } catch (err) {
      console.error(err);
      $('verify-message').textContent = 'Address verification failed. Try again later.';
      $('verify-btn').disabled = false;
      return;
    }

    // 2) Request server to create a Checkout Session
    try {
      const createResp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          cart,
          shipping,
          billing,
          is_gift: isGift,
          // optional: pass a coupon/promo code if you track it
        })
      });
      if (!createResp.ok) {
        const text = await createResp.text();
        $('verify-message').textContent = 'Checkout creation failed: ' + text;
        $('verify-btn').disabled = false;
        return;
      }
      const payload = await createResp.json();
      // payload: { sessionId, amountDisplay } - amountDisplay is total in dollars the server calculated
      // Update total shown on the page with the final server-calculated total (server includes CA tax when applicable).
      if (payload.amountDisplay) {
        grandTotalEl.textContent = payload.amountDisplay;
      }

      // Redirect to Stripe Checkout using returned sessionId
      const stripe = Stripe(payload.publishableKey || payload.stripePublishableKey || '');
      const result = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
      if (result.error) {
        $('verify-message').textContent = 'Stripe error: ' + result.error.message;
        $('verify-btn').disabled = false;
      }
    } catch (err) {
      console.error(err);
      $('verify-message').textContent = 'Payment initialization failed.';
      $('verify-btn').disabled = false;
    }
  });
})();
