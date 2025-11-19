//promo-manager.js
// Promotional code management
class PromoManager {
    constructor(cartManager) {
        this.cartManager = cartManager;
    }

    applyPromoCode(code) {
        const normalizedCode = code.toUpperCase().trim();
        const discountRate = VALID_PROMO_CODES[normalizedCode];

        if (discountRate !== undefined) {
            this.cartManager.promoDiscount = discountRate;
            localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMO, discountRate.toString());
            
            const messageElement = document.getElementById('promo-message') || document.getElementById('checkout-promo-message');
            if (messageElement) {
                messageElement.innerText = `Success! ${normalizedCode} applied. ${discountRate * 100}% discount active.`;
                messageElement.classList.remove('text-red-700');
                messageElement.classList.add('text-green-700');
            }
        } else {
            this.cartManager.promoDiscount = 0;
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMO);
            
            const messageElement = document.getElementById('promo-message') || document.getElementById('checkout-promo-message');
            if (messageElement) {
                messageElement.innerText = `Error: Code '${code}' is invalid or expired.`;
                messageElement.classList.remove('text-green-700');
                messageElement.classList.add('text-red-700');
            }
        }
        
        if (window.app) {
            window.app.renderCurrentPage();
        }
    }

    loadSavedPromo() {
        const savedDiscount = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMO);
        if (savedDiscount) {
            this.cartManager.promoDiscount = parseFloat(savedDiscount);
        }
    }

    clearPromoData() {
        this.cartManager.promoDiscount = 0;
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMO);
    }
}
