// product-carousel.js
class ProductCarousel {
    constructor() {
        this.carousels = new Map();
    }

    initializeCarousel(carouselElement) {
        const track = carouselElement.querySelector('.carousel-track');
        const slides = carouselElement.querySelectorAll('.carousel-slide');
        const prevBtn = carouselElement.querySelector('.carousel-prev');
        const nextBtn = carouselElement.querySelector('.carousel-next');
        const dots = carouselElement.querySelectorAll('.carousel-dot');
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        
        if (totalSlides <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (dots.length > 0) dots[0].parentElement.style.display = 'none';
            return;
        }
        
        const updateCarousel = () => {
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Update active states
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        };
        
        // Navigation event handlers
        const goToPrev = () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        };
        
        const goToNext = () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        };
        
        // Event listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', goToPrev);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', goToNext);
        }
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
        });
        
        // Touch/swipe support
        this.setupTouchEvents(carouselElement, goToPrev, goToNext);
        
        // Store carousel state
        this.carousels.set(carouselElement, {
            currentSlide,
            totalSlides,
            updateCarousel,
            goToPrev,
            goToNext
        });
        
        // Initial update
        updateCarousel();
    }

    setupTouchEvents(carouselElement, goToPrev, goToNext) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        carouselElement.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            currentX = startX;
            isDragging = true;
            carouselElement.style.cursor = 'grabbing';
        });
        
        carouselElement.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        });
        
        carouselElement.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diff = startX - currentX;
            const swipeThreshold = 50;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    goToNext(); // Swipe left - next
                } else {
                    goToPrev(); // Swipe right - previous
                }
            }
            
            isDragging = false;
            carouselElement.style.cursor = 'grab';
        });
        
        // Mouse events for desktop
        carouselElement.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            currentX = startX;
            isDragging = true;
            carouselElement.style.cursor = 'grabbing';
        });
        
        carouselElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            currentX = e.clientX;
        });
        
        carouselElement.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            const diff = startX - currentX;
            const swipeThreshold = 50;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    goToNext();
                } else {
                    goToPrev();
                }
            }
            
            isDragging = false;
            carouselElement.style.cursor = 'grab';
        });
        
        carouselElement.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                carouselElement.style.cursor = 'grab';
            }
        });
        
        carouselElement.style.cursor = 'grab';
    }

    initializeAllCarousels() {
        const carousels = document.querySelectorAll('.product-carousel');
        carousels.forEach(carousel => {
            this.initializeCarousel(carousel);
        });
    }

    destroyCarousel(carouselElement) {
        this.carousels.delete(carouselElement);
    }

    destroyAllCarousels() {
        this.carousels.clear();
    }
}
