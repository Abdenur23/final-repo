//cart-manager.js
// Shopping cart management
class CartManager {
    constructor() {
        this.promoDiscount = 0;
    }

    updateCartBadge() {
        const cart = this.getCart();
        const badge = document.getElementById('cart-badge');
        const count = cart.length;
        
        if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count > 9 ? '9+' : count.toString();
        } else {
            badge.style.display = 'none';
        }
    }

    addToCart(product) {
        let cart = this.getCart();
        const exists = cart.some(item => item.designId === product.designId);
        
        if (exists) {
            console.warn(`Product with designId ${product.designId} already in cart.`);
            return false;
        }

        cart.push({
            designId: product.designId,
            name: product.name,
            price: product.price,
            images: product.images,
            device: product.device
        });
        this.saveCart(cart);
        this.updateCartBadge();
        
        if (window.app) {
            window.app.renderCurrentPage();
        }
        
        console.log(`Added ${product.name} to cart.`);
        return true;
    }

    removeFromCart(designId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.designId !== designId);
        this.saveCart(cart);
        this.updateCartBadge();
        
        if (window.app) {
            window.app.renderCurrentPage();
        }
        
        console.log(`Removed designId ${designId} from cart.`);
    }

    getCart() {
        const cart = localStorage.getItem(STORAGE_KEYS.SHOPPING_CART);
        return cart ? JSON.parse(cart) : [];
    }

    saveCart(cart) {
        localStorage.setItem(STORAGE_KEYS.SHOPPING_CART, JSON.stringify(cart));
    }

    getCartTotal() {
        const cart = this.getCart();
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const finalTotal = subtotal * (1 - this.promoDiscount);
        return {
            subtotal: subtotal.toFixed(2),
            discount: (subtotal * this.promoDiscount).toFixed(2),
            total: finalTotal.toFixed(2)
        };
    }

    clearCart() {
        this.saveCart([]);
        this.updateCartBadge();
    }
}
