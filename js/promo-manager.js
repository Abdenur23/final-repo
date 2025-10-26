// Promo code management
class PromoManager {
    constructor() {
        this.discountPercentage = 0;
        this.isValidPromo = false;
    }

    initialize() {
        this.renderPromoSection();
        this.setupEventListeners();
    }

    renderPromoSection() {
        const uploadSection = document.getElementById('uploadSection');
        if (!uploadSection) return;

        const promoHTML = `
            <div id="promoSection" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h4>🎁 Have a promo code?</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="promoCodeInput" placeholder="Enter promo code" 
                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <button id="applyPromoBtn" style="padding: 8px 16px; background: #17a2b8; color: white; 
                            border: none; border-radius: 4px; cursor: pointer;">
                        Apply
                    </button>
                </div>
                <div id="promoMessage" style="margin-top: 10px; font-size: 14px;"></div>
            </div>
        `;

        uploadSection.insertAdjacentHTML('afterend', promoHTML);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'applyPromoBtn') {
                this.applyPromoCode();
            }
        });

        const promoInput = document.getElementById('promoCodeInput');
        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyPromoCode();
                }
            });
        }
    }

    async applyPromoCode() {
        const promoCodeInput = document.getElementById('promoCodeInput');
        const promoMessage = document.getElementById('promoMessage');
        const applyBtn = document.getElementById('applyPromoBtn');
        
        const promoCode = promoCodeInput.value.trim();
        if (!promoCode) {
            this.showPromoMessage('Please enter a promo code', 'error');
            return;
        }

        applyBtn.disabled = true;
        applyBtn.textContent = 'Validating...';

        try {
            const isValid = await this.validatePromoCode(promoCode);
            if (isValid) {
                this.showPromoMessage(`✅ Promo code applied! ${this.discountPercentage}% discount activated.`, 'success');
                promoCodeInput.disabled = true;
                applyBtn.textContent = 'Applied';
                
                // Update any existing products with discount
                this.updateProductPrices();
            } else {
                this.showPromoMessage('❌ Invalid promo code. Please try another.', 'error');
                applyBtn.disabled = false;
                applyBtn.textContent = 'Apply';
            }
        } catch (error) {
            this.showPromoMessage('❌ Error validating promo code. Please try again.', 'error');
            applyBtn.disabled = false;
            applyBtn.textContent = 'Apply';
        }
    }

    async validatePromoCode(promoCode) {
        const token = getSession()?.id_token;
        if (!token) {
            console.log('User not signed in, skipping promo validation');
            return false;
        }

        try {
            const response = await fetch(CONFIG.API.BASE_URL + CONFIG.API.UPLOAD_ENDPOINT, {
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

            if (response.ok) {
                const result = await response.json();
                if (result.valid && result.discount_percentage) {
                    this.discountPercentage = result.discount_percentage;
                    this.isValidPromo = true;
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error validating promo code:', error);
            return false;
        }
    }

    showPromoMessage(message, type) {
        const promoMessage = document.getElementById('promoMessage');
        if (promoMessage) {
            promoMessage.innerHTML = `
                <div class="promo-message ${type}">
                    ${message}
                </div>
            `;
        }
    }

    getDiscountedPrice(originalPrice) {
        if (!this.isValidPromo) return originalPrice;
        return originalPrice * (1 - this.discountPercentage / 100);
    }

    updateProductPrices() {
        if (!window.realtimeUpdates) return;
        window.realtimeUpdates.updateAllProductPrices();
    }

    getDiscountInfo() {
        return {
            percentage: this.discountPercentage,
            isValid: this.isValidPromo
        };
    }
}
