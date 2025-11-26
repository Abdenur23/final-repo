// promo-manager.js
class PromoManager {
    constructor(cartManager) {
        this.cartManager = cartManager;
        this.activePromoCode = '';
        this.activePromoDiscount = 0;
        this.loadSavedPromo();
    }

    async applyPromoCode(code) {
        const promoCode = code.trim();
        if (!promoCode) {
            this.showMessage('Please enter a promo code', 'error');
            return;
        }

        const messageElement = document.getElementById('promo-message') || this.createMessageElement();
        
        try {
            const token = this.getAuthToken();
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
                
                if (result.valid === true) {
                    const newDiscount = result.discount_percentage || 0;
                    
                    // Only apply if new discount is better than current
                    if (newDiscount > this.activePromoDiscount) {
                        this.activePromoCode = promoCode;
                        this.activePromoDiscount = newDiscount;
                        this.savePromoDiscount();
                        
                        this.showMessage(`✅ Promo code applied! ${newDiscount}% discount activated and will apply to all products`, 'success');
                        
                        // Clear input field on successful validation
                        const promoInput = document.getElementById('promoCodeInput');
                        if (promoInput) promoInput.value = '';
                    } else {
                        this.showMessage(`ℹ️ You already have an active ${this.activePromoDiscount}% discount. This code offers ${newDiscount}% which is not better.`, 'info');
                    }
                } else {
                    this.showMessage('❌ Invalid promo code', 'error');
                }

            } else {
                const errorText = await response.text();
                console.error('Promo validation error response:', errorText);
                this.showMessage('❌ Error validating promo code', 'error');
            }
        } catch (error) {
            console.error('Promo code network error:', error);
            this.showMessage('❌ Network error validating promo code', 'error');
        }

        // Update cart display to reflect any changes
        if (window.app) {
            window.app.uiManager.updateCartDisplay();
        }
    }

    removePromoCode() {
        this.activePromoCode = '';
        this.activePromoDiscount = 0;
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMO_CODE);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMO_DISCOUNT);
        this.showMessage('Promo code removed', 'info');
        
        if (window.app) {
            window.app.uiManager.updateCartDisplay();
        }
    }

    calculateDiscountedPrice(originalPrice) {
        if (this.activePromoDiscount > 0) {
            const discountAmount = originalPrice * (this.activePromoDiscount / 100);
            return Math.max(0, originalPrice - discountAmount);
        }
        return originalPrice;
    }

    calculateCartDiscounts(cartTotal) {
        if (this.activePromoDiscount === 0) {
            return {
                productDiscount: 0,
                giftWrappingDiscount: 0,
                totalDiscount: 0,
                finalTotal: cartTotal.total
            };
        }

        // Apply discount only to products (not gift wrapping)
        const productDiscount = cartTotal.subtotal * (this.activePromoDiscount / 100);
        const totalDiscount = productDiscount;
        const finalTotal = cartTotal.total - productDiscount;

        return {
            productDiscount: productDiscount,
            giftWrappingDiscount: 0, // No discount on gift wrapping
            totalDiscount: totalDiscount,
            finalTotal: Math.max(0, finalTotal)
        };
    }

    getAuthToken() {
        // Get token from your auth system
        const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_SESSION) || '{}');
        return session.access_token || '';
    }

    createMessageElement() {
        let messageElement = document.getElementById('promo-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'promo-message';
            messageElement.className = 'mt-2 text-sm';
            
            const promoContainer = document.querySelector('.promo-container') || 
                                 document.querySelector('#promo-section');
            if (promoContainer) {
                promoContainer.appendChild(messageElement);
            }
        }
        return messageElement;
    }

    showMessage(message, type = 'info') {
        const messageElement = this.createMessageElement();
        messageElement.innerHTML = message;
        
        // Clear previous classes
        messageElement.classList.remove('text-green-700', 'text-red-700', 'text-yellow-700', 'text-blue-700');
        
        // Add appropriate color class
        switch (type) {
            case 'success':
                messageElement.classList.add('text-green-700');
                break;
            case 'error':
                messageElement.classList.add('text-red-700');
                break;
            case 'info':
                messageElement.classList.add('text-blue-700');
                break;
            default:
                messageElement.classList.add('text-gray-700');
        }
    }

    savePromoDiscount() {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMO_CODE, this.activePromoCode);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMO_DISCOUNT, this.activePromoDiscount.toString());
    }

    loadSavedPromo() {
        const savedCode = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMO_CODE);
        const savedDiscount = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMO_DISCOUNT);
        
        if (savedCode) this.activePromoCode = savedCode;
        if (savedDiscount) this.activePromoDiscount = parseFloat(savedDiscount);
    }

    hasActivePromo() {
        return this.activePromoDiscount > 0;
    }

    getActivePromoInfo() {
        return {
            code: this.activePromoCode,
            discount: this.activePromoDiscount
        };
    }
}
