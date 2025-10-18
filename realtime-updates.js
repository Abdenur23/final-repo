class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        this.completedDesigns = new Map();
        this.processedFiles = new Set();
        this.productPrice = 34; // Updated to 34$ as requested
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
        
        // Handle design_ready messages (batched product with all views)
        if (data.type === 'design_ready') {
            this.handleDesignReady(data);
            return;
        }
        
        // Handle individual image updates
        if (data.type === 'image_update') {
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
        // Only process if we haven't seen this design yet
        if (!this.completedDesigns.has(designId)) {
            this.completedDesigns.set(designId, designData);
            this.displayDesign(designData);
            
            // Remove the progress item once the design is displayed
            this.removeProgressItem(designId);
        }
    }

    updateImageStatus(update) {
        console.log('Individual image update:', update);
        const fileName = update.fileName;
        const stage = update.stage;
        
        // For batched files, use design ID for progress tracking
        let designId = this.extractDesignId(fileName);
        let itemKey = designId || fileName;
        
        let item = this.pendingImages.get(itemKey);
        if (!item) {
            item = this.createProgressItem(itemKey);
            this.pendingImages.set(itemKey, item);
        }
        
        this.updateProgressItem(item, stage, update.timestamp);
        
        // Show individual mockup image only for non-batched files
        if (stage === 'Mockup ready' && update.imageUrl && !fileName.startsWith('opt-turn_')) {
            this.addImageToProgressItem(item, update.imageUrl, fileName);
        }
    }

    addImageToProgressItem(item, imageUrl, fileName) {
        if (!item.querySelector('img')) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = fileName;
            img.className = 'progress-thumbnail';
            img.onload = () => img.style.opacity = '1';
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            
            item.appendChild(img);
        }
    }

    extractDesignId(fileName) {
        const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
        return match ? `design_${match[1]}_${match[2]}` : null;
    }

    displayDesign(designData) {
        const container = document.getElementById('realtimeUpdates');
        const designId = designData.designId;
        
        // Remove any existing design with same ID
        const existingDesign = document.getElementById(`design-${designId}`);
        if (existingDesign) {
            existingDesign.remove();
        }
        
        const productElement = document.createElement('div');
        productElement.id = `design-${designId}`;
        productElement.className = 'product-card';
        
        const match = designId.match(/design_(\d+)_(\d+)/);
        const title = match 
            ? `Phone Case - Color ${match[1]}, Style ${match[2]}`
            : 'Custom Phone Case';
        
        productElement.innerHTML = `
            <div class="product-header">
                <h4>${title}</h4>
                <div class="product-price">$${this.productPrice.toFixed(2)}</div>
            </div>
            
            <div class="design-views">
                ${Object.entries(designData.imageUrls).map(([view, url]) => 
                    `<div class="case-view-container">
                        <div class="view-label">${this.formatViewName(view)}</div>
                        <img src="${url}" alt="${this.formatViewName(view)}" 
                             onload="this.style.opacity='1'" 
                             onerror="this.style.display='none'"
                             style="opacity: 0; transition: opacity 0.3s ease;" />
                    </div>`
                ).join('')}
            </div>
            
            <button class="add-to-cart-btn" onclick="realtimeUpdates.addToCart('${designId}')">
                Add to Cart - $${this.productPrice.toFixed(2)}
            </button>
        `;
        
        container.prepend(productElement);
    }

    addToCart(designId) {
        const design = this.completedDesigns.get(designId);
        const title = designId.replace('design_', 'Design ').replace('_', ' - ');
        alert(`Added ${title} to cart! Price: $${this.productPrice.toFixed(2)}`);
        // Add your cart logic here
    }

    formatViewName(viewPrefix) {
        const viewNames = {
            'opt-turn_006': 'Front',
            'opt-turn_010': 'Side', 
            'opt-turn_014': 'Back'
        };
        return viewNames[viewPrefix] || viewPrefix;
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
            <div class="file-name">${friendlyName}</div>
            <div class="current-stage">Starting...</div>
            <div class="timestamp"></div>
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
.product-card {
    border: 2px solid #007bff;
    padding: 15px;
    margin: 15px 0;
    border-radius: 8px;
    background: #eef7ff;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.product-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #cceeff;
}
.product-card h4 {
    margin: 0;
    color: #0056b3;
    font-size: 16px;
}
.product-price {
    font-weight: bold;
    color: #28a745;
    font-size: 1.1em;
}
.design-views {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 15px;
}
.case-view-container {
    text-align: center;
    width: 100px;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.view-label {
    font-size: 0.8em;
    font-weight: bold;
    margin-bottom: 5px;
    color: #555;
}
.case-view-container img {
    width: 100%;
    height: 160px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px;
    background: white;
}
.add-to-cart-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin-top: 10px;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
}
.progress-item {
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #ffc107;
    background: #fff8e6;
    border-radius: 4px;
}
.progress-thumbnail {
    max-width: 50px;
    max-height: 50px;
    margin-top: 5px;
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
