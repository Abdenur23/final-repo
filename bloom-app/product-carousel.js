// product-carousel.js
// Product image carousel – works with real pre-signed S3 URLs
class ProductCarousel {
    constructor() {
        this.carousels = new Map();
        this.setupCarousels();
    }

    setupCarousels() {
        setTimeout(() => this.initializeExistingProducts(), 100);
        this.setupMutationObserver();
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && 
                        (node.classList.contains('product-card') || 
                         node.querySelector('.product-card'))) {
                        this.initializeProductCard(node);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    initializeExistingProducts() {
        document.querySelectorAll('.product-card, [class*="product"]').forEach(card => this.initializeProductCard(card));
    }

    // -----------------------------------------------------------------
    // MAIN ENTRY – called for every product card
    // -----------------------------------------------------------------
    initializeProductCard(productCard) {
        const productId = this.getProductId(productCard);
        if (this.carousels.has(productId)) return;

        // 1. READ product JSON from data-product (added by StudioManager)
        let productImages = [];
        const productJson = productCard.dataset.product;
        if (productJson) {
            try {
                const product = JSON.parse(productJson);
                productImages = this.extractOrderedImages(product.imageUrls || product.images);
            } catch (e) {
                console.warn('Failed to parse data-product', productId, e);
            }
        }

        // 2. FALLBACK: 4 placeholder images
        if (productImages.length === 0) {
            productImages = this.generatePlaceholderImages();
        }

        const carouselData = {
            currentIndex: 0,
            images: productImages,
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(productCard, productId, carouselData.images);
        this.attachEventListeners(productCard, productId);
    }

    // -----------------------------------------------------------------
    // Extract URLs in the exact order the design system expects
    // -----------------------------------------------------------------
    extractOrderedImages(imageUrls) {
        if (!imageUrls) return [];

        const ORDER = ['opt-turn_006', 'opt-turn_001', 'opt-turn_014', 'opt-turn_010'];
        const urls = [];

        // 1. Add required prefixes in order
        ORDER.forEach(prefix => {
            const url = imageUrls[prefix];
            if (url) urls.push(url);
            else console.warn(`Missing image for prefix: ${prefix}`);
        });

        // 2. Add any extra keys (just in case)
        Object.keys(imageUrls).forEach(key => {
            if (!ORDER.includes(key) && imageUrls[key]) {
                urls.push(imageUrls[key]);
            }
        });

        return urls;
    }

    getProductId(card) {
        return card.dataset.designId || card.id || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generatePlaceholderImages() {
        return [
            'https://picsum.photos/id/237/600/800',
            'https://picsum.photos/id/238/600/800',
            'https://picsum.photos/id/239/600/800',
            'https://picsum.photos/id/240/600/800'
        ];
    }

    // -----------------------------------------------------------------
    // Build carousel HTML
    // -----------------------------------------------------------------
    createCarouselHTML(card, productId, images) {
        let container = card.querySelector('.product-image-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'product-image-container bg-gray-100 rounded-md overflow-hidden relative h-64 mb-3';
            const btn = card.querySelector('button');
            card.insertBefore(container, btn || card.firstChild);
        }

        container.innerHTML = `
            <div class="carousel-wrapper relative w-full h-full overflow-hidden rounded-md">
                <div class="carousel-track flex transition-transform duration-500 ease-out h-full" 
                     style="width: ${images.length * 100}%">
                    ${images.map((src, i) => `
                        <div class="carousel-slide w-1/${images.length} h-full flex-shrink-0">
                            <img src="${src}" 
                                 alt="Product view ${i + 1}"
                                 class="w-full h-full object-cover loading-image"
                                 onload="this.classList.remove('loading-image')"
                                 onerror="window.productCarousel.handleImageError(this, '${productId}', ${i}, '${src}')">
                        </div>
                    `).join('')}
                </div>

                <!-- Dots -->
                <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    ${images.map((_, i) => `
                        <button class="carousel-dot w-2 h-2 rounded-full transition-all duration-300 ${
                            i === 0 ? 'bg-white scale-125' : 'bg-white bg-opacity-50'
                        }" data-index="${i}"></button>
                    `).join('')}
                </div>

                <!-- Arrows (show on hover) -->
                <button class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0">
                    Previous
                </button>
                <button class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0">
                    Next
                </button>
            </div>
        `;

        // Hover arrows
        const wrapper = container.querySelector('.carousel-wrapper');
        wrapper.addEventListener('mouseenter', () => {
            wrapper.querySelectorAll('.carousel-prev, .carousel-next').forEach(b => b.style.opacity = '1');
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.querySelectorAll('.carousel-prev, .carousel-next').forEach(b => b.style.opacity = '0');
        });
    }

    // -----------------------------------------------------------------
    // Image load error → fallback + log
    // -----------------------------------------------------------------
    handleImageError(img, productId, index, url) {
        console.error(`Image failed: ${url} (product ${productId}, index ${index})`);
        const fallbacks = this.generatePlaceholderImages();
        img.src = fallbacks[index % 4];
        img.alt = `Fallback ${index + 1}`;
    }

    // -----------------------------------------------------------------
    // Event listeners
    // -----------------------------------------------------------------
    attachEventListeners(card, productId) {
        const data = this.carousels.get(productId);
        if (!data) return;

        const wrapper = card.querySelector('.carousel-wrapper');
        const track   = wrapper.querySelector('.carousel-track');
        const dots    = wrapper.querySelectorAll('.carousel-dot');
        const prev    = wrapper.querySelector('.carousel-prev');
        const next    = wrapper.querySelector('.carousel-next');

        prev.addEventListener('click', () => this.previousImage(productId));
        next.addEventListener('click', () => this.nextImage(productId));

        dots.forEach(dot => {
            dot.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index);
                this.goToImage(productId, idx);
            });
        });

