class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        this.completedDesigns = new Map();
        this.processedFiles = new Set();
        this.colorBatches = new Map(); // Track batches by color
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
        
        // Extract color from filename (assuming format like "color_red_view1.jpg")
        const colorMatch = fileName.match(/(?:color[_-]?)([^_]+)/i);
        const color = colorMatch ? colorMatch[1] : 'default';
        
        if (fileName.startsWith('opt-turn_')) {
            console.log('Skipping individual opt-turn file, waiting for batch:', fileName);
            return;
        }
        
        // Add to color batch
        if (!this.colorBatches.has(color)) {
            this.colorBatches.set(color, []);
        }
        this.colorBatches.get(color).push(update);
        
        // Check if we have a complete batch (3 views: front, side, back)
        const batch = this.colorBatches.get(color);
        if (batch.length >= 3) {
            this.createProductFromBatch(color, batch);
            this.colorBatches.delete(color);
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

    createProductFromBatch(color, batch) {
        const productData = {
            color: color,
            imageUrls: {},
            timestamp: new Date().toISOString()
        };
        
        // Organize images by view type
        batch.forEach(update => {
            const viewType = this.determineViewType(update.fileName);
            productData.imageUrls[viewType] = update.imageUrl;
        });
        
        this.displayProduct(productData);
    }

    determineViewType(fileName) {
        if (fileName.includes('front') || fileName.includes('006')) return 'front';
        if (fileName.includes('side') || fileName.includes('010')) return 'side';
        if (fileName.includes('back') || fileName.includes('014')) return 'back';
        return 'unknown';
    }

    displayDesignAsProduct(designData) {
        const productData = {
            color: this.extractColorFromDesignId(designData.designId),
            imageUrls: designData.imageUrls,
            timestamp: new Date().toISOString()
        };
        this.displayProduct(productData);
    }

    extractColorFromDesignId(designId) {
        const colorMatch = designId.match(/(?:color[_-]?)([^_]+)/i);
        return colorMatch ? colorMatch[1] : 'design-' + designId;
    }

    displayProduct(productData) {
        const container = document.getElementById('realtimeUpdates');
        const productId = `product-${productData.color}-${Date.now()}`;
        
        const productElement = document.createElement('div');
        productElement.id = productId;
        productElement.className = 'product-container';
        
        productElement.innerHTML = `
            <h4>📱 ${this.formatColorName(productData.color)} Phone Case</h4>
            <div class="product-images">
                ${Object.entries(productData.imageUrls).map(([view, url]) => 
                    `<div class="product-view">
                        <div class="view-label">${this.formatViewName(view)}</div>
                        <img src="${url}" alt="${view}" 
                             onload="this.style.opacity='1'" 
                             onerror="this.style.display='none'"
                             style="opacity: 0; transition: opacity 0.3s ease;" />
                    </div>`
                ).join('')}
            </div>
            <div class="product-price">$35.00</div>
            <button class="add-to-cart-btn" onclick="realtimeUpdates.addToCart('${productData.color}')">
                Add to Cart
            </button>
        `;
        
        container.appendChild(productElement);
    }

    formatColorName(color) {
        return color.charAt(0).toUpperCase() + color.slice(1);
    }

    formatViewName(view) {
        const viewNames = {
            'front': 'Front View',
            'side': 'Side View',
            'back': 'Back View',
            'opt-turn_006': 'Front View',
            'opt-turn_010': 'Side View', 
            'opt-turn_014': 'Back View'
        };
        return viewNames[view] || view;
    }

    addToCart(color) {
        console.log(`Adding ${color} phone case to cart - $35.00`);
        // Add your cart integration logic here
        alert(`Added ${this.formatColorName(color)} Phone Case to cart - $35.00`);
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

// Updated CSS styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
.product-container {
    border: 2px solid #4CAF50;
    padding: 20px;
    margin: 15px 0;
    border-radius: 8px;
    background: #f8fff8;
    text-align: center;
}
.product-container h4 {
    margin: 0 0 15px 0;
    color: #2c5aa0;
    font-size: 20px;
}
.product-images {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 15px;
}
.product-view {
    text-align: center;
    flex: 1;
    min-width: 120px;
    max-width: 180px;
}
.view-label {
    font-weight: bold;
    margin-bottom: 8px;
    color: #555;
    font-size: 14px;
}
.product-view img {
    width: 100%;
    height: 200px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 5px;
    background: white;
}
.product-price {
    font-size: 24px;
    font-weight: bold;
    color: #2c5aa0;
    margin: 10px 0;
}
.add-to-cart-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s ease;
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
