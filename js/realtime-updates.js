class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.completedDesigns = new Map();
        this.progressItems = new Map();
    }

    initialize() {
        this.setupWebSocket();
        this.renderUpdatesPanel();
    }

    setupWebSocket() {
        this.socket = new WebSocket(CONFIG.API.WS_URL);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.authenticateWebSocket();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleUpdate(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        this.socket.onclose = () => {
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    authenticateWebSocket() {
        const session = getSession();
        if (session?.access_token) {
            this.socket.send(JSON.stringify({
                action: 'authorize',
                id_token: session.access_token
            }));
        }
    }

    handleUpdate(data) {
        if (data.type === 'design_ready') {
            this.handleDesignReady(data);
        } else if (data.type === 'image_update') {
            this.handleProgressUpdate(data);
        }
    }

    handleProgressUpdate(update) {
        if (this.completedDesigns.size >= CONFIG.PRODUCT.REQUIRED_DESIGNS) return;

        const designId = this.extractDesignId(update.fileName) || 'design';
        let item = this.progressItems.get(designId);
        
        if (!item) {
            item = this.createProgressItem(designId);
            this.progressItems.set(designId, item);
        }
        
        this.updateProgressItem(item, update.stage, update.timestamp);
    }

    handleDesignReady(designData) {
        const designId = designData.designId;
        if (!this.completedDesigns.has(designId)) {
            this.completedDesigns.set(designId, designData);
            this.displayDesign(designData);
            this.removeProgressItem(designId);
            this.checkAllDesignsComplete();
        }
    }

    createProgressItem(designId) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.id = `progress-${designId}`;
        item.className = 'progress-item';
        
        item.innerHTML = `
            <div class="progress-stages">
                <div class="stage" data-stage="uploading">Uploading</div>
                <div class="stage" data-stage="processing">Processing</div>
                <div class="stage" data-stage="generating">Generating</div>
                <div class="stage" data-stage="finalizing">Finalizing</div>
            </div>
            <div style="font-size: 12px; color: #666; text-align: right;"></div>
        `;
        
        container.appendChild(item);
        return item;
    }

    updateProgressItem(item, currentStage, timestamp) {
        const stages = item.querySelectorAll('.stage');
        const timestampEl = item.querySelector('div:last-child');
        
        stages.forEach(stage => {
            stage.classList.remove('active', 'completed');
            if (stage.dataset.stage === currentStage.toLowerCase()) {
                stage.classList.add('active');
            }
        });
        
        timestampEl.textContent = new Date(timestamp).toLocaleTimeString();
    }

    displayDesign(designData) {
        const designId = designData.designId;
        const container = document.getElementById('realtimeUpdates');
        const imageUrls = Object.values(designData.imageUrls);
        
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h4 style="margin: 0;">${designData.paletteName || 'Custom Design'}</h4>
                <div style="font-weight: bold; color: #28a745;">$${CONFIG.PRODUCT.PRICE}</div>
            </div>
            <img src="${imageUrls[0]}" class="product-image" onclick="realtimeUpdates.openModal('${imageUrls[0]}')">
            <div class="image-thumbnails">
                ${imageUrls.map(url => 
                    `<img src="${url}" class="thumbnail" onclick="realtimeUpdates.openModal('${url}')">`
                ).join('')}
            </div>
            <button class="add-to-cart-btn" onclick="realtimeUpdates.addToCart('${designId}')">
                Add to Cart - $${CONFIG.PRODUCT.PRICE}
            </button>
        `;
        
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

    openModal(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.onclick = () => modal.remove();
        modal.innerHTML = `<img src="${imageUrl}" class="modal-image">`;
        document.body.appendChild(modal);
    }

    checkAllDesignsComplete() {
        if (this.completedDesigns.size >= CONFIG.PRODUCT.REQUIRED_DESIGNS) {
            this.showStartOverButton();
            document.getElementById('uploadSection').style.display = 'none';
        }
    }

    showStartOverButton() {
        const container = document.getElementById('realtimeUpdates');
        const button = document.createElement('button');
        button.textContent = 'Start Over';
        button.style.cssText = 'padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 20px 0;';
        button.onclick = () => this.startOver();
        container.appendChild(button);
    }

    startOver() {
        this.completedDesigns.clear();
        this.progressItems.clear();
        
        const container = document.getElementById('realtimeUpdates');
        container.innerHTML = '<h3>🔄 Processing Updates</h3>';
        
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadResult').innerHTML = '';
    }

    removeProgressItem(designId) {
        const item = document.getElementById(`progress-${designId}`);
        if (item) item.remove();
        this.progressItems.delete(designId);
    }

    extractDesignId(fileName) {
        const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
        return match ? `design_${match[1]}_${match[2]}` : null;
    }

    addToCart(designId) {
        alert(`Added to cart! Price: $${CONFIG.PRODUCT.PRICE}`);
    }

    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;

        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.insertAdjacentHTML('afterend', `
                <div id="realtimePanel" style="margin-top: 20px;">
                    <div id="realtimeUpdates" class="updates-container"></div>
                </div>
            `);
        }
    }
}