        wrapper.addEventListener('touchstart', e => { data.touchStartX = e.touches[0].clientX; });
        wrapper.addEventListener('touchend', e => {
            data.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(productId);
        });

        wrapper.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.previousImage(productId);
            if (e.key === 'ArrowRight') this.nextImage(productId);
        });
        wrapper.tabIndex = 0;
    }

    // -----------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------
    nextImage(id) { this.slide(id, 1); }
    previousImage(id) { this.slide(id, -1); }

    slide(productId, direction) {
        const d = this.carousels.get(productId);
        if (!d || d.isAnimating) return;
        d.isAnimating = true;
        const next = (d.currentIndex + direction + d.images.length) % d.images.length;
        this.goToImage(productId, next);
    }

    goToImage(productId, index) {
        const d = this.carousels.get(productId);
        if (!d) return;
        const card = this.findProductCard(productId);
        if (!card) return;

        const track = card.querySelector('.carousel-track');
        const dots  = card.querySelectorAll('.carousel-dot');

        const slideWidth = 100 / d.images.length;
        track.style.transform = `translateX(-${index * slideWidth}%)`;

        dots.forEach((dot, i) => {
            dot.classList.toggle('bg-white', i === index);
            dot.classList.toggle('scale-125', i === index);
            dot.classList.toggle('bg-opacity-50', i !== index);
        });

        d.currentIndex = index;
        setTimeout(() => d.isAnimating = false, 500);
    }

    handleSwipe(productId) {
        const d = this.carousels.get(productId);
        if (!d) return;
        const diff = d.touchStartX - d.touchEndX;
        if (Math.abs(diff) > 50) this.slide(productId, diff > 0 ? 1 : -1);
    }

    findProductCard(id) {
        return document.querySelector(`[data-design-id="${id}"]`) || document.getElementById(id);
    }

    // -----------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------
    refreshCarousels() { this.initializeExistingProducts(); }
}

// -----------------------------------------------------------------
// Global init
// -----------------------------------------------------------------
let productCarousel = null;
function initializeProductCarousels() {
    if (!productCarousel) productCarousel = new ProductCarousel();
    return productCarousel;
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductCarousels);
} else {
    initializeProductCarousels();
}

// Expose for error handler
window.productCarousel = productCarousel;

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductCarousel, initializeProductCarousels };
}
