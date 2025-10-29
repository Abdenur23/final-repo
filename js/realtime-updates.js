class RealTimeUpdates {
    constructor(promoManager, uploadManager) {
        this.promoManager = promoManager;
        this.uploadManager = uploadManager;
        this.hasDisplayedProduct = false;
        
        // Initialize modular components
        this.websocketManager = new WebSocketManager();
        this.progressTracker = new ProgressTracker();
        this.uiManager = new UIComponentsManager();
        this.imageHandler = new ImageNavigationHandler();
        
        this.setupWebSocketHandlers();
    }

    initialize() {
        this.setupWebSocket();
        this.renderUpdatesPanel();
        this.showPanel();
    }

    setupWebSocket() {
        this.websocketManager.initialize(CONFIG.WS_URL);
    }

    setupWebSocketHandlers() {
        this.websocketManager.on('connected', () => {
            this.authenticateWebSocket();
        });

        this.websocketManager.on('message', (data) => {
            this.handleUpdate(data);
        });

        this.websocketManager.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    authenticateWebSocket() {
        const session = this.getSession();
        if (session?.access_token) {
            this.websocketManager.authenticate(session.access_token);
        }
    }

    handleUpdate(data) {
        console.log('Processing update:', data);
        
        if (data.type === 'design_ready') {
            this.handleDesignReady(data);
            return;
        }
        
        if (data.type === 'image_update') {
            this.handleImageUpdate(data);
        }
    }

    handleDesignReady(designData) {
        console.log('Complete design ready:', designData);
        
        const designId = designData.designId;
        if (!this.progressTracker.getCompletedDesign(designId)) {
            this.progressTracker.markComplete(designId, designData);
            this.uploadManager.incrementCompletedDesigns();
            this.displayDesign(designData);
            this.removeProgressItem(designId);
            
            this.hasDisplayedProduct = true;
        }
    }

    handleImageUpdate(update) {
        console.log('Individual image update:', update);
        
        if (this.progressTracker.isDuplicateUpdate(update.fileName, update.stage)) {
            console.log('Skipping duplicate file update:', update.fileName);
            return;
        }

        const fileName = update.fileName;
        const designId = this.progressTracker.extractDesignId(fileName);
        const itemKey = designId || fileName;
        
        let progressItem = this.progressTracker.trackProgress(itemKey);
        this.progressTracker.updateProgress(itemKey, update.stage, {
            imageUrl: update.imageUrl,
            timestamp: update.timestamp
        });

        this.updateProgressUI(itemKey, progressItem);
    }

    updateProgressUI(itemKey, progressItem) {
        const container = document.getElementById('realtimeUpdates');
        if (!container) return;

        // Ensure we have the horizontal train container
        let trainContainer = container.querySelector('.progress-train');
        if (!trainContainer) {
            container.innerHTML = '<div class="progress-train"></div>';
            trainContainer = container.querySelector('.progress-train');
        }

        // Add each stage as a separate train car
        progressItem.stages.forEach((stage, index) => {
            const stageId = `${itemKey}-${stage.stage}-${index}`;
            let stageElement = document.getElementById(`progress-train-${stageId}`);
            
            if (!stageElement) {
                const friendlyName = this.getFriendlyStageName(stage.stage);
                const { id, html } = this.uiManager.createProgressTrainItem(
                    stageId, 
                    friendlyName, 
                    stage.stage, 
                    stage.imageUrl
                );
                
                trainContainer.insertAdjacentHTML('beforeend', html);
                stageElement = document.getElementById(id);
            }

            if (stageElement) {
                this.updateProgressTrainElement(stageElement, stage);
            }
        });

        // Scroll to the latest update
        trainContainer.scrollLeft = trainContainer.scrollWidth;
    }

    updateProgressTrainElement(stageElement, stage) {
        const timestampElement = stageElement.querySelector('.timestamp');
        if (timestampElement) {
            timestampElement.textContent = new Date(stage.timestamp).toLocaleTimeString();
        }
        
        // Update border color based on stage
        stageElement.style.borderLeftColor = this.getStageColor(stage.stage);
        
        // Add completed class if this is a final stage
        if (stage.stage.includes('complete') || stage.stage.includes('ready')) {
            stageElement.classList.add('completed');
        }
    }

    updateProgressItemElement(itemElement, progressItem) {
        const latestStage = progressItem.stages[progressItem.stages.length - 1];
        const stageElement = itemElement.querySelector('.current-stage');
        const timestampElement = itemElement.querySelector('.timestamp');
        
        const friendlyStage = this.getFriendlyStageName(latestStage.stage);
        stageElement.textContent = friendlyStage;
        timestampElement.textContent = new Date(latestStage.timestamp).toLocaleTimeString();
        
        if (latestStage.imageUrl) {
            this.addImageToProgressItem(itemElement, latestStage.imageUrl);
        }
        
        itemElement.style.borderLeftColor = this.getStageColor(latestStage.stage);
    }

    displayDesign(designData) {
        const container = document.getElementById('realtimeUpdates');
        if (!container) {
            console.error('RealTimeUpdates container not found');
            return;
        }

        const designId = designData.designId;
        
        // Remove existing design if present
        const existingDesign = document.getElementById(`design-${designId}`);
        if (existingDesign) existingDesign.remove();
        
        // Calculate pricing
        const currentDiscount = this.promoManager.getActiveDiscount();
        const originalPrice = CONFIG.PRODUCT_PRICE;
        const discountedPrice = originalPrice * (1 - currentDiscount / 100);
        
        const priceInfo = {
            original: originalPrice,
            discounted: discountedPrice,
            discount: currentDiscount
        };

        // Create product card
        const { html, metadata } = this.uiManager.createProductCard(designData, priceInfo);
        
        // Ensure products container exists - FIXED LOGIC
        let productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) {
            productsContainer = this.createProductsContainer(container);
        }
        
        if (productsContainer) {
            productsContainer.insertAdjacentHTML('beforeend', html);
            const productElement = document.getElementById(`design-${designId}`);
            
            // Setup navigation
            this.imageHandler.setupProductNavigation(
                productElement, 
                designId, 
                metadata.imageUrls
            );

            // Setup add to cart button
            const cartBtn = productElement.querySelector('.add-to-cart-btn');
            cartBtn.addEventListener('click', () => this.addToCart(designId));
        } else {
            console.error('Products container could not be created');
        }
    }

    createProductsContainer(parentContainer) {
        try {
            // Clear the updates container and add products structure
            parentContainer.innerHTML = `
                <div class="products-section">
                    <h3>Your Custom Phone Cases</h3>
                    <div id="productsContainer" class="products-container"></div>
                </div>
            `;
            return document.getElementById('productsContainer');
        } catch (error) {
            console.error('Error creating products container:', error);
            return null;
        }
    }

    addImageToProgressItem(item, imageUrl) {
        const imageContainer = item.querySelector('.image-container');
        if (imageContainer) {
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
    }

    getFriendlyStageName(itemKey) {
        if (itemKey.includes('design_')) {
            const parts = itemKey.replace('design_', '').split('_');
            return `Creating Design ${parts[0]} - Style ${parts[1]}`;
        }
        
        // Map technical stage names to user-friendly ones
        for (const [tech, friendly] of Object.entries(CONFIG.STAGE_MAP)) {
            if (itemKey.toLowerCase().includes(tech)) {
                return friendly;
            }
        }
        
        return '🔄 Processing your design';
    }

    getStageColor(stage) {
        for (const [tech, color] of Object.entries(CONFIG.STAGE_COLORS)) {
            if (stage.toLowerCase().includes(tech)) {
                return color;
            }
        }
        
        return '#6f42c1';
    }

    removeProgressItem(designId) {
        // Remove all train items for this design
        const trainItems = document.querySelectorAll(`[id^="progress-train-${designId}"]`);
        trainItems.forEach(item => item.remove());
        
        this.progressTracker.pendingItems.delete(designId);
    }

    addToCart(designId) {
        const design = this.progressTracker.getCompletedDesign(designId);
        if (design) {
            const paletteName = design.paletteName || 'Custom Design';
            const currentDiscount = this.promoManager.getActiveDiscount();
            const discountedPrice = CONFIG.PRODUCT_PRICE * (1 - currentDiscount / 100);
            const displayPrice = (currentDiscount > 0) ? discountedPrice : CONFIG.PRODUCT_PRICE;
            
            alert(`Added ${paletteName} to cart! Price: $${displayPrice.toFixed(2)}`);
        }
    }

    // UPDATED METHOD
    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;

        const uploadSection = document.getElementById('uploadSection');
        const updatesHTML = `
            <div id="realtimePanel" style="margin-top: 20px;">
                <div id="realtimeUpdates" class="updates-container">
                    <div class="progress-train"></div>
                </div>
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

    reset() {
        this.progressTracker.reset();
        this.hasDisplayedProduct = false;
        this.websocketManager.disconnect();
        
        // Clear UI
        const updatesContainer = document.getElementById('realtimeUpdates');
        if (updatesContainer) {
            updatesContainer.innerHTML = '';
        }
    }

    getSession() {
        try {
            const session = localStorage.getItem('cognitoSession');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
}
