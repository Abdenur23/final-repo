class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        this.completedDesigns = new Map();
        this.processedFiles = new Set();
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
            this.displayProduct(designData);
        } else {
            console.log('Skipping duplicate design:', designId);
        }
    }

    updateImageStatus(update) {
        console.log('Individual image update:', update);
        const fileName = update.fileName;
        const stage = update.stage;
        
        // Only show progress for individual files, skip batched opt-turn files
        if (fileName.startsWith('opt-turn_')) {
            console.log('Skipping progress for batched file:', fileName);
            return;
        }
        
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
        
        // Skip batched files as they'll be handled by design_ready
        if (fileName.startsWith('opt-turn_')) {
            console.log('Skipping individual batched file:', fileName);
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

    displayProduct(designData) {
        const container = document.getElementById('realtimeUpdates');
        const productId = `product-${designData.designId}`;
        
        // Remove existing product with same design ID
        const existingProduct = document.getElementById(productId);
        if (existingProduct) {
            existingProduct.remove();
        }
        
        const productElement = document.createElement('div');
        productElement.id = productId;
        productElement.className = 'product-container';
        
        const designInfo = this.parseDesignId(designData.designId);
        
        productElement.innerHTML = `
            <h4>📱 ${designInfo.paletteName} - ${designInfo.flavorName}</h4>
            <div class="product-images">
                ${Object.entries(designData.imageUrls).map(([viewPrefix, url]) => 
                    `<div class="product-view">
                        <div class="view-label">${this.formatViewName(viewPrefix)}</div>
                        <img src="${url}" alt="${viewPrefix}" 
                             onload="this.style.opacity='1'" 
                             onerror="this.style.display='none'"
                             style="opacity: 0; transition: opacity 0.3s ease;" />
                    </div>`
                ).join('')}
            </div>
            <div class="product-info">
                <div class="product-price">$35.00</div>
                <button class="add-to-cart-btn" onclick="realtimeUpdates.addToCart('${designData.designId}')">
                    Add to Cart
                </button>
            </div>
        `;
        
        container.appendChild(productElement);
    }

    parseDesignId(designId) {
        // design_1_2 -> Palette 1, Flavor 2
        const match = designId.match(/design_(\d+)_(\d+)/);
        if (match) {
            return {
                paletteName: `Palette ${match[1]}`,
                flavorName: `Flavor ${match[2]}`
            };
        }
        return {
            paletteName: 'Custom Design',
            flavorName: 'Phone Case'
        };
    }

    formatViewName(viewPrefix) {
        const viewNames = {
            'opt-turn_006': 'Front View',
            'opt-turn_010': 'Side View', 
            'opt-turn_014': 'Back View'
        };
        return viewNames[viewPrefix] || viewPrefix;
    }

    addToCart(designId) {
        const designInfo = this.parseDesignId(designId);
        console.log(`Adding ${designInfo.paletteName} - ${designInfo.flavorName} to cart - $35.00`);
        alert(`Added ${designInfo.paletteName} - ${designInfo.flavorName} to cart - $35.00`);
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

// Updated CSS for better product display
const styleSheet = document.createElement('style');
styleSheet.textContent = `
.product-container {
    border: 2px solid #4CAF50;
    padding: 20px;
    margin: 20px 0;
    border-radius: 12px;
    background: #f8fff8;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.product-container h4 {
    margin: 0 0 20px 0;
    color: #2c5aa0;
    font-size: 22px;
    font-weight: 600;
}
.product-images {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 20px;
}
.product-view {
    text-align: center;
    flex: 1;
    min-width: 150px;
    max-width: 200px;
}
.view-label {
    font-weight: bold;
    margin-bottom: 10px;
    color: #555;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.product-view img {
    width: 100%;
    height: 300px;
    object-fit: contain;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.product-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-top: 15px;
}
.product-price {
    font-size: 28px;
    font-weight: bold;
    color: #2c5aa0;
}
.add-to-cart-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}
.add-to-cart-btn:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}
.progress-item {
    padding: 12px;
    margin: 8px 0;
    border-left: 4px solid #007bff;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.progress-item img {
    border: 1px solid #ddd;
    border-radius: 4px;
}
.updates-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
