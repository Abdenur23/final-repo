// cart-manager.js
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART_ITEMS) || '[]');
        this.giftWrappingEnabled = JSON.parse(localStorage.getItem(STORAGE_KEYS.GIFT_WRAPPING) || 'false');
        this.giftWrappingPrice = 20.00;
        this.loadSavedCart();
    }

    addToCart(product) {
        // Use opt-turn_014 as thumbnail if available
        const thumbnail = product.imageUrls?.['opt-turn_014'] || 
                         product.imageUrls?.['opt-turn_001'] || 
                         product.imageUrls?.['opt-turn_006'] || 
                         product.images?.[0] || 
                         '/images/placeholder.jpg';

        const cartItem = {
            ...product,
            thumbnail: thumbnail,
            addedAt: new Date().toISOString()
        };

        this.cart.push(cartItem);
        this.saveCart();
        this.updateCartDisplay();
    }

    removeFromCart(designId) {
        this.cart = this.cart.filter(item => item.designId !== designId);
        this.saveCart();
        this.updateCartDisplay();
    }

    getCart() {
        return this.cart;
    }

    getCartTotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
        const giftWrappingCost = this.giftWrappingEnabled ? this.giftWrappingPrice : 0;
        return {
            subtotal: subtotal,
            giftWrapping: giftWrappingCost,
            total: subtotal + giftWrappingCost
        };
    }

    toggleGiftWrapping(enabled) {
        this.giftWrappingEnabled = enabled;
        localStorage.setItem(STORAGE_KEYS.GIFT_WRAPPING, JSON.stringify(enabled));
        this.updateCartDisplay();
    }

    saveCart() {
        localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(this.cart));
    }

    loadSavedCart() {
        const savedGiftWrapping = localStorage.getItem(STORAGE_KEYS.GIFT_WRAPPING);
        if (savedGiftWrapping !== null) {
            this.giftWrappingEnabled = JSON.parse(savedGiftWrapping);
        }
    }

    updateCartDisplay() {
        if (window.app && window.app.uiManager) {
            window.app.uiManager.updateCartDisplay();
        }
    }

    clearCart() {
        this.cart = [];
        this.giftWrappingEnabled = false;
        localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
        localStorage.removeItem(STORAGE_KEYS.GIFT_WRAPPING);
        this.updateCartDisplay();
    }
}
