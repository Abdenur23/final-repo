//product-carousel.js
// Product image carousel with iPod-style navigation
class ProductCarousel {
    constructor() {
        this.carousels = new Map();
        this.setupCarousels();
    }

    // -----------------------------------------------------------------
    // 1. Initialise observers & existing cards
    // -----------------------------------------------------------------
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

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    initializeExistingProducts() {
        const productCards = document.querySelectorAll('.product-card, [class*="product"]');
        productCards.forEach(card => this.initializeProductCard(card));
    }

    // -----------------------------------------------------------------
    // 2. Main entry – called for every new card (including real-time)
    // -----------------------------------------------------------------
    initializeProductCard(productCard) {
        const productId = this.getProductId(productCard);
        if (this.carousels.has(productId)) return;

        // ---- READ PRODUCT JSON FROM data-product (written by StudioManager) ----
        const productJson = productCard.dataset.product;
        let productImages = [];

        if (productJson) {
            try {
                const product = JSON.parse(productJson);
                productImages = this.extractOrderedImages(product.imageUrls);
            } catch (e) {
                console.warn('Failed to parse data-product JSON', productId, e);
            }
        }

        // ---- FALLBACK: 4 reliable placeholders if nothing was supplied ----
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
    // 3. Helper: turn { "opt-turn_006": "url", … } → ordered array
    // -----------------------------------------------------------------
    extractOrderedImages(imageUrlsObj) {
        if (!imageUrlsObj) return [];

        // The exact order the design system expects
        const REQUIRED_ORDER = [
            'opt-turn_006',
            'opt-turn_001',
            'opt-turn_014',
            'opt-turn_010'
        ];

        const urls = [];
        for (const prefix of REQUIRED_ORDER) {
            const url = imageUrlsObj[prefix];
            if (url) urls.push(url);
            else console.warn(`Missing image for prefix ${prefix}`);
        }

        // If for some reason the object has extra keys, keep them as a bonus
        for (const key in imageUrlsObj) {
            if (!REQUIRED_ORDER.includes(key) && imageUrlsObj[key]) {
                urls.push(imageUrlsObj[key]);
            }
        }

        return urls;
    }

    getProductId(productCard) {
        return productCard.dataset.designId ||
               productCard.id ||
               `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // -----------------------------------------------------------------
    // 4. Placeholder images (only used when product has none)
    // -----------------------------------------------------------------
    generatePlaceholderImages() {
        const ids = [237, 238, 239, 240]; // dog, city, mountains, beach
        return ids.map(id => `https://picsum.photos/id/${id}/600/800`);
    }

    // -----------------------------------------------------------------
    // 5. Build the carousel markup
    // -----------------------------------------------------------------
    createCarouselHTML(productCard, productId, images) {
        let imageContainer = productCard.querySelector('.product-image-container');

        if (!imageContainer) {
            const placeholder = productCard.querySelector('.bg-gray-100, [class*="placeholder"], [class*="preview"]');
            if (placeholder) {
                imageContainer = placeholder;
                imageContainer.innerHTML = '';
                imageContainer.classList.add('product-image-container');
            } else {
                imageContainer = document.createElement('div');
                imageContainer.className = 'product-image-container bg-gray-100 rounded-md overflow-hidden relative';
                const button = productCard.querySelector('button');
                if (button) {
                    productCard.insertBefore(imageContainer, button);
                } else {
                    productCard.prepend(imageContainer);
                }
            }
        }

        imageContainer.innerHTML = `
            <div class="carousel-wrapper relative w-full h-64 overflow-hidden rounded-md">
                <div class="carousel-track flex transition-transform duration-500 ease-out h-full" 
                     style="width: ${images.length * 100}%">
                    ${images.map((img, index) => `
                        <div class="carousel-slide w-1/${images.length} h-full flex-shrink-0">
                            <img src="${img}" 
                                 alt="Product view ${index + 1}"
                                 class="w-full h-full object-cover loading-image"
                                 onload="this.classList.remove('loading-image')"
                                 onerror="window.productCarousel.handleImageError(this, '${productId}', ${index}, '${img}')">
                        </div>
                    `).join('')}
                </div>

                <!-- iPod-style dots -->
                <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    ${images.map((_, index) => `
                        <button class="carousel-dot w-2 h-2 rounded-full transition-all duration-300 ${
                            index === 0 ? 'bg-white scale-125' : 'bg-white bg-opacity-50'
                        }" data-index="${index}"></button>
                    `).join('')}
                </div>

                <!-- Arrows (appear on hover) -->
                <button class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0">
                    Previous
                </button>
                <button class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0">
                    Next
                </button>
            </div>
        `;

        // Hover arrows
        const wrapper = imageContainer.querySelector('.carousel-wrapper');
        wrapper.addEventListener('mouseenter', () => {
            wrapper.querySelectorAll('.carousel-prev, .carousel-next')
                   .forEach(btn => btn.style.opacity = '1');
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.querySelectorAll('.carousel-prev, .carousel-next')
                   .forEach(btn => btn.style.opacity = '0');
        });
    }

