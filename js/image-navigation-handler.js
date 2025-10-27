class ImageNavigationHandler {
    constructor() {
        this.currentPopups = new Set();
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Escape key listener for popups
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllPopups();
            }
        });
    }

    setupProductNavigation(productElement, designId, imageUrls) {
        productElement._imageUrls = imageUrls;
        productElement._currentImageIndex = 0;

        const mainImage = productElement.querySelector('.main-image');
        const prevBtn = productElement.querySelector('.prev-btn');
        const nextBtn = productElement.querySelector('.next-btn');

        mainImage.addEventListener('click', () => 
            this.openImagePopup(designId, productElement._currentImageIndex, imageUrls)
        );

        prevBtn.addEventListener('click', () => 
            this.navigateProductImage(productElement, designId, -1)
        );

        nextBtn.addEventListener('click', () => 
            this.navigateProductImage(productElement, designId, 1)
        );
    }

    navigateProductImage(productElement, designId, direction) {
        if (!productElement._imageUrls) return;
        
        const images = productElement._imageUrls;
        let currentIndex = productElement._currentImageIndex || 0;
        
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = images.length - 1;
        if (currentIndex >= images.length) currentIndex = 0;
        
        productElement._currentImageIndex = currentIndex;
        
        const mainImage = productElement.querySelector('.main-image');
        const currentImageSpan = productElement.querySelector('.current-image');
        
        mainImage.style.opacity = '0';
        setTimeout(() => {
            mainImage.src = images[currentIndex];
            currentImageSpan.textContent = currentIndex + 1;
            mainImage.style.opacity = '1';
        }, 150);
    }

    openImagePopup(designId, imageIndex, imageUrls) {
        this.closeAllPopups();
        
        const popupHtml = window.app.uiManager.createImagePopup(designId, imageIndex, imageUrls);
        document.body.insertAdjacentHTML('beforeend', popupHtml);
        
        const popup = document.querySelector('.image-popup-overlay');
        this.setupPopupNavigation(popup, designId, imageIndex, imageUrls);
        this.currentPopups.add(popup);
    }

    setupPopupNavigation(popup, designId, currentIndex, imageUrls) {
        const closeBtn = popup.querySelector('.popup-close');
        const prevBtn = popup.querySelector('.prev-btn');
        const nextBtn = popup.querySelector('.next-btn');
        const popupImage = popup.querySelector('.popup-image');

        const navigatePopup = (direction) => {
            const newIndex = (currentIndex + direction + imageUrls.length) % imageUrls.length;
            this.closeAllPopups();
            setTimeout(() => this.openImagePopup(designId, newIndex, imageUrls), 50);
        };

        closeBtn.addEventListener('click', () => this.closeAllPopups());
        prevBtn.addEventListener('click', () => navigatePopup(-1));
        nextBtn.addEventListener('click', () => navigatePopup(1));

        popup.addEventListener('click', (e) => {
            if (e.target === popup) this.closeAllPopups();
        });
    }

    closeAllPopups() {
        this.currentPopups.forEach(popup => {
            if (popup && popup.parentNode) {
                popup.remove();
            }
        });
        this.currentPopups.clear();
    }
}
