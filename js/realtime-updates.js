// class RealTimeUpdates {
//     constructor(promoManager, uploadManager) {
//         this.socket = null;
//         this.isConnected = false;
//         this.pendingImages = new Map();
//         this.completedDesigns = new Map();
//         this.processedFiles = new Set();
//         this.promoManager = promoManager;
//         this.uploadManager = uploadManager;
//         this.hasDisplayedProduct = false;
//     }

//     initialize() {
//         this.setupWebSocket();
//         this.renderUpdatesPanel();
//         this.showPanel();
//     }

//     setupWebSocket() {
//         this.socket = new WebSocket(CONFIG.WS_URL);
        
//         this.socket.onopen = () => {
//             console.log('WebSocket connected');
//             this.authenticateWebSocket();
//         };

//         this.socket.onmessage = (event) => {
//             try {
//                 const data = JSON.parse(event.data);
//                 console.log('WebSocket message received:', data);
//                 this.handleUpdate(data);
//             } catch (error) {
//                 console.error('Error parsing WebSocket message:', error);
//             }
//         };

//         this.socket.onclose = () => {
//             console.log('WebSocket disconnected');
//             this.isConnected = false;
//             setTimeout(() => this.setupWebSocket(), 5000);
//         };
//     }

//     authenticateWebSocket() {
//         const session = this.getSession();
//         if (session && session.access_token) {
//             this.socket.send(JSON.stringify({
//                 action: 'authorize',
//                 id_token: session.access_token 
//             }));
//             this.isConnected = true;
//         }
//     }

//     handleUpdate(data) {
//         console.log('Processing update:', data);
        
//         if (data.type === 'design_ready') {
//             this.handleDesignReady(data);
//             return;
//         }
        
//         if (data.type === 'image_update') {
//             // Show progress updates regardless of product display status
//             const fileKey = data.fileName + '_' + data.stage;
//             if (this.processedFiles.has(fileKey)) {
//                 console.log('Skipping duplicate file update:', fileKey);
//                 return;
//             }
//             this.processedFiles.add(fileKey);
//             this.updateImageStatus(data);
//         }
//     }

//     handleDesignReady(designData) {
//         console.log('Complete design ready:', designData);
        
//         const designId = designData.designId;
//         if (!this.completedDesigns.has(designId)) {
//             this.completedDesigns.set(designId, designData);
//             this.uploadManager.incrementCompletedDesigns();
//             this.displayDesign(designData);
//             this.removeProgressItem(designId);
            
//             // Mark that we've displayed at least one product
//             this.hasDisplayedProduct = true;
//         }
//     }

//     updateImageStatus(update) {
//         console.log('Individual image update:', update);
//         const fileName = update.fileName;
//         const stage = update.stage;
        
//         let designId = this.extractDesignId(fileName);
//         let itemKey = designId || fileName;
        
//         let item = this.pendingImages.get(itemKey);
//         if (!item) {
//             item = this.createProgressItem(itemKey);
//             this.pendingImages.set(itemKey, item);
//         }
        
//         this.updateProgressItem(item, stage, update.timestamp, update.imageUrl);
//     }

//     extractDesignId(fileName) {
//         const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
//         return match ? `design_${match[1]}_${match[2]}` : null;
//     }

//     displayDesign(designData) {
//         const container = document.getElementById('realtimeUpdates');
//         const designId = designData.designId;
        
//         const existingDesign = document.getElementById(`design-${designId}`);
//         if (existingDesign) existingDesign.remove();
        
//         const productElement = document.createElement('div');
//         productElement.id = `design-${designId}`;
//         productElement.className = 'product-card';
        
//         const paletteName = designData.paletteName || 'Custom Design';
//         const imageUrls = Object.values(designData.imageUrls);
        
//         // Get current active discount from promo manager
//         const currentDiscount = this.promoManager.getActiveDiscount();
//         const discountedPrice = CONFIG.PRODUCT_PRICE * (1 - currentDiscount / 100);
//         const displayPrice = (currentDiscount > 0) ? discountedPrice : CONFIG.PRODUCT_PRICE;
        
