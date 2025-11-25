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
        
        // Don't reinitialize if already exists
        if (this.carousels.has(productId)) return;

        // Get product data from localStorage or product card data attributes
        const productData = this.getProductData(productId);
        const images = this.getProductImages(productData, productId);
        
        const carouselData = {
            currentIndex: 0,
            images: images,
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0,
            productId: productId
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(productCard, productId, images);
        this.attachEventListeners(productCard, productId);
    }

    getProductId(productCard) {
        return productCard.dataset.designId || 
               productCard.id || 
               `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getProductData(productId) {
        // Try to find product data from localStorage
        try {
            const designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
            return designs.find(design => design.designId === productId) || null;
        } catch (error) {
            console.error('Error parsing product designs:', error);
            return null;
        }
    }

    getProductImages(productData, productId) {
        // If we have product data with images, use those
        if (productData && productData.images && productData.images.length > 0) {
            console.log(`Using actual product images for ${productId}:`, productData.images);
            return productData.images;
        }
        
        // Fallback: Try to get images from data attributes
        const productCard = this.findProductCard(productId);
        if (productCard && productCard.dataset.images) {
            try {
                const images = JSON.parse(productCard.dataset.images);
                if (images && images.length > 0) {
                    return images;
                }
            } catch (error) {
                console.error('Error parsing images from data attribute:', error);
            }
        }
        
        // Final fallback: Use placeholder images (should rarely happen)
        console.warn(`No product images found for ${productId}, using fallback images`);
        return this.generateFallbackImages(productId);
    }

    generateFallbackImages(productId) {
        // Use reliable placeholder images as final fallback
        const fallbackUrls = [
            'https://picsum.photos/id/237/600/800', // Dog
            'https://picsum.photos/id/238/600/800', // City
            'https://picsum.photos/id/239/600/800', // Mountains
            'https://picsum.photos/id/240/600/800'  // Beach
        ];
        return fallbackUrls;
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

        // Add hover effects
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
        console.warn(`Image failed to load for product ${productId}, index ${index}`);
        
        // Try to get the product data and use a different image from the same product
        const carouselData = this.carousels.get(productId);
        if (carouselData && carouselData.images && carouselData.images.length > 0) {
            // Try next image in sequence (circular)
            const nextIndex = (index + 1) % carouselData.images.length;
            if (nextIndex !== index) {
                imgElement.src = carouselData.images[nextIndex];
                return;
            }
        }
        
        // Final fallback to reliable placeholder
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

        // Button events
        prevBtn.addEventListener('click', () => this.previousImage(productId));
        nextBtn.addEventListener('click', () => this.nextImage(productId));

        // Dot events
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToImage(productId, index);
            });
        });

        // Touch events for mobile
        wrapper.addEventListener('touchstart', (e) => {
            carouselData.touchStartX = e.touches[0].clientX;
        });

        wrapper.addEventListener('touchend', (e) => {
            carouselData.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(productId);
        });

        // Keyboard navigation
        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousImage(productId);
            if (e.key === 'ArrowRight') this.nextImage(productId);
        });

        // Make carousel focusable for accessibility
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
            // Update track position
            const slideWidth = 100 / carouselData.images.length;
            track.style.transform = `translateX(-${newIndex * slideWidth}%)`;

            // Update dots
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
            
            // Reset animation flag
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
        // First try by designId data attribute
        const byDesignId = document.querySelector(`[data-design-id="${productId}"]`);
        if (byDesignId) return byDesignId;
        
        // Then try by ID
        const byId = document.getElementById(productId);
        if (byId) return byId;
        
        // Then try to find any product card that might contain this product
        const productCards = document.querySelectorAll('.product-card');
        for (let card of productCards) {
            const cardProductId = this.getProductId(card);
            if (cardProductId === productId) {
                return card;
            }
        }
        
        return null;
    }

    // Public method to refresh carousels
    refreshCarousels() {
        this.initializeExistingProducts();
    }

    // Method to update images for a specific product
    updateProductImages(productId, newImages) {
        let carouselData = this.carousels.get(productId);
        
        if (carouselData) {
            // Update existing carousel
            carouselData.images = newImages;
            carouselData.currentIndex = 0;
            
            const productCard = this.findProductCard(productId);
            if (productCard) {
                this.createCarouselHTML(productCard, productId, newImages);
                this.attachEventListeners(productCard, productId);
            }
        } else {
            // Create new carousel if it doesn't exist
            carouselData = {
                currentIndex: 0,
                images: newImages,
                isAnimating: false,
                touchStartX: 0,
                touchEndX: 0,
                productId: productId
            };
            this.carousels.set(productId, carouselData);
            
            const productCard = this.findProductCard(productId);
            if (productCard) {
                this.createCarouselHTML(productCard, productId, newImages);
                this.attachEventListeners(productCard, productId);
            }
        }
    }

    // Method to handle new products being added dynamically
    handleNewProduct(productData) {
        if (!productData || !productData.designId) {
            console.error('Invalid product data:', productData);
            return;
        }

        console.log('Handling new product in carousel:', productData.designId, productData.images);
        
        // Update or create carousel for this product
        this.updateProductImages(productData.designId, productData.images || []);
        
        // If the product card doesn't exist yet, it will be initialized when it's added to DOM
        // via the MutationObserver
    }

    // Clean up carousels for removed products
    cleanupCarousels() {
        const existingProductIds = new Set();
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const productId = this.getProductId(card);
            existingProductIds.add(productId);
        });

        // Remove carousels for products that no longer exist in DOM
        for (let productId of this.carousels.keys()) {
            if (!existingProductIds.has(productId)) {
                this.carousels.delete(productId);
            }
        }
    }
}

// Initialize carousel system
let productCarousel = null;

function initializeProductCarousels() {
    if (!productCarousel) {
        productCarousel = new ProductCarousel();
        
        // Add global method for other components to notify about new products
        window.updateProductCarousel = function(productData) {
            if (productCarousel) {
                productCarousel.handleNewProduct(productData);
            }
        };
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
