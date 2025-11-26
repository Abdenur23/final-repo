//product-carousel.js
// Product image carousel with iPod-style navigation
class ProductCarousel {
    constructor() {
        this.carousels = new Map();
        this.setupCarousels();
    }

    // Initialize carousels for all product cards
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

    initializeProductCard(productCard) {
        const productId = this.getProductId(productCard);
        
        if (this.carousels.has(productId)) return;

        // --------------------------------------------------------------
        // NEW: read the product object that StudioManager injected
        // --------------------------------------------------------------
        const productJson = productCard.dataset.product;
        let productImages = [];
        if (productJson) {
            try {
                const product = JSON.parse(productJson);
                productImages = product.images || [];
            } catch (e) {
                console.warn('Failed to parse product data for carousel', productId);
            }
        }

        // Fallback to 4 placeholder images if the product has none
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

    getProductId(productCard) {
        return productCard.dataset.designId || 
               productCard.id || 
               `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // --------------------------------------------------------------
    // NEW: generate 4 reliable placeholder images (only used when a
    //      product arrives without its own images)
    // --------------------------------------------------------------
    generatePlaceholderImages() {
        const fallbackIds = [237, 238, 239, 240]; // dog, city, mountains, beach
        return fallbackIds.map(id => `https://picsum.photos/id/${id}/600/800`);
    }

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
                                 onerror="this.handleImageError(this, '${productId}', ${index})">
                        </div>
                    `).join('')}
                </div>
                
                <!-- iPod-style navigation dots -->
                <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    ${images.map((_, index) => `
                        <button class="carousel-dot w-2 h-2 rounded-full transition-all duration-300 ${
                            index === 0 ? 'bg-white scale-125' : 'bg-white bg-opacity-50'
                        }" 
                                data-index="${index}"></button>
                    `).join('')}
                </div>
                
                <!-- Navigation arrows -->
                <button class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0">
                    ←
                </button>
                <button class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0">
                    →
                </button>
            </div>
        `;

        // Hover arrows
        imageContainer.addEventListener('mouseenter', () => {
            const prev = imageContainer.querySelector('.carousel-prev');
            const next = imageContainer.querySelector('.carousel-next');
            if (prev && next) {
                prev.style.opacity = '1';
                next.style.opacity = '1';
            }
        });

        imageContainer.addEventListener('mouseleave', () => {
            const prev = imageContainer.querySelector('.carousel-prev');
            const next = imageContainer.querySelector('.carousel-next');
            if (prev && next) {
                prev.style.opacity = '0';
                next.style.opacity = '0';
            }
        });
    }

    handleImageError(imgElement, productId, index) {
        console.log(`Image failed to load for product ${productId}, index ${index}`);
        // Fallback to a reliable placeholder
        const fallbackUrls = [
            'https://picsum.photos/id/237/600/800',
            'https://picsum.photos/id/238/600/800',
            'https://picsum.photos/id/239/600/800',
            'https://picsum.photos/id/240/600/800'
        ];
        imgElement.src = fallbackUrls[index % fallbackUrls.length];
        imgElement.alt = `Product image ${index + 1} (fallback)`;
    }

    attachEventListeners(productCard, productId) {
        const carouselData = this.carousels.get(productId);
        if (!carouselData) return;

        const wrapper = productCard.querySelector('.carousel-wrapper');
        const track = wrapper.querySelector('.carousel-track');
        const dots = wrapper.querySelectorAll('.carousel-dot');
        const prevBtn = wrapper.querySelector('.carousel-prev');
        const nextBtn = wrapper.querySelector('.carousel-next');

        prevBtn.addEventListener('click', () => this.previousImage(productId));
        nextBtn.addEventListener('click', () => this.nextImage(productId));

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToImage(productId, index);
            });
        });

        wrapper.addEventListener('touchstart', (e) => {
            carouselData.touchStartX = e.touches[0].clientX;
        });

        wrapper.addEventListener('touchend', (e) => {
            carouselData.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(productId);
        });

        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousImage(productId);
            if (e.key === 'ArrowRight') this.nextImage(productId);
        });

        wrapper.setAttribute('tabindex', '0');
    }

    nextImage(productId) {
        const carouselData = this.carousels.get(productId);
        if (!carouselData || carouselData.isAnimating) return;

        carouselData.isAnimating = true;
        const nextIndex = (carouselData.currentIndex + 1) % carouselData.images.length;
        this.goToImage(productId, nextIndex);
    }

    previousImage(productId) {
        const carouselData = this.carousels.get(productId);
        if (!carouselData || carouselData.isAnimating) return;

        carouselData.isAnimating = true;
        const prevIndex = carouselData.currentIndex === 0 ? 
            carouselData.images.length - 1 : carouselData.currentIndex - 1;
        this.goToImage(productId, prevIndex);
    }

    goToImage(productId, newIndex) {
        const carouselData = this.carousels.get(productId);
        if (!carouselData) return;

        const productCard = this.findProductCard(productId);
        if (!productCard) return;

        const track = productCard.querySelector('.carousel-track');
        const dots = productCard.querySelectorAll('.carousel-dot');

        if (track && dots) {
            const slideWidth = 100 / carouselData.images.length;
            track.style.transform = `translateX(-${newIndex * slideWidth}%)`;

            dots.forEach((dot, index) => {
                if (index === newIndex) {
                    dot.classList.add('bg-white', 'scale-125');
                    dot.classList.remove('bg-opacity-50');
                } else {
                    dot.classList.remove('bg-white', 'scale-125');
                    dot.classList.add('bg-opacity-50');
                }
            });

            carouselData.currentIndex = newIndex;
            
            setTimeout(() => {
                carouselData.isAnimating = false;
            }, 500);
        }
    }

    handleSwipe(productId) {
        const carouselData = this.carousels.get(productId);
        if (!carouselData) return;

        const swipeThreshold = 50;
        const swipeDistance = carouselData.touchStartX - carouselData.touchEndX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                this.nextImage(productId);
            } else {
                this.previousImage(productId);
            }
        }
    }

    findProductCard(productId) {
        return document.querySelector(`[data-design-id="${productId}"]`) ||
               document.getElementById(productId) ||
               document.querySelector(`.product-card`) ||
               document.querySelector(`[class*="product"][class*="${productId}"]`);
    }

    // Public method to refresh carousels
    refreshCarousels() {
        this.initializeExistingProducts();
    }

    // Method to manually add carousel to a specific element
    addCarouselToElement(element, images = null) {
        const productId = `manual-${Date.now()}`;
        const carouselData = {
            currentIndex: 0,
            images: images || this.generatePlaceholderImages(),
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(element, productId, carouselData.images);
        this.attachEventListeners(element, productId);

        return productId;
    }

    // Method to update images for a specific product
    updateProductImages(productId, newImages) {
        const carouselData = this.carousels.get(productId);
        if (carouselData) {
            carouselData.images = newImages;
            carouselData.currentIndex = 0;
            
            const productCard = this.findProductCard(productId);
            if (productCard) {
                this.createCarouselHTML(productCard, productId, newImages);
                this.attachEventListeners(productCard, productId);
            }
        }
    }
}

// Initialize carousel system
let productCarousel = null;

function initializeProductCarousels() {
    if (!productCarousel) {
        productCarousel = new ProductCarousel();
    }
    return productCarousel;
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductCarousels);
} else {
    initializeProductCarousels();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductCarousel, initializeProductCarousels };
}