//         productElement.innerHTML = `
//             <div class="product-header">
//                 <h4>${paletteName}</h4>
//                 <div class="product-price">
//                     ${currentDiscount > 0 ? 
//                         `<span style="text-decoration: line-through; color: #6c757d; margin-right: 8px;">$${CONFIG.PRODUCT_PRICE.toFixed(2)}</span>
//                          <span style="color: #28a745;">$${displayPrice.toFixed(2)}</span>
//                          <div style="font-size: 12px; color: #28a745;">${currentDiscount}% OFF</div>` :
//                         `$${CONFIG.PRODUCT_PRICE.toFixed(2)}`
//                     }
//                 </div>
//             </div>
            
//             <div class="design-viewer">
//                 <div class="main-image-container">
//                     <img src="${imageUrls[0]}" alt="${paletteName}" 
//                          class="main-image"
//                          onload="this.style.opacity='1'" 
//                          onerror="this.style.display='none'"
//                          style="opacity: 0; transition: opacity 0.3s ease; cursor: pointer;"
//                          onclick="window.app.realtimeUpdates.openImagePopup('${designId}', 0)" />
//                 </div>
//                 <div class="image-navigation">
//                     <button class="nav-btn prev-btn" onclick="window.app.realtimeUpdates.navigateImage('${designId}', -1)">‹</button>
//                     <div class="image-counter">
//                         <span class="current-image">1</span> / <span class="total-images">${imageUrls.length}</span>
//                     </div>
//                     <button class="nav-btn next-btn" onclick="window.app.realtimeUpdates.navigateImage('${designId}', 1)">›</button>
//                 </div>
//             </div>
            
//             <button class="add-to-cart-btn" onclick="window.app.realtimeUpdates.addToCart('${designId}')">
//                 Add to Cart - $${displayPrice.toFixed(2)}
//             </button>
//         `;
        
//         // Store image URLs for navigation
//         productElement._imageUrls = imageUrls;
//         productElement._currentImageIndex = 0;
        
//         // Add to products container or create one
//         let productsContainer = document.getElementById('productsContainer');
//         if (!productsContainer) {
//             productsContainer = document.createElement('div');
//             productsContainer.id = 'productsContainer';
//             productsContainer.className = 'products-container';
//             // Clear the updates container and add products header
//             container.innerHTML = '<h3>Your Custom Phone Cases</h3>';
//             container.appendChild(productsContainer);
//         }
        
//         productsContainer.appendChild(productElement);
//     }

//     openImagePopup(designId, imageIndex) {
//         const productElement = document.getElementById(`design-${designId}`);
//         if (!productElement || !productElement._imageUrls) return;
        
//         const imageUrl = productElement._imageUrls[imageIndex];
        
//         // Remove any existing popup
//         const existingPopup = document.querySelector('.image-popup-overlay');
//         if (existingPopup) existingPopup.remove();
        
//         // Create popup overlay
//         const popup = document.createElement('div');
//         popup.className = 'image-popup-overlay';
//         popup.innerHTML = `
//             <div class="image-popup-content">
//                 <button class="popup-close" onclick="window.app.realtimeUpdates.closeImagePopup()">&times;</button>
//                 <img src="${imageUrl}" alt="Full size preview" class="popup-image">
//                 <div class="popup-navigation">
//                     <button class="nav-btn" onclick="window.app.realtimeUpdates.navigatePopupImage('${designId}', ${imageIndex}, -1)">‹</button>
//                     <span class="popup-counter">${imageIndex + 1} / ${productElement._imageUrls.length}</span>
//                     <button class="nav-btn" onclick="window.app.realtimeUpdates.navigatePopupImage('${designId}', ${imageIndex}, 1)">›</button>
//                 </div>
//             </div>
//         `;
        
//         document.body.appendChild(popup);
        
//         // Close on overlay click
//         popup.addEventListener('click', (e) => {
//             if (e.target === popup) this.closeImagePopup();
//         });
        
//         // Close on escape key
//         document.addEventListener('keydown', this.handlePopupKeydown);
//     }

