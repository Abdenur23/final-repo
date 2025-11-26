// product-carousel.js
// product-carousel.js - UPDATED
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
            
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlide);
            });
            
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        };
        
        const goToPrev = () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        };
        
        const goToNext = () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        };
        
        if (prevBtn) {
            prevBtn.addEventListener('click', goToPrev);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', goToNext);
        }
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
        });
        
        this.setupTouchEvents(carouselElement, goToPrev, goToNext);
        
        this.carousels.set(carouselElement, {
            currentSlide,
            totalSlides,
            updateCarousel,
            goToPrev,
            goToNext
        });
        
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
                    goToNext();
                } else {
                    goToPrev();
                }
            }
            
            isDragging = false;
        });
        
        // Mouse events for desktop
        carouselElement.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            currentX = startX;
            isDragging = true;
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
        });
        
        carouselElement.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
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
