class PromoManager {
    constructor() {
        this.activePromoDiscount = 0;
        this.loadPromoDiscount();
    }

    loadPromoDiscount() {
        const savedDiscount = localStorage.getItem('activePromoDiscount');
        if (savedDiscount !== null) {
            this.activePromoDiscount = parseInt(savedDiscount);
            this.updatePromoBadge();
            this.updateAllProductPrices();
        }
    }

    savePromoDiscount() {
        localStorage.setItem('activePromoDiscount', this.activePromoDiscount.toString());
    }

    updatePromoBadge() {
        const badge = document.getElementById('activePromoBadge');
        const percentSpan = document.getElementById('activePromoPercent');
        
        if (this.activePromoDiscount > 0) {
            percentSpan.textContent = this.activePromoDiscount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    async applyPromoCode() {
        const promoCode = document.getElementById('promoCodeInput').value.trim();
        const messageDiv = document.getElementById('promoMessage');
        
        if (!promoCode) {
            messageDiv.innerHTML = '<span style="color: #dc3545;">Please enter a promo code</span>';
            return;
        }

        const token = getSession()?.id_token;
        if (!token) {
            messageDiv.innerHTML = '<span style="color: #dc3545;">Please sign in first</span>';
            return;
        }

        try {
            messageDiv.innerHTML = '<span style="color: #6c757d;">Validating promo code...</span>';
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ 
                    action: 'validatePromo',
                    promo_code: promoCode
                })
            });

            console.log('Promo validation response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Promo validation result:', result);
                
                if (result.valid === true || result.discount_percentage > 0) {
                    const newDiscount = result.discount_percentage || 30;
                    
                    // Only update if the new discount is higher than current active discount
                    if (newDiscount > this.activePromoDiscount) {
                        this.activePromoDiscount = newDiscount;
                        this.savePromoDiscount();
                        this.updatePromoBadge();
                        this.updateAllProductPrices();
                        
                        messageDiv.innerHTML = `<span style="color: #28a745;">✅ Promo code applied! ${this.activePromoDiscount}% discount activated and will apply to all products</span>`;
                    } else {
                        messageDiv.innerHTML = `<span style="color: #ffc107;">ℹ️ You already have an active ${this.activePromoDiscount}% discount. This code offers ${newDiscount}% which is not better.</span>`;
                    }
                    
                    // Clear the input field on successful validation
                    document.getElementById('promoCodeInput').value = '';
                    
                } else {
                    // Invalid promo code - but keep current active discount if any
                    messageDiv.innerHTML = '<span style="color: #dc3545;">❌ Invalid promo code</span>';
                    
                    if (this.activePromoDiscount > 0) {
                        messageDiv.innerHTML += `<br><span style="color: #17a2b8;">Your current ${this.activePromoDiscount}% discount remains active.</span>`;
                    }
                }
            } else {
                const errorText = await response.text();
                console.error('Promo validation error response:', errorText);
                messageDiv.innerHTML = '<span style="color: #dc3545;">❌ Error validating promo code</span>';
                
                if (this.activePromoDiscount > 0) {
                    messageDiv.innerHTML += `<br><span style="color: #17a2b8;">Your current ${this.activePromoDiscount}% discount remains active.</span>`;
                }
            }
        } catch (error) {
            console.error('Promo code network error:', error);
            messageDiv.innerHTML = '<span style="color: #dc3545;">❌ Network error validating promo code</span>';
            
            if (this.activePromoDiscount > 0) {
                messageDiv.innerHTML += `<br><span style="color: #17a2b8;">Your current ${this.activePromoDiscount}% discount remains active.</span>`;
            }
        }
    }

    updateAllProductPrices() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            this.updateProductPrice(card);
        });
    }

    updateProductPrice(productCard) {
        const originalPrice = CONFIG.PRODUCT_PRICE;
        const discountedPrice = originalPrice * (1 - this.activePromoDiscount / 100);
        
        const priceElement = productCard.querySelector('.product-price');
        const cartButton = productCard.querySelector('.add-to-cart-btn');
        
        if (this.activePromoDiscount > 0) {
            priceElement.innerHTML = `
                <span style="text-decoration: line-through; color: #6c757d; margin-right: 8px;">$${originalPrice.toFixed(2)}</span>
                <span style="color: #28a745;">$${discountedPrice.toFixed(2)}</span>
                <div style="font-size: 12px; color: #28a745;">${this.activePromoDiscount}% OFF</div>
            `;
            cartButton.textContent = `Add to Cart - $${discountedPrice.toFixed(2)}`;
        } else {
            priceElement.textContent = `$${originalPrice.toFixed(2)}`;
            cartButton.textContent = `Add to Cart - $${originalPrice.toFixed(2)}`;
        }
    }

    getActiveDiscount() {
        return this.activePromoDiscount;
    }
}