//     closeImagePopup() {
//         const popup = document.querySelector('.image-popup-overlay');
//         if (popup) popup.remove();
//         document.removeEventListener('keydown', this.handlePopupKeydown);
//     }

//     handlePopupKeydown = (e) => {
//         if (e.key === 'Escape') {
//             this.closeImagePopup();
//         }
//     }

//     navigatePopupImage(designId, currentIndex, direction) {
//         const productElement = document.getElementById(`design-${designId}`);
//         if (!productElement || !productElement._imageUrls) return;
        
//         const newIndex = (currentIndex + direction + productElement._imageUrls.length) % productElement._imageUrls.length;
//         this.closeImagePopup();
//         setTimeout(() => this.openImagePopup(designId, newIndex), 50);
//     }

//     navigateImage(designId, direction) {
//         const productElement = document.getElementById(`design-${designId}`);
//         if (!productElement || !productElement._imageUrls) return;
        
//         const images = productElement._imageUrls;
//         let currentIndex = productElement._currentImageIndex || 0;
        
//         currentIndex += direction;
//         if (currentIndex < 0) currentIndex = images.length - 1;
//         if (currentIndex >= images.length) currentIndex = 0;
        
//         productElement._currentImageIndex = currentIndex;
        
//         const mainImage = productElement.querySelector('.main-image');
//         const currentImageSpan = productElement.querySelector('.current-image');
        
//         mainImage.style.opacity = '0';
//         setTimeout(() => {
//             mainImage.src = images[currentIndex];
//             mainImage.onclick = () => this.openImagePopup(designId, currentIndex);
//             currentImageSpan.textContent = currentIndex + 1;
//             mainImage.style.opacity = '1';
//         }, 150);
//     }

//     addToCart(designId) {
//         const design = this.completedDesigns.get(designId);
//         const paletteName = design.paletteName || 'Custom Design';
//         const currentDiscount = this.promoManager.getActiveDiscount();
//         const discountedPrice = CONFIG.PRODUCT_PRICE * (1 - currentDiscount / 100);
//         const displayPrice = (currentDiscount > 0) ? discountedPrice : CONFIG.PRODUCT_PRICE;
        
//         alert(`Added ${paletteName} to cart! Price: $${displayPrice.toFixed(2)}`);
//     }

//     createProgressItem(itemKey) {
//         const container = document.getElementById('realtimeUpdates');
//         const item = document.createElement('div');
//         item.id = `progress-${itemKey}`;
//         item.className = 'progress-item';
        
//         // Use friendly stage names instead of file names
//         const friendlyName = this.getFriendlyStageName(itemKey);
            
//         item.innerHTML = `
//             <div class="progress-content">
//                 <div class="file-name">${friendlyName}</div>
//                 <div class="current-stage">🔄 Processing started...</div>
//                 <div class="timestamp">${new Date().toLocaleTimeString()}</div>
//             </div>
//             <div class="image-container"></div>
//         `;
//         container.appendChild(item);
        
//         // Ensure updates container is visible
//         this.showPanel();
        
//         return item;
//     }

//     getFriendlyStageName(itemKey) {
//         if (itemKey.includes('design_')) {
//             const parts = itemKey.replace('design_', '').split('_');
//             return `Creating Design ${parts[0]} - Style ${parts[1]}`;
//         }
        
//         // Map technical stage names to user-friendly ones
//         for (const [tech, friendly] of Object.entries(CONFIG.STAGE_MAP)) {
//             if (itemKey.toLowerCase().includes(tech)) {
//                 return friendly;
//             }
//         }
        
//         return '🔄 Processing your design';
//     }

//     removeProgressItem(designId) {
//         const item = document.getElementById(`progress-${designId}`);
//         if (item) {
//             item.remove();
//             this.pendingImages.delete(designId);
//         }
//     }

//     updateProgressItem(item, stage, timestamp, imageUrl) {
//         const stageElement = item.querySelector('.current-stage');
//         const friendlyStage = this.getFriendlyStageName(stage);
//         stageElement.textContent = friendlyStage;
//         item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
        
//         if (imageUrl) {
//             this.addImageToProgressItem(item, imageUrl);
//         }
        