    // -----------------------------------------------------------------
    // 6. Image load error → fallback + console log
    // -----------------------------------------------------------------
    handleImageError(imgElement, productId, index, originalUrl) {
        console.error(`Image failed for product ${productId} (index ${index}): ${originalUrl}`);
        const fallbacks = [
            'https://picsum.photos/id/237/600/800',
            'https://picsum.photos/id/238/600/800',
            'https://picsum.photos/id/239/600/800',
            'https://picsum.photos/id/240/600/800'
        ];
        imgElement.src = fallbacks[index % fallbacks.length];
        imgElement.alt = `Fallback ${index + 1}`;
    }

    // -----------------------------------------------------------------
    // 7. Event listeners (arrows, dots, swipe, keyboard)
    // -----------------------------------------------------------------
    attachEventListeners(productCard, productId) {
        const data = this.carousels.get(productId);
        if (!data) return;

        const wrapper = productCard.querySelector('.carousel-wrapper');
        const track   = wrapper.querySelector('.carousel-track');
        const dots    = wrapper.querySelectorAll('.carousel-dot');
        const prevBtn = wrapper.querySelector('.carousel-prev');
        const nextBtn = wrapper.querySelector('.carousel-next');

        prevBtn.addEventListener('click', () => this.previousImage(productId));
        nextBtn.addEventListener('click', () => this.nextImage(productId));

        dots.forEach(dot => {
            dot.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index);
                this.goToImage(productId, idx);
            });
        });

        // Touch swipe
        wrapper.addEventListener('touchstart', e => {
            data.touchStartX = e.touches[0].clientX;
        });
        wrapper.addEventListener('touchend', e => {
            data.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(productId);
        });

        // Keyboard
        wrapper.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.previousImage(productId);
            if (e.key === 'ArrowRight') this.nextImage(productId);
        });
        wrapper.setAttribute('tabindex', '0');
    }

    // -----------------------------------------------------------------
    // 8. Navigation helpers
    // -----------------------------------------------------------------
    nextImage(productId) {
        const d = this.carousels.get(productId);
        if (!d || d.isAnimating) return;
        d.isAnimating = true;
        const next = (d.currentIndex + 1) % d.images.length;
        this.goToImage(productId, next);
    }

    previousImage(productId) {
        const d = this.carousels.get(productId);
        if (!d || d.isAnimating) return;
        d.isAnimating = true;
        const prev = d.currentIndex === 0 ? d.images.length - 1 : d.currentIndex - 1;
        this.goToImage(productId, prev);
    }

    goToImage(productId, newIndex) {
        const d = this.carousels.get(productId);
        if (!d) return;

        const card   = this.findProductCard(productId);
        if (!card) return;

        const track = card.querySelector('.carousel-track');
        const dots  = card.querySelectorAll('.carousel-dot');

        if (track && dots) {
            const slideWidth = 100 / d.images.length;
            track.style.transform = `translateX(-${newIndex * slideWidth}%)`;

            dots.forEach((dot, i) => {
                if (i === newIndex) {
                    dot.classList.add('bg-white', 'scale-125');
                    dot.classList.remove('bg-opacity-50');
                } else {
                    dot.classList.remove('bg-white', 'scale-125');
                    dot.classList.add('bg-opacity-50');
                }
            });

            d.currentIndex = newIndex;
            setTimeout(() => d.isAnimating = false, 500);
        }
    }

    handleSwipe(productId) {
        const d = this.carousels.get(productId);
        if (!d) return;

        const THRESHOLD = 50;
        const diff = d.touchStartX - d.touchEndX;

        if (Math.abs(diff) > THRESHOLD) {
            if (diff > 0) this.nextImage(productId);
            else this.previousImage(productId);
        }
    }

    findProductCard(productId) {
        return document.querySelector(`[data-design-id="${productId}"]`) ||
               document.getElementById(productId);
    }

    // -----------------------------------------------------------------
    // 9. Public API
    // -----------------------------------------------------------------
    refreshCarousels() { this.initializeExistingProducts(); }

    addCarouselToElement(el, imgs = null) {
        const id = `manual-${Date.now()}`;
        const data = {
            currentIndex: 0,
            images: imgs || this.generatePlaceholderImages(),
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };
        this.carousels.set(id, data);
        this.createCarouselHTML(el, id, data.images);
        this.attachEventListeners(el, id);
        return id;
    }

    updateProductImages(productId, newImages) {
        const d = this.carousels.get(productId);
        if (!d) return;
        d.images = newImages;
        d.currentIndex = 0;
        const card = this.findProductCard(productId);
        if (card) {
            this.createCarouselHTML(card, productId, newImages);
            this.attachEventListeners(card, productId);
        }
    }
}

// -----------------------------------------------------------------
// Global initialisation (unchanged)
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

// expose for error handler
window.productCarousel = productCarousel;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductCarousel, initializeProductCarousels };
}
