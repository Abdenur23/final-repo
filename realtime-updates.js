class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        this.completedDesigns = new Map();
        this.processedFiles = new Set();
        this.productPrice = 34;
        this.hasDisplayedProduct = false;
        this.completedDesignsCount = 0;
        this.totalExpectedDesigns = 3;
    }

    initialize() {
        this.setupWebSocket();
        this.renderUpdatesPanel();
        this.showPanel();
    }

    setupWebSocket() {
        const WS_URL = 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production';
        this.socket = new WebSocket(WS_URL);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.authenticateWebSocket();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);
                this.handleUpdate(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    authenticateWebSocket() {
        const session = this.getSession();
        if (session && session.access_token) {
            this.socket.send(JSON.stringify({
                action: 'authorize',
                id_token: session.access_token 
            }));
            this.isConnected = true;
        }
    }

    handleUpdate(data) {
        console.log('Processing update:', data);
        
        if (data.type === 'design_ready') {
            this.handleDesignReady(data);
            return;
        }
        
        if (data.type === 'image_update') {
            // Show progress updates regardless of product display status
            const fileKey = data.fileName + '_' + data.stage;
            if (this.processedFiles.has(fileKey)) {
                console.log('Skipping duplicate file update:', fileKey);
                return;
            }
            this.processedFiles.add(fileKey);
            this.updateImageStatus(data);
        }
    }

    handleDesignReady(designData) {
        console.log('Complete design ready:', designData);
        
        const designId = designData.designId;
        if (!this.completedDesigns.has(designId)) {
            this.completedDesigns.set(designId, designData);
            this.completedDesignsCount++;
            this.displayDesign(designData);
            this.removeProgressItem(designId);
            
            // Mark that we've displayed at least one product
            this.hasDisplayedProduct = true;
            
            // Check if all designs are complete
            if (this.completedDesignsCount >= this.totalExpectedDesigns) {
                this.showStartOverButton();
            }
        }
    }

    showStartOverButton() {
        // This will be called from case.html
        if (typeof showStartOverButton === 'function') {
            showStartOverButton();
        }
    }

    updateImageStatus(update) {
        console.log('Individual image update:', update);
        const fileName = update.fileName;
        const stage = update.stage;
        
        let designId = this.extractDesignId(fileName);
        let itemKey = designId || fileName;
        
        let item = this.pendingImages.get(itemKey);
        if (!item) {
            item = this.createProgressItem(itemKey);
            this.pendingImages.set(itemKey, item);
        }
        
        this.updateProgressItem(item, stage, update.timestamp, update.imageUrl);
    }

    extractDesignId(fileName) {
        const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
        return match ? `design_${match[1]}_${match[2]}` : null;
    }

    displayDesign(designData) {
        const container = document.getElementById('realtimeUpdates');
        const designId = designData.designId;
        
        const existingDesign = document.getElementById(`design-${designId}`);
        if (existingDesign) existingDesign.remove();
        
        const productElement = document.createElement('div');
        productElement.id = `design-${designId}`;
        productElement.className = 'product-card';
        
        const paletteName = designData.paletteName || 'Custom Design';
        const imageUrls = Object.values(designData.imageUrls);
        
        const discountedPrice = this.productPrice * (1 - (window.promoDiscount || 0) / 100);
        const displayPrice = (window.promoDiscount > 0) ? discountedPrice : this.productPrice;
        
        productElement.innerHTML = `
            <div class="product-header">
                <h4>${paletteName}</h4>
                <div class="product-price">
                    ${window.promoDiscount > 0 ? 
                        `<span style="text-decoration: line-through; color: #6c757d; margin-right: 8px;">$${this.productPrice.toFixed(2)}</span>
                         <span style="color: #28a745;">$${displayPrice.toFixed(2)}</span>
                         <div style="font-size: 12px; color: #28a745;">${window.promoDiscount}% OFF</div>` :
                        `$${this.productPrice.toFixed(2)}`
                    }
                </div>
            </div>
            
            <div class="design-viewer">
                <div class="main-image-container">
                    <img src="${imageUrls[0]}" alt="${paletteName}" 
                         class="main-image"
                         onload="this.style.opacity='1'" 
                         onerror="this.style.display='none'"
                         style="opacity: 0; transition: opacity 0.3s ease; cursor: pointer;"
                         onclick="realtimeUpdates.openImagePopup('${designId}', 0)" />
                </div>
                <div class="image-navigation">
                    <button class="nav-btn prev-btn" onclick="realtimeUpdates.navigateImage('${designId}', -1)">‹</button>
                    <div class="image-counter">
                        <span class="current-image">1</span> / <span class="total-images">${imageUrls.length}</span>
                    </div>
                    <button class="nav-btn next-btn" onclick="realtimeUpdates.navigateImage('${designId}', 1)">›</button>
                </div>
            </div>
            
            <button class="add-to-cart-btn" onclick="realtimeUpdates.addToCart('${designId}')">
                Add to Cart - $${displayPrice.toFixed(2)}
            </button>
        `;
        
        // Store image URLs for navigation
        productElement._imageUrls = imageUrls;
        productElement._currentImageIndex = 0;
        
        // Add to products container or create one
        let productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) {
            productsContainer = document.createElement('div');
            productsContainer.id = 'productsContainer';
            productsContainer.className = 'products-container';
            container.innerHTML = '<h3>Your Custom Phone Cases</h3>';
            container.appendChild(productsContainer);
        }
        
        productsContainer.appendChild(productElement);
    }

    openImagePopup(designId, imageIndex) {
        const productElement = document.getElementById(`design-${designId}`);
        if (!productElement || !productElement._imageUrls) return;
        
        const imageUrl = productElement._imageUrls[imageIndex];
        
        // Create popup overlay
        const popup = document.createElement('div');
        popup.className = 'image-popup-overlay';
        popup.innerHTML = `
            <div class="image-popup-content">
                <button class="popup-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                <img src="${imageUrl}" alt="Full size preview" class="popup-image">
                <div class="popup-navigation">
                    <button class="nav-btn" onclick="realtimeUpdates.navigatePopupImage('${designId}', ${imageIndex}, -1)">‹</button>
                    <span class="popup-counter">${imageIndex + 1} / ${productElement._imageUrls.length}</span>
                    <button class="nav-btn" onclick="realtimeUpdates.navigatePopupImage('${designId}', ${imageIndex}, 1)">›</button>
                </div>
            </div>
        `;
        
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        popup.querySelector('.image-popup-content').style.cssText = `
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
        `;
        
        popup.querySelector('.popup-image').style.cssText = `
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
        `;
        
        popup.querySelector('.popup-close').style.cssText = `
            position: absolute;
            top: -40px;
            right: 0;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
        `;
        
        popup.querySelector('.popup-navigation').style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-top: 20px;
            color: white;
        `;
        
        document.body.appendChild(popup);
        
        // Close on overlay click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.remove();
        });
    }

    navigatePopupImage(designId, currentIndex, direction) {
        const productElement = document.getElementById(`design-${designId}`);
        if (!productElement || !productElement._imageUrls) return;
        
        const newIndex = (currentIndex + direction + productElement._imageUrls.length) % productElement._imageUrls.length;
        this.openImagePopup(designId, newIndex);
    }

    navigateImage(designId, direction) {
        const productElement = document.getElementById(`design-${designId}`);
        if (!productElement || !productElement._imageUrls) return;
        
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
            mainImage.onclick = () => this.openImagePopup(designId, currentIndex);
            currentImageSpan.textContent = currentIndex + 1;
            mainImage.style.opacity = '1';
        }, 150);
    }

    addToCart(designId) {
        const design = this.completedDesigns.get(designId);
        const paletteName = design.paletteName || 'Custom Design';
        const discountedPrice = this.productPrice * (1 - (window.promoDiscount || 0) / 100);
        const displayPrice = (window.promoDiscount > 0) ? discountedPrice : this.productPrice;
        
        alert(`Added ${paletteName} to cart! Price: $${displayPrice.toFixed(2)}`);
    }

    createProgressItem(itemKey) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.id = `progress-${itemKey}`;
        item.className = 'progress-item';
        
        // Use friendly stage names instead of file names
        const friendlyName = this.getFriendlyStageName(itemKey);
            
        item.innerHTML = `
            <div class="progress-content">
                <div class="file-name">${friendlyName}</div>
                <div class="current-stage">🔄 Processing started...</div>
                <div class="timestamp">${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="image-container"></div>
        `;
        container.appendChild(item);
        return item;
    }

    getFriendlyStageName(itemKey) {
        if (itemKey.includes('design_')) {
            const parts = itemKey.replace('design_', '').split('_');
            return `Creating Design ${parts[0]} - Style ${parts[1]}`;
        }
        
        // Map technical stage names to user-friendly ones
        const stageMap = {
            'upload': '📤 Uploading your image',
            'processing': '🔄 Processing image',
            'analysis': '🔍 Analyzing design',
            'generation': '🎨 Generating phone case',
            'rendering': '📱 Creating 3D preview',
            'finalizing': '✨ Finalizing design'
        };
        
        for (const [tech, friendly] of Object.entries(stageMap)) {
            if (itemKey.toLowerCase().includes(tech)) {
                return friendly;
            }
        }
        
        return '🔄 Processing your design';
    }

    removeProgressItem(designId) {
        const item = document.getElementById(`progress-${designId}`);
        if (item) {
            item.remove();
            this.pendingImages.delete(designId);
        }
    }

    updateProgressItem(item, stage, timestamp, imageUrl) {
        const stageElement = item.querySelector('.current-stage');
        const friendlyStage = this.getFriendlyStageName(stage);
        stageElement.textContent = friendlyStage;
        item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
        
        if (imageUrl) {
            this.addImageToProgressItem(item, imageUrl);
        }
        
        // Add visual feedback for progress
        item.style.borderLeftColor = this.getStageColor(stage);
    }

    getStageColor(stage) {
        const colors = {
            'upload': '#ffc107',
            'processing': '#17a2b8', 
            'analysis': '#6610f2',
            'generation': '#fd7e14',
            'rendering': '#20c997',
            'finalizing': '#28a745'
        };
        
        for (const [tech, color] of Object.entries(colors)) {
            if (stage.toLowerCase().includes(tech)) {
                return color;
            }
        }
        
        return '#6f42c1';
    }

    addImageToProgressItem(item, imageUrl) {
        const imageContainer = item.querySelector('.image-container');
        imageContainer.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Processing preview';
        img.className = 'progress-thumbnail';
        img.onload = () => img.style.opacity = '1';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        imageContainer.appendChild(img);
    }

    getSession() {
        return JSON.parse(localStorage.getItem('cognitoSession'));
    }

    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;

        const uploadSection = document.getElementById('uploadSection');
        const updatesHTML = `
            <div id="realtimePanel" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
                <h3>🔄 Processing Updates</h3>
                <div id="realtimeUpdates" class="updates-container"></div>
            </div>
        `;
        
        if (uploadSection) {
            uploadSection.insertAdjacentHTML('afterend', updatesHTML);
        } else {
            document.body.insertAdjacentHTML('beforeend', updatesHTML);
        }
    }

    showPanel() {
        const panel = document.getElementById('realtimePanel');
        if (panel) panel.style.display = 'block';
    }
}

// Add CSS styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
.products-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    margin-top: 20px;
}
.product-card {
    border: 2px solid #007bff;
    padding: 20px;
    border-radius: 12px;
    background: #f8fbff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
    min-height: 500px;
    display: flex;
    flex-direction: column;
}
.product-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e6f2ff;
}
.product-card h4 {
    margin: 0;
    color: #0056b3;
    font-size: 18px;
    font-weight: 600;
    flex: 1;
    margin-right: 15px;
}
.product-price {
    font-weight: bold;
    color: #28a745;
    font-size: 1.1em;
    text-align: right;
    min-width: 100px;
}
.design-viewer {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.main-image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 10px;
    min-height: 350px;
    max-height: 400px;
}
.main-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    width: auto;
    height: auto;
}
.image-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
}
.nav-btn {
    background: #007bff;
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}
.nav-btn:hover {
    background: #0056b3;
}
.image-counter {
    font-weight: bold;
    color: #555;
    font-size: 14px;
}
.add-to-cart-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 12px 20px;
    text-align: center;
    font-size: 16px;
    margin-top: 15px;
    cursor: pointer;
    border-radius: 6px;
    width: 100%;
    font-weight: 600;
    transition: background 0.2s;
}
.add-to-cart-btn:hover {
    background-color: #218838;
}
.progress-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    margin: 8px 0;
    border-left: 4px solid #ffc107;
    background: #fff8e6;
    border-radius: 6px;
    gap: 15px;
    transition: all 0.3s ease;
}
.progress-content {
    flex: 1;
}
.progress-content .file-name {
    font-weight: bold;
    margin-bottom: 6px;
    color: #333;
}
.progress-content .current-stage {
    color: #007bff;
    font-size: 0.95em;
    font-weight: 500;
}
.progress-content .timestamp {
    color: #666;
    font-size: 0.8em;
    margin-top: 4px;
}
.image-container {
    flex-shrink: 0;
}
.progress-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
}
.updates-container {
    max-height: 600px;
    overflow-y: auto;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .product-card {
        width: 100%;
        max-width: none;
        min-height: 450px;
        padding: 15px;
    }
    .main-image-container {
        min-height: 300px;
        max-height: 350px;
    }
    .product-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    .product-price {
        text-align: left;
    }
}
`;
document.head.appendChild(styleSheet);

// Initialize global promo discount
window.promoDiscount = 0;
