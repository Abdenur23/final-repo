class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.completedDesigns = new Map();
        this.pendingImages = new Map();
        this.productPrice = 35;
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
            console.log('WS connected');
            this.authenticateWebSocket();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleUpdate(data);
            } catch (error) {
                console.error('Error parsing WS message:', error);
            }
        };

        this.socket.onclose = () => {
            console.log('WS disconnected');
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    authenticateWebSocket() {
        const session = JSON.parse(localStorage.getItem('cognitoSession'));
        if (session && session.id_token) {
            this.socket.send(JSON.stringify({ action: 'authorize', id_token: session.id_token }));
        }
    }

    handleUpdate(data) {
        switch(data.type) {
            case 'design_ready':
                this.handleDesignReady(data);
                break;
            case 'status_update': // For all progress updates
                this.updateStatus(data);
                break;
        }
    }

    handleDesignReady(designData) {
        const designId = designData.designId;
        if (!this.completedDesigns.has(designId)) {
            this.completedDesigns.set(designId, designData);
            this.displayDesign(designData);
            this.removeProgressItem(designId);
        }
    }

    updateStatus(update) {
        // Determine the ID for progress tracking (use designId for batched files)
        const isBatchFile = update.fileName.startsWith('opt-turn_');
        let itemKey = isBatchFile ? this.extractDesignId(update.fileName) : update.fileName;
        
        // Skip updates for batched files that aren't yet grouped
        if (!itemKey) return; 

        let item = this.pendingImages.get(itemKey);
        if (!item) {
            item = this.createProgressItem(itemKey);
            this.pendingImages.set(itemKey, item);
        }
        this.updateProgressItem(item, update.stage, update.timestamp);
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
        
        const match = designId.match(/design_(\d+)_(\d+)/);
        const title = match ? `Case: Color ${match[1]} / Flavor ${match[2]}` : 'Custom Case';
        
        productElement.innerHTML = `
            <div class="product-header">
                <h4>✅ ${title}</h4>
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
            
            <button class="add-to-cart-btn" onclick="alert('Added ${title} to cart!')">
                Add to Cart
            </button>
        `;
        
        container.prepend(productElement);
    }

    formatViewName(viewPrefix) {
        const viewNames = {
            'opt-turn_006': 'Front View',
            'opt-turn_010': 'Side View', 
            'opt-turn_014': 'Back View'
        };
        return viewNames[viewPrefix] || viewPrefix;
    }

    createProgressItem(itemKey) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.id = `progress-${itemKey}`; 
        item.className = 'progress-item';
        
        const friendlyName = itemKey.startsWith('design_') 
            ? `Design Batch ${itemKey.match(/\d+/g).join('/')}`
            : this.formatFileName(itemKey);
            
        item.innerHTML = `
            <div class="file-name">Processing: ${friendlyName}</div>
            <div class="current-stage">Starting...</div>
            <div class="timestamp"></div>
        `;
        container.appendChild(item);
        return item;
    }

    removeProgressItem(itemKey) {
        const item = document.getElementById(`progress-${itemKey}`);
        if (item) {
            item.remove();
            this.pendingImages.delete(itemKey);
        }
    }

    updateProgressItem(item, stage, timestamp) {
        item.querySelector('.current-stage').textContent = stage;
        item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
    }

    formatFileName(name) {
        const filename = name.split('/').pop();
        return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
    }

    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;
        const updatesHTML = `
            <div id="realtimePanel" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
                <h3>🔄 Processing Updates and New Products</h3>
                <div id="realtimeUpdates" class="updates-container"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', updatesHTML);
    }

    showPanel() {
        const panel = document.getElementById('realtimePanel');
        if (panel) panel.style.display = 'block';
    }
}

// Add CSS styles (Slightly adjusted for phone case dimensions)
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
    font-size: 18px;
}
.product-price {
    font-weight: bold;
    color: #28a745;
    font-size: 1.2em;
}
.design-views {
    display: flex;
    gap: 20px; 
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 15px;
}
.case-view-container { 
    text-align: center;
    width: 100px; /* Width of the phone case image container */
    height: 200px; /* Height of the phone case image container */
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
    width: 100px; /* Fixed width to resemble phone case (portrait) */
    height: 150px; /* Fixed height to resemble phone case (portrait) */
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
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box; /* Ensures padding is included in width */
}
.progress-item {
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #ffc107;
    background: #fff8e6;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
}
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
