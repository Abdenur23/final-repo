class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        this.completedDesigns = new Map();
        this.processedFiles = new Set();
        this.productPrice = 34;
        this.hasDisplayedProduct = false;
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
        if (session && session.id_token) {
            this.socket.send(JSON.stringify({
                action: 'authorize',
                id_token: session.id_token
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
            // Only show progress updates if no products have been displayed yet
            if (!this.hasDisplayedProduct) {
                const fileKey = data.fileName + '_' + data.stage;
                if (this.processedFiles.has(fileKey)) {
                    console.log('Skipping duplicate file update:', fileKey);
                    return;
                }
                this.processedFiles.add(fileKey);
                this.updateImageStatus(data);
            }
        }
    }

    handleDesignReady(designData) {
        console.log('Complete design ready:', designData);
        
        const designId = designData.designId;
        if (!this.completedDesigns.has(designId)) {
            this.completedDesigns.set(designId, designData);
            this.displayDesign(designData);
            this.removeProgressItem(designId);
            
            // Mark that we've displayed at least one product
            this.hasDisplayedProduct = true;
            
            // Clear all progress updates once we have products
            this.clearAllProgressUpdates();
        }
    }

    clearAllProgressUpdates() {
        const container = document.getElementById('realtimeUpdates');
        const progressItems = container.querySelectorAll('.progress-item');
        progressItems.forEach(item => item.remove());
        this.pendingImages.clear();
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
        
        productElement.innerHTML = `
            <div class="product-header">
                <h4>${paletteName}</h4>
                <div class="product-price">$${this.productPrice.toFixed(2)}</div>
            </div>
            
            <div class="design-viewer">
                <div class="main-image-container">
                    <img src="${imageUrls[0]}" alt="${paletteName}" 
                         class="main-image"
                         onload="this.style.opacity='1'" 
                         onerror="this.style.display='none'"
                         style="opacity: 0; transition: opacity 0.3s ease;" />
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
                Add to Cart - $${this.productPrice.toFixed(2)}
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
            currentImageSpan.textContent = currentIndex + 1;
            mainImage.style.opacity = '1';
        }, 150);
    }

    addToCart(designId) {
        const design = this.completedDesigns.get(designId);
        const paletteName = design.paletteName || 'Custom Design';
        alert(`Added ${paletteName} to cart! Price: $${this.productPrice.toFixed(2)}`);
    }

    createProgressItem(itemKey) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.id = `progress-${itemKey}`;
        item.className = 'progress-item';
        
        const friendlyName = itemKey.startsWith('design_') 
            ? `Phone Case: ${itemKey.replace('design_', '').replace('_', ' - ')}`
            : this.formatFileName(itemKey);
            
        item.innerHTML = `
            <div class="progress-content">
                <div class="file-name">${friendlyName}</div>
                <div class="current-stage">Starting...</div>
                <div class="timestamp"></div>
            </div>
            <div class="image-container"></div>
        `;
        container.appendChild(item);
        return item;
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
        stageElement.textContent = stage;
        item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
        
        if (imageUrl) {
            this.addImageToProgressItem(item, imageUrl);
        }
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

    formatFileName(name) {
        const filename = name.split('/').pop();
        return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
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
    width: 320px;
    min-height: 400px;
    display: flex;
    flex-direction: column;
}
.product-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e6f2ff;
}
.product-card h4 {
    margin: 0;
    color: #0056b3;
    font-size: 18px;
    font-weight: 600;
}
.product-price {
    font-weight: bold;
    color: #28a745;
    font-size: 1.2em;
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
    min-height: 300px;
}
.main-image {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
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
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #ffc107;
    background: #fff8e6;
    border-radius: 4px;
    gap: 15px;
}
.progress-content {
    flex: 1;
}
.progress-content .file-name {
    font-weight: bold;
    margin-bottom: 5px;
}
.progress-content .current-stage {
    color: #007bff;
    font-size: 0.9em;
}
.progress-content .timestamp {
    color: #666;
    font-size: 0.8em;
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
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
