// js/cart-manager.js
class CartManager {
    constructor() {
        this.cart = [];
        this.isGift = false;
        this.loadCartFromStorage();
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('shoppingCart');
        const savedGiftOption = localStorage.getItem('isGiftOption');
        
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
        if (savedGiftOption) {
            this.isGift = JSON.parse(savedGiftOption);
        }
    }

    saveCartToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
        localStorage.setItem('isGiftOption', JSON.stringify(this.isGift));
    }

    getCartItems() {
        return this.cart;
    }

    getCartCount() {
        return this.cart.length;
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => total + item.discountedPrice, 0);
    }

    getGiftFee() {
        return this.isGift ? 12.00 : 0;
    }

    getTotal() {
        return this.getSubtotal() + this.getGiftFee();
    }

    setGiftOption(isGift) {
        this.isGift = isGift;
        this.saveCartToStorage();
    }

    isInCart(designId) {
        return this.cart.some(item => item.designId === designId);
    }

    addToCart(designId, realtimeUpdates) {
        if (this.isInCart(designId)) {
            return false;
        }

        const design = realtimeUpdates.progressTracker.getCompletedDesign(designId);
        if (!design) {
            console.error('Design not found:', designId);
            return false;
        }

        const currentDiscount = realtimeUpdates.promoManager.getActiveDiscount();
        const originalPrice = CONFIG.PRODUCT_PRICE;
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
        return true;
    }

    removeFromCart(designId) {
        this.cart = this.cart.filter(item => item.designId !== designId);
        this.saveCartToStorage();
    }

    clearCart() {
        this.cart = [];
        this.isGift = false;
        localStorage.removeItem('shoppingCart');
        localStorage.removeItem('isGiftOption');
    }
}

// Initialize globally
window.cartManager = new CartManager();
