//promo-manager.js
class PromoManager {
    constructor(cartManager) {
        this.cartManager = cartManager;
        this.activePromoCode = null;
    }

    async applyPromoCode(code) {
        const normalizedCode = code.toUpperCase().trim();
        
        try {
            const token = window.app?.authManager?.getSession()?.accessToken;
            if (!token) {
                this.showMessage('Please sign in to apply promo codes', 'error');
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ 
                    action: 'validatePromo',
                    promo_code: normalizedCode
                })
            });

            console.log('Promo validation response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Promo validation result:', result);
                
                if (result.valid === true) {
                    const newDiscount = (result.discount_percentage || 0) / 100;
                    this.activePromoCode = normalizedCode;
                    this.cartManager.promoDiscount = newDiscount;
                    
                    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMO, JSON.stringify({
                        code: normalizedCode,
                        discount: newDiscount
                    }));
                    
                    this.showMessage(`Success! ${normalizedCode} applied. ${result.discount_percentage}% discount active.`, 'success');
                } else {
                    this.clearPromo();
                    this.showMessage(`Error: Code '${normalizedCode}' is invalid or expired.`, 'error');
                }
            } else {
                this.clearPromo();
                this.showMessage('Error validating promo code', 'error');
            }
        } catch (error) {
            console.error('Promo validation error:', error);
            this.clearPromo();
            this.showMessage('Network error validating promo', 'error');
        }
        
        if (window.app) {
            window.app.renderCurrentPage();
        }
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('promo-message');
        if (messageElement) {
            messageElement.innerText = message;
            messageElement.className = 'text-sm mt-2 ' + (type === 'success' ? 'text-green-700' : 'text-red-700');
        }
    }

    loadSavedPromo() {
        const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMO);
        if (saved) {
            try {
                const promoData = JSON.parse(saved);
                this.activePromoCode = promoData.code;
                this.cartManager.promoDiscount = promoData.discount;
            } catch (e) {
                // Fallback for old format
                const savedDiscount = parseFloat(saved);
                if (!isNaN(savedDiscount)) {
                    this.cartManager.promoDiscount = savedDiscount;
                }
            }
        }
    }

    clearPromoData() {
        this.activePromoCode = null;
        this.cartManager.promoDiscount = 0;
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROMO);
    }
}
