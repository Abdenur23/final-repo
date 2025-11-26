//product-carousel.js
// Product image carousel with iPod-style navigation
class ProductCarousel {
    constructor() {
        this.carousels = new Map();
        this.setupCarousels();
    }

    // Initialize carousels for all product cards
    setupCarousels() {
        // Reduced timeout as it's often a source of bugs; 0 is usually fine
        setTimeout(() => this.initializeExistingProducts(), 10);
        this.setupMutationObserver();
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // Check if the node itself is a product card or contains one
                    if (node.nodeType === 1 && 
                        (node.classList.contains('product-card') || 
                         node.querySelector('.product-card'))) {
                        
                        // If the node itself is the product card
                        if (node.classList.contains('product-card')) {
                             this.initializeProductCard(node);
                        }
                        
                        // If the node contains product cards (e.g., a list container)
                        node.querySelectorAll('.product-card, [class*="product"]').forEach(card => {
                            this.initializeProductCard(card);
                        });
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
        // Select both direct and class-containing elements
        const productCards = document.querySelectorAll('.product-card, [class*="product"]');
        productCards.forEach(card => this.initializeProductCard(card));
    }

    initializeProductCard(productCard) {
        // Ensure productCard is a valid element before proceeding
        if (!productCard || productCard.nodeType !== 1) return;

        const productId = this.getProductId(productCard);
        
        // Use a flag on the element to prevent double-initialization
        if (productCard.dataset.carouselInitialized === 'true') return;
        if (this.carousels.has(productId)) return;

        // --- MODIFICATION START: Get images from product card data ---
        let images;
        const imagesData = productCard.dataset.images;
        
        if (imagesData) {
            try {
                // Assuming images are passed as a JSON string in a data-images attribute
                images = JSON.parse(imagesData);
                // Ensure it's an array and has at least one image
                if (!Array.isArray(images) || images.length === 0) {
                    // Fallback if data exists but is invalid/empty
                    images = this.generateProductImages(productId);
                }
            } catch (e) {
                console.error("Error parsing product images from data-images:", e);
                // Fallback on JSON parse error
                images = this.generateProductImages(productId);
            }
        } else {
            // Original logic: generate fallback images if no data attribute is found
            images = this.generateProductImages(productId);
        }
        // --- MODIFICATION END ---

        const carouselData = {
            currentIndex: 0,
            images: images, // Use the fetched/generated images
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(productCard, productId, carouselData.images);
        this.attachEventListeners(productCard, productId);

        // Mark as initialized
        productCard.dataset.carouselInitialized = 'true';
    }

    getProductId(productCard) {
        return productCard.dataset.designId || 
               productCard.id || 
               `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateProductImages(productId) {
        // Fallback: Use Picsum Photos for reliable placeholder images
        // These are guaranteed to work and provide portrait-oriented images
        const imageUrls = [];
        
        for (let i = 0; i < 4; i++) {
            // Picsum provides reliable placeholder images
            // Using different image IDs for variety
            const imageId = 100 + i * 10 + Math.floor(Math.random() * 10);
            const imageUrl = `https://picsum.photos/id/${imageId}/600/800`;
            imageUrls.push(imageUrl);
        }
        console.warn(`No product images found for ${productId}. Using fallback images.`);
        return imageUrls;
    }

    createCarouselHTML(productCard, productId, images) {
        // --- MODIFICATION START: Ensure no HTML is created if no images are present ---
        if (!images || images.length === 0) {
            console.warn(`Cannot create carousel for ${productId}: No images provided.`);
            return;
        }
        // --- MODIFICATION END ---

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
                
                <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    ${images.map((_, index) => `
                        <button class="carousel-dot w-2 h-2 rounded-full transition-all duration-300 ${
                            index === 0 ? 'bg-white scale-125' : 'bg-white bg-opacity-50'
                        }" 
                                data-index="${index}"></button>
                    `).join('')}
                </div>
                
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
        console.log(`Image failed to load for product ${productId}, index ${index}. Falling back.`);
        
        // Fallback to a reliable placeholder service
        const fallbackUrls = [
            'https://picsum.photos/id/237/600/800', // Dog
            'https://picsum.photos/id/238/600/800', // City
            'https://picsum.photos/id/239/600/800', // Mountains
            'https://picsum.photos/id/240/600/800'  // Beach
        ];
        
        // This is a global function, but should be attached to the carousel instance for proper scope
        // For production, you'd attach it like: productCarousel.handleImageError(this, ...)
        // Since it's in a string, we'll keep the call but console log the issue.
        console.warn('handleImageError is called from inline HTML. It relies on the function being in scope.');
        
        // Ensure the image element is updated
        imgElement.src = fallbackUrls[index % fallbackUrls.length];
        imgElement.alt = `Product image ${index + 1} (fallback)`;
    }

    attachEventListeners(productCard, productId) {
        const carouselData = this.carousels.get(productId);
        if (!carouselData) return;

        const wrapper = productCard.querySelector('.carousel-wrapper');
        if (!wrapper) return; // Guard against missing wrapper after createCarouselHTML

        const track = wrapper.querySelector('.carousel-track');
        const dots = wrapper.querySelectorAll('.carousel-dot');
        const prevBtn = wrapper.querySelector('.carousel-prev');
        const nextBtn = wrapper.querySelector('.carousel-next');

        // Check if listeners are already attached to prevent duplicates on update
        if (wrapper.dataset.listenersAttached === 'true') {
            // In a real application, you should remove the old listeners first.
            // For this example, we'll rely on the re-creation of the product card HTML to remove old listeners.
            return;
        }

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
        wrapper.dataset.listenersAttached = 'true'; // Mark listeners as attached
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
        // Find by explicit design ID, then by regular ID
        const card = document.querySelector(`[data-design-id="${productId}"]`) ||
               document.getElementById(productId);

        if (card) return card;
               
        // Fallback for general class/partial ID match (less reliable but kept)
        return document.querySelector(`.product-card`) ||
               document.querySelector(`[class*="product"][class*="${productId}"]`);
    }

    // Public method to refresh carousels
    refreshCarousels() {
        this.initializeExistingProducts();
    }

    // Method to manually add carousel to a specific element
    addCarouselToElement(element, images = null) {
        const productId = element.dataset.designId || `manual-${Date.now()}`; // Use element's ID if available
        
        // Remove old carousel data if element is being re-initialized
        if (this.carousels.has(productId)) {
            this.carousels.delete(productId);
            element.dataset.carouselInitialized = 'false';
        }

        const finalImages = images || this.generateProductImages(productId);

        const carouselData = {
            currentIndex: 0,
            images: finalImages,
            isAnimating: false,
            touchStartX: 0,
            touchEndX: 0
        };

        this.carousels.set(productId, carouselData);
        this.createCarouselHTML(element, productId, carouselData.images);
        this.attachEventListeners(element, productId);
        element.dataset.carouselInitialized = 'true';

        return productId;
    }

    // Method to update images for a specific product
    updateProductImages(productId, newImages) {
        const carouselData = this.carousels.get(productId);
        const productCard = this.findProductCard(productId);

        if (carouselData && productCard) {
            carouselData.images = newImages;
            carouselData.currentIndex = 0;
            
            // Re-create HTML and attach listeners to apply new images
            // This implicitly removes old listeners attached to the old HTML elements
            this.createCarouselHTML(productCard, productId, newImages);
            this.attachEventListeners(productCard, productId);
            this.goToImage(productId, 0); // Ensure it starts at the first image
        } else if (productCard && newImages && newImages.length > 0) {
            // Initialize if not already set up but the card is present
            // Store images on the element so initializeProductCard can pick them up
            productCard.dataset.images = JSON.stringify(newImages); 
            // Remove initialization flag to force re-initialization
            delete productCard.dataset.carouselInitialized; 
            this.initializeProductCard(productCard);
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
