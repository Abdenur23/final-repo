class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.progressItems = new Map();
        this.completedDesigns = new Map();
        this.displayedDesigns = new Set();
        this.hasUploaded = false;
        this.promoManager = null;
    }

    initialize(promoManager) {
        this.promoManager = promoManager;
        this.setupWebSocket();
        this.renderUpdatesPanel();
        this.showPanel();
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
        const session = getSession();
        if (session?.access_token) {
            this.socket.send(JSON.stringify({
                action: 'authorize',
                id_token: session.access_token
            }));
            this.isConnected = true;
        }
    }

    handleUpdate(data) {
        if (data.type === 'design_ready') {
            this.handleDesignReady(data);
        } else if (data.type === 'image_update') {
            this.handleProgressUpdate(data);
        }
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

    handleProgressUpdate(update) {
        // Only show progress if we haven't completed all designs
        if (this.completedDesigns.size >= CONFIG.PRODUCT.REQUIRED_DESIGNS) return;

        const fileName = update.fileName;
        const stage = update.stage;
        const designId = this.extractDesignId(fileName) || fileName;

        let progressItem = this.progressItems.get(designId);
        if (!progressItem) {
            progressItem = this.createProgressItem(designId);
            this.progressItems.set(designId, progressItem);
        }

        this.updateProgressStages(progressItem, stage, update.timestamp);
    }

    createProgressItem(designId) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.id = `progress-${designId}`;
        item.className = 'progress-item';
        
        item.innerHTML = `
            <div class="progress-track">
                <div class="progress-stages">
                    ${Object.values(CONFIG.STAGES).map(stage => 
                        `<div class="stage" data-stage="${stage}">${stage}</div>`
                    ).join('')}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            <div class="timestamp"></div>
        `;
        
        container.appendChild(item);
        return item;
    }

    updateProgressStages(progressItem, currentStage, timestamp) {
        const stages = progressItem.querySelectorAll('.stage');
        const progressFill = progressItem.querySelector('.progress-fill');
        const timestampEl = progressItem.querySelector('.timestamp');
        
        let currentStageIndex = -1;
        
        stages.forEach((stage, index) => {
            stage.classList.remove('completed', 'active');
            if (stage.textContent === currentStage) {
                currentStageIndex = index;
                stage.classList.add('active');
            } else if (currentStageIndex === -1 || index < currentStageIndex) {
                stage.classList.add('completed');
            }
        });

        // Update progress bar
        const progressPercent = ((currentStageIndex + 1) / stages.length) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        timestampEl.textContent = new Date(timestamp).toLocaleTimeString();
    }

    displayDesign(designData) {
        const designId = designData.designId;
        if (this.displayedDesigns.has(designId)) return;
        
        this.displayedDesigns.add(designId);
        
        const container = document.getElementById('realtimeUpdates');
        const productElement = this.createProductElement(designData);
        
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

    createProductElement(designData) {
        const designId = designData.designId;
        const paletteName = designData.paletteName || 'Custom Design';
        const imageUrls = Object.values(designData.imageUrls);
        const discountedPrice = this.promoManager ? 
            this.promoManager.getDiscountedPrice(CONFIG.PRODUCT.BASE_PRICE) : 
            CONFIG.PRODUCT.BASE_PRICE;

        const productElement = document.createElement('div');
        productElement.id = `design-${designId}`;
        productElement.className = 'product-card';
        
        productElement.innerHTML = `
            <div class="product-header">
                <h4>${paletteName}</h4>
                <div class="product-price">
                    ${this.promoManager && this.promoManager.isValidPromo ? 
                        `<span class="original-price">$${CONFIG.PRODUCT.BASE_PRICE.toFixed(2)}</span>
                         <span class="discounted-price">$${discountedPrice.toFixed(2)}</span>
                         <span class="discount-badge">${this.promoManager.discountPercentage}% OFF</span>` :
                        `$${CONFIG.PRODUCT.BASE_PRICE.toFixed(2)}`
                    }
                </div>
            </div>
            
            <div class="design-viewer">
                <div class="main-image-container" onclick="realtimeUpdates.openImageModal('${designId}', 0)">
                    <img src="${imageUrls[0]}" alt="${paletteName}" class="main-image" />
                </div>
                <div class="image-thumbnails">
                    ${imageUrls.map((url, index) => `
                        <div class="thumbnail" onclick="realtimeUpdates.openImageModal('${designId}', ${index})">
                            <img src="${url}" alt="Design view ${index + 1}" />
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <button class="add-to-cart-btn" onclick="realtimeUpdates.addToCart('${designId}')">
                Add to Cart - $${discountedPrice.toFixed(2)}
            </button>
        `;
        
        productElement._imageUrls = imageUrls;
        return productElement;
    }

    openImageModal(designId, imageIndex) {
        const design = this.completedDesigns.get(designId);
        if (!design) return;

        const imageUrls = Object.values(design.imageUrls);
        const imageUrl = imageUrls[imageIndex];

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
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

        modal.innerHTML = `
            <div class="modal-content" style="position: relative; max-width: 90%; max-height: 90%;">
                <img src="${imageUrl}" alt="Full size design" 
                     style="max-width: 100%; max-height: 90vh; object-fit: contain;" />
                <button class="modal-close" 
                        style="position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">
                    ×
                </button>
            </div>
        `;

        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    checkAllDesignsComplete() {
        if (this.completedDesigns.size >= CONFIG.PRODUCT.REQUIRED_DESIGNS) {
            this.showStartOverButton();
            this.hideUploadSection();
        }
    }

    showStartOverButton() {
        const container = document.getElementById('realtimeUpdates');
        const existingButton = document.getElementById('startOverBtn');
        if (existingButton) return;

        const startOverBtn = document.createElement('button');
        startOverBtn.id = 'startOverBtn';
        startOverBtn.textContent = 'Start Over';
        startOverBtn.className = 'start-over-btn';
        startOverBtn.onclick = () => this.startOver();

        container.appendChild(startOverBtn);
    }

    startOver() {
        // Clear all designs and progress
        this.completedDesigns.clear();
        this.displayedDesigns.clear();
        this.progressItems.clear();
        this.hasUploaded = false;

        // Clear UI
        const productsContainer = document.getElementById('productsContainer');
        if (productsContainer) productsContainer.remove();

        const updatesContainer = document.getElementById('realtimeUpdates');
        updatesContainer.innerHTML = '<h3>🔄 Processing Updates</h3>';

        // Reset upload section
        this.showUploadSection();
        
        // Reset file input
        if (window.uploadManager) {
            window.uploadManager.reset();
        }

        // Remove start over button
        const startOverBtn = document.getElementById('startOverBtn');
        if (startOverBtn) startOverBtn.remove();
    }

    hideUploadSection() {
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) uploadSection.style.display = 'none';
    }

    showUploadSection() {
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) uploadSection.style.display = 'block';
    }

    removeProgressItem(designId) {
        const item = document.getElementById(`progress-${designId}`);
        if (item) {
            item.remove();
            this.progressItems.delete(designId);
        }
    }

    extractDesignId(fileName) {
        const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
        return match ? `design_${match[1]}_${match[2]}` : null;
    }

    addToCart(designId) {
        const design = this.completedDesigns.get(designId);
        const paletteName = design.paletteName || 'Custom Design';
        const discountedPrice = this.promoManager ? 
            this.promoManager.getDiscountedPrice(CONFIG.PRODUCT.BASE_PRICE) : 
            CONFIG.PRODUCT.BASE_PRICE;

        alert(`Added ${paletteName} to cart! Price: $${discountedPrice.toFixed(2)}`);
    }

    updateAllProductPrices() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const priceElement = card.querySelector('.product-price');
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            
            if (priceElement && addToCartBtn && this.promoManager) {
                const discountedPrice = this.promoManager.getDiscountedPrice(CONFIG.PRODUCT.BASE_PRICE);
                
                priceElement.innerHTML = `
                    <span class="original-price">$${CONFIG.PRODUCT.BASE_PRICE.toFixed(2)}</span>
                    <span class="discounted-price">$${discountedPrice.toFixed(2)}</span>
                    <span class="discount-badge">${this.promoManager.discountPercentage}% OFF</span>
                `;
                
                addToCartBtn.textContent = `Add to Cart - $${discountedPrice.toFixed(2)}`;
            }
        });
    }

    resetForNewUpload() {
        this.hasUploaded = true;
        this.hideUploadSection();
    }

    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;

        const uploadSection = document.getElementById('uploadSection');
        const updatesHTML = `
            <div id="realtimePanel" style="margin-top: 20px;">
                <div id="realtimeUpdates" class="updates-container"></div>
            </div>
        `;
        
        if (uploadSection) {
            uploadSection.insertAdjacentHTML('afterend', updatesHTML);
        }
    }

    showPanel() {
        const panel = document.getElementById('realtimePanel');
        if (panel) panel.style.display = 'block';
    }
}
