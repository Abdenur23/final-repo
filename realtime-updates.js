class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        this.completedDesigns = new Map();
        this.processedFiles = new Set();
        this.pendingBatches = new Map(); // Track incomplete batches
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
        
        const fileKey = data.fileName + '_' + data.stage;
        if (this.processedFiles.has(fileKey)) {
            console.log('Skipping duplicate file update:', fileKey);
            return;
        }
        this.processedFiles.add(fileKey);
        
        switch(data.type) {
            case 'design_ready':
                this.handleDesignReady(data);
                break;
            case 'image_update':
                this.updateImageStatus(data);
                break;
        }
    }

    handleDesignReady(designData) {
        console.log('Complete design ready:', designData);
        
        const designId = designData.designId;
        if (!this.completedDesigns.has(designId)) {
            this.completedDesigns.set(designId, designData);
            this.displayDesignAsProduct(designData);
        } else {
            console.log('Skipping duplicate design:', designId);
        }
    }

    updateImageStatus(update) {
        console.log('Individual image update:', update);
        const fileName = update.fileName;
        const stage = update.stage;
        
        if (stage === 'Mockup ready' && update.imageUrl) {
            this.handleIndividualMockup(update);
            return;
        }
        
        let item = this.pendingImages.get(fileName);
        if (!item) {
            item = this.createProgressItem(fileName);
            this.pendingImages.set(fileName, item);
        }
        this.updateProgressItem(item, stage, update.timestamp);
    }

    handleIndividualMockup(update) {
        console.log('Individual mockup ready:', update);
        const fileName = update.fileName;
        
        // Handle batched images (opt-turn files)
        if (fileName.startsWith('opt-turn_')) {
            this.handleBatchImage(update);
            return;
        }
        
        let item = this.pendingImages.get(fileName);
        if (!item) {
            item = this.createProgressItem(fileName);
            this.pendingImages.set(fileName, item);
        }
        
        this.updateProgressItem(item, 'Mockup ready', update.timestamp);
        
        if (!item.querySelector('img')) {
            const img = document.createElement('img');
            img.src = update.imageUrl;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.marginTop = '10px';
            img.onload = () => img.style.opacity = '1';
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            item.appendChild(img);
        }
    }

    handleBatchImage(update) {
        const fileName = update.fileName;
        const baseName = this.extractBaseName(fileName);
        const prefix = this.extractPrefix(fileName);
        
        if (!this.pendingBatches.has(baseName)) {
            this.pendingBatches.set(baseName, {
                images: new Map(),
                designId: this.extractDesignId(fileName)
            });
        }
        
        const batch = this.pendingBatches.get(baseName);
        batch.images.set(prefix, {
            url: update.imageUrl,
            fileName: fileName
        });
        
        // Check if we have all three views for a complete product
        if (batch.images.size === 3) {
            this.createProductFromBatch(batch, baseName);
            this.pendingBatches.delete(baseName);
        }
    }

    extractBaseName(fileName) {
        const match = fileName.match(/opt-turn_\d+_(.+)/);
        return match ? match[1] : fileName;
    }

    extractPrefix(fileName) {
        const match = fileName.match(/(opt-turn_\d+)_/);
        return match ? match[1] : fileName;
    }

    extractDesignId(fileName) {
        const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
        return match ? `design_${match[1]}_${match[2]}` : `design_${Date.now()}`;
    }

    createProductFromBatch(batch, baseName) {
        const designData = {
            designId: batch.designId,
            imageUrls: Object.fromEntries(batch.images),
            timestamp: new Date().toISOString()
        };
        
        if (!this.completedDesigns.has(designData.designId)) {
            this.completedDesigns.set(designData.designId, designData);
            this.displayDesignAsProduct(designData);
        }
    }

    displayDesignAsProduct(designData) {
        const container = document.getElementById('realtimeUpdates');
        const designId = designData.designId;
        
        const existingDesign = document.getElementById(`product-${designId}`);
        if (existingDesign) {
            existingDesign.remove();
        }
        
        const productElement = document.createElement('div');
        productElement.id = `product-${designId}`;
        productElement.className = 'product-container';
        
        productElement.innerHTML = `
            <h4>Phone Case Design</h4>
            <div class="product-views">
                ${Object.entries(designData.imageUrls).map(([view, url]) => 
                    `<div class="view-container">
                        <img src="${url}" alt="${view}" 
                             onload="this.style.opacity='1'" 
                             style="opacity: 0; transition: opacity 0.3s ease;" />
                    </div>`
                ).join('')}
            </div>
            <div class="product-info">
                <div class="product-price">$35.00</div>
                <button class="add-to-cart-btn" onclick="window.realtimeUpdates.addToCart('${designId}')">
                    Add to Cart
                </button>
            </div>
        `;
        
        container.appendChild(productElement);
    }

    addToCart(designId) {
        const design = this.completedDesigns.get(designId);
        if (design) {
            console.log('Adding to cart:', designId, design);
            // TODO: Integrate with your cart system
            alert(`Added ${designId} to cart! Price: $35.00`);
        }
    }

    createProgressItem(fileName) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
            <div class="file-name">${this.formatFileName(fileName)}</div>
            <div class="current-stage">Starting...</div>
            <div class="timestamp"></div>
        `;
        container.appendChild(item);
        return item;
    }

    updateProgressItem(item, stage, timestamp) {
        const stageElement = item.querySelector('.current-stage');
        stageElement.textContent = stage;
        item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
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
.product-container {
    border: 2px solid #4CAF50;
    padding: 20px;
    margin: 15px 0;
    border-radius: 8px;
    background: #f8fff8;
    max-width: 600px;
}
.product-container h4 {
    margin: 0 0 15px 0;
    color: #2c5aa0;
    font-size: 20px;
    text-align: center;
}
.product-views {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 15px;
}
.view-container {
    text-align: center;
    flex: 1;
    max-width: 180px;
}
.view-container img {
    width: 100%;
    height: 300px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 5px;
    background: white;
}
.product-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid #eee;
}
.product-price {
    font-size: 24px;
    font-weight: bold;
    color: #2c5aa0;
}
.add-to-cart-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
.add-to-cart-btn:hover {
    background: #45a049;
}
.progress-item {
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #007bff;
    background: white;
    border-radius: 4px;
}
.progress-item img {
    border: 1px solid #ddd;
    border-radius: 4px;
}
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
