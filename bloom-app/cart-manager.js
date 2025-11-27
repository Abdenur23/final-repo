// cart-manager.js
class CartManager {
    constructor() {
        this.promoDiscount = 0; // 0 to 1 (e.g., 0.1 = 10% off)
        this.giftWrappingEnabled = JSON.parse(localStorage.getItem(STORAGE_KEYS.GIFT_WRAPPING) || 'false');
        this.giftWrappingPrice = 30.00;
        this.cart = this.getCart(); // Load from storage initially
        this.loadSavedCart(); // Ensure gift wrapping is synced
    }
    
    addGiftWrapping() {
        if (this.hasGiftWrapping()) {
            console.log('Gift wrapping already in cart');
            return false;
        }
        
        const giftItem = {
            designId: 'gift-wrapping',
            name: 'Gift Wrapping & Personal Note',
            price: this.giftWrappingPrice,
            thumbnail: '🎁',
            isGiftWrapping: true,
            addedAt: new Date().toISOString()
        };
        
        this.cart.push(giftItem);
        this.saveCart();
        this.updateCartDisplay();
        console.log('Added gift wrapping to cart');
        return true;
    }
    
    removeGiftWrapping() {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => !item.isGiftWrapping);
        
        if (this.cart.length < initialLength) {
            this.saveCart();
            this.updateCartDisplay();
            console.log('Removed gift wrapping from cart');
        }
    }
    
    hasGiftWrapping() {
        return this.cart.some(item => item.isGiftWrapping);
    }
    
    // === CORE CART OPERATIONS ===
    addToCart(product) {
        const exists = this.cart.some(item => item.designId === product.designId);
        if (exists) {
            console.warn(`Product with designId ${product.designId} already in cart.`);
            return false;
        }
        console.log('Product:', product);
        const thumbnail = product.imageUrls?.['opt-turn_014'] ||
                         product.imageUrls?.['opt-turn_001'] ||
                         product.imageUrls?.['opt-turn_006'] ||
                         product.images?.[0] ||
                         '/images/placeholder.jpg';
        console.log('Thumbnail URL:', thumbnail);
        const cartItem = {
            designId: product.designId,
            name: product.name,
            price: product.price,
            images: product.images,
            device: product.device,
            thumbnail: thumbnail,
            addedAt: new Date().toISOString()
        };

        this.cart.push(cartItem);
        this.saveCart();
        this.updateCartBadge();
        this.refreshCartModal();

        if (window.app) {
            window.app.renderCurrentPage();
        }

        console.log(`Added ${product.name} to cart.`);
        return true;
    }

    removeFromCart(designId) {
        this.cart = this.cart.filter(item => item.designId !== designId);
        this.saveCart();
        this.updateCartBadge();
        this.refreshCartModal();

        if (window.app) {
            window.app.renderCurrentPage();
        }

        console.log(`Removed designId ${designId} from cart.`);
    }

    // === STORAGE & SYNC ===
    getCart() {
        const cart = localStorage.getItem(STORAGE_KEYS.SHOPPING_CART);
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem(STORAGE_KEYS.SHOPPING_CART, JSON.stringify(this.cart));
        localStorage.setItem(STORAGE_KEYS.GIFT_WRAPPING, JSON.stringify(this.giftWrappingEnabled));
    }

    loadSavedCart() {
        // Already loaded in constructor; this is for future use
    }

    // === UI UPDATES ===
    updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        const count = this.cart.length;

        if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count > 9 ? '9+' : count.toString();
        } else {
            badge.style.display = 'none';
        }
    }

    refreshCartModal() {
        const cartModal = document.getElementById('cart-modal');
        if (cartModal && cartModal.style.display === 'flex') {
            if (window.app && window.app.uiManager) {
                window.app.uiManager.renderCart();
            }
        }
    }

    updateCartDisplay() {
        this.updateCartBadge();
        this.refreshCartModal();
        if (window.app && window.app.uiManager) {
            window.app.uiManager.updateCartDisplay?.();
        }
    }

    // === PRICING & TOTALS ===
    getCartTotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
        const giftWrappingCost = this.giftWrappingEnabled ? this.giftWrappingPrice : 0;
        const discountAmount = subtotal * this.promoDiscount;
        const finalTotal = subtotal + giftWrappingCost - discountAmount;
    
        return {
            subtotal: subtotal.toFixed(2),
            discount: discountAmount.toFixed(2),
            giftWrapping: giftWrappingCost.toFixed(2),
            total: finalTotal.toFixed(2)
        };
    }

    // === GIFT WRAPPING ===
    toggleGiftWrapping(enabled) {
        this.giftWrappingEnabled = enabled;
        this.saveCart();
        this.updateCartDisplay();
    }

    // === UTILITIES ===
    clearCart() {
        this.cart = [];
        this.giftWrappingEnabled = false;
        localStorage.removeItem(STORAGE_KEYS.SHOPPING_CART);
        localStorage.removeItem(STORAGE_KEYS.GIFT_WRAPPING);
        this.updateCartBadge();
        this.refreshCartModal();
    }
}
