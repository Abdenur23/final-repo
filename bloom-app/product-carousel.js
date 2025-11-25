//product-carousel.js
// Product image carousel with iPod-style navigation
class ProductCarousel {
    constructor() {
        this.carousels = new Map();
        this.setupCarousels();
    }

    // Initialize carousels for all product cards
    setupCarousels() {
        // This will be called when products are rendered
        setTimeout(() => this.initializeExistingProducts(), 100);
        
        // Observe DOM changes for dynamically added products
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

        const carouselData = {
            currentIndex: 0,
            images: this.generateProductImages(productId),
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(productCard, productId, carouselData.images);
        this.attachEventListeners(productCard, productId);
    }

    getProductId(productCard) {
        // Try to find designId from data attribute or generate one
        return productCard.dataset.designId || 
               productCard.id || 
               `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateProductImages(productId) {
        // Generate 4 unique portrait-oriented images from Unsplash
        const imageUrls = [];
        const categories = ['portrait', 'face', 'person', 'flower', 'art', 'nature', 'fashion', 'beauty'];
        
        for (let i = 0; i < 4; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const imageUrl = `https://images.unsplash.com/photo-${this.getRandomUnsplashId()}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=800&q=80`;
            imageUrls.push(imageUrl);
        }

        return imageUrls;
    }

    getRandomUnsplashId() {
        // Some realistic-looking Unsplash photo IDs for portrait images
        const photoIds = [
            '1567532939604-f6f0a6d3b6c0', '1573496359142-b8d87734a5a5', '1580489944761-15a19d654956',
            '1544005313-94ddf0286df2', '1531746020798-2c61255d53d7', '1517841905240-472988babdf9',
            '1534528741772-539b2c9c5c66', '1507003211169-0a1dd7228f2d', '1494790108377-be9c29b29330',
            '1519699047746-7c6d6d6e6c6f', '1531123897726-4b0e0c5c8a8a', '1508214751736-68fb27d0c65f'
        ];
        return photoIds[Math.floor(Math.random() * photoIds.length)];
    }

    createCarouselHTML(productCard, productId, images) {
        // Find the product image container or create one
        let imageContainer = productCard.querySelector('.product-image-container');
        
        if (!imageContainer) {
            // Look for existing placeholder or create new container
            const placeholder = productCard.querySelector('.bg-gray-100, [class*="placeholder"], [class*="preview"]');
            if (placeholder) {
                imageContainer = placeholder;
                imageContainer.innerHTML = ''; // Clear placeholder content
                imageContainer.classList.add('product-image-container');
            } else {
                imageContainer = document.createElement('div');
                imageContainer.className = 'product-image-container bg-gray-100 rounded-md overflow-hidden relative';
                productCard.insertBefore(imageContainer, productCard.querySelector('button') || productCard.firstChild);
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
                                 onerror="this.style.display='none'">
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
        // Find product card by various possible selectors
        return document.querySelector(`[data-design-id="${productId}"]`) ||
               document.getElementById(productId) ||
               document.querySelector(`.product-card`) ||
               document.querySelector(`[class*="product"][class*="${productId}"]`);
    }

    // Public method to refresh carousels (call this after rendering products)
    refreshCarousels() {
        this.initializeExistingProducts();
    }

    // Method to manually add carousel to a specific element
    addCarouselToElement(element, images = null) {
        const productId = `manual-${Date.now()}`;
        const carouselData = {
            currentIndex: 0,
            images: images || this.generateProductImages(productId),
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(element, productId, carouselData.images);
        this.attachEventListeners(element, productId);

        return productId;
    }
}

// Initialize carousel system when DOM is ready
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