//         // Add visual feedback for progress
//         item.style.borderLeftColor = this.getStageColor(stage);
//     }

//     getStageColor(stage) {
//         for (const [tech, color] of Object.entries(CONFIG.STAGE_COLORS)) {
//             if (stage.toLowerCase().includes(tech)) {
//                 return color;
//             }
//         }
        
//         return '#6f42c1';
//     }

//     addImageToProgressItem(item, imageUrl) {
//         const imageContainer = item.querySelector('.image-container');
//         imageContainer.innerHTML = '';
        
//         const img = document.createElement('img');
//         img.src = imageUrl;
//         img.alt = 'Processing preview';
//         img.className = 'progress-thumbnail';
//         img.onload = () => img.style.opacity = '1';
//         img.style.opacity = '0';
//         img.style.transition = 'opacity 0.3s ease';
        
//         imageContainer.appendChild(img);
//     }

//     getSession() {
//         return JSON.parse(localStorage.getItem('cognitoSession'));
//     }

//     renderUpdatesPanel() {
//         if (document.getElementById('realtimePanel')) return;

//         const uploadSection = document.getElementById('uploadSection');
//         const updatesHTML = `
//             <div id="realtimePanel" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
//                 <div id="realtimeUpdates" class="updates-container"></div>
//             </div>
//         `;
        
//         if (uploadSection) {
//             uploadSection.insertAdjacentHTML('afterend', updatesHTML);
//         } else {
//             document.body.insertAdjacentHTML('beforeend', updatesHTML);
//         }
//     }

//     showPanel() {
//         const panel = document.getElementById('realtimePanel');
//         if (panel) panel.style.display = 'block';
//     }

//     reset() {
//         this.pendingImages.clear();
//         this.completedDesigns.clear();
//         this.processedFiles.clear();
//         this.hasDisplayedProduct = false;
//     }
// }




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
        let uiItem = document.getElementById(`progress-${itemKey}`);
        
        if (!uiItem) {
            const friendlyName = this.getFriendlyStageName(itemKey);
            const { id, html } = this.uiManager.createProgressItem(itemKey, friendlyName);
            const container = document.getElementById('realtimeUpdates');
            container.insertAdjacentHTML('beforeend', html);
            uiItem = document.getElementById(id);
        }

        this.updateProgressItemElement(uiItem, progressItem);
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
        
        // Ensure products container exists
        let productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) {
            productsContainer = this.createProductsContainer(container);
        }
        
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
    }

    createProductsContainer(parentContainer) {
        const { html } = this.uiManager.createProductsContainer();
        parentContainer.innerHTML = '';
        parentContainer.insertAdjacentHTML('beforeend', html);
        return document.getElementById('productsContainer');
    }

    
    
    // ... keep existing helper methods (getFriendlyStageName, getStageColor, addImageToProgressItem, etc.)
    // These remain the same as in original implementation

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
        for (const [tech, color] of Object.entries(CONFIG.STAGE_COLORS)) {
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

    reset() {
        this.pendingImages.clear();
        this.completedDesigns.clear();
        this.processedFiles.clear();
        this.hasDisplayedProduct = false;
    }

    addToCart(designId) {
        const design = this.progressTracker.getCompletedDesign(designId);
        const paletteName = design.paletteName || 'Custom Design';
        const currentDiscount = this.promoManager.getActiveDiscount();
        const discountedPrice = CONFIG.PRODUCT_PRICE * (1 - currentDiscount / 100);
        const displayPrice = (currentDiscount > 0) ? discountedPrice : CONFIG.PRODUCT_PRICE;
        
        alert(`Added ${paletteName} to cart! Price: $${displayPrice.toFixed(2)}`);
    }

    removeProgressItem(designId) {
        const item = document.getElementById(`progress-${designId}`);
        if (item) {
            item.remove();
            this.progressTracker.pendingItems.delete(designId);
        }
    }

    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;

        const uploadSection = document.getElementById('uploadSection');
        const updatesHTML = this.uiManager.createUpdatesPanel();
        
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
    }

    getSession() {
        return JSON.parse(localStorage.getItem('cognitoSession'));
    }
}
