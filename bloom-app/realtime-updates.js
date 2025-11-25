//realtime-updates.js
class RealTimeUpdates {
    constructor(studioManager) {
        this.studioManager = studioManager;
        this.websocketManager = new WebSocketManager();
        this.progressTracker = new ProgressTracker(); // Add progress tracker
        this.completedDesigns = new Set();
        this.hasDisplayedProduct = false;
        this.setupWebSocketHandlers();
    }

    initialize() {
        this.setupWebSocket();
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
        const session = getSession();
        if (session?.access_token) {
            this.websocketManager.authenticate(session.access_token);
        }
    }

    handleUpdate(data) {
        console.log('Processing update:', data);
        
        if (data.type === 'connection_replaced') {
            console.warn('Received connection_replaced notice. Allowing socket to close gracefully.');
            return;
        }
        
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
        
        // Use ProgressTracker to prevent duplicates (like in old version)
        if (!this.progressTracker.getCompletedDesign(designId)) {
            this.progressTracker.markComplete(designId, designData);
            
            // Convert to product format - designData should already contain the 4 images
            const product = {
                designId: designId,
                name: designData.name || `Bloom Design ${designId}`,
                price: designData.price || 49.99,
                images: designData.images || this.extractImagesFromDesignData(designData)
            };
            
            console.log(`Creating product ${designId} with ${product.images.length} images`);
            
            // Add product to StudioManager
            this.studioManager.addRealTimeProduct(product);
            
            this.hasDisplayedProduct = true;
            
            // Update progress bar to 100% when design is complete
            this.updateProgressBar(100);
        }
    }

    handleImageUpdate(update) {
        console.log('Individual image update:', update);
        
        // Extract the base file identifier (without stage-specific parts) - from old version
        const baseFileName = this.extractBaseFileName(update.fileName);
        const stage = update.stage;
        
        // Check if we've already processed this exact stage for this file - from old version
        const duplicateKey = `${baseFileName}_${stage}`;
        if (this.progressTracker.isDuplicateUpdate(duplicateKey, stage)) {
            console.log('Skipping duplicate file stage update:', duplicateKey);
            return;
        }
    
        const fileName = update.fileName;
        const designId = this.progressTracker.extractDesignId(fileName);
        const itemKey = designId || baseFileName;
        
        // Track progress like in old version
        let progressItem = this.progressTracker.trackProgress(itemKey);
        this.progressTracker.updateProgress(itemKey, update.stage, {
            imageUrl: update.imageUrl,
            timestamp: update.timestamp
        });
    
        // Update progress bar based on stage
        this.updateProgressForStage(update.stage);
        
        // Send progress image to StudioManager
        this.studioManager.displayRealTimeProgress(
            update.imageUrl, 
            update.stage, 
            this.getFriendlyStageName(update.stage)
        );
    }

    // From old version - extract base file name
    extractBaseFileName(fileName) {
        const match = fileName.match(/(priority_\d+_cid_[^_]+)/);
        return match ? match[1] : fileName;
    }

    // Helper to extract images from design data
    extractImagesFromDesignData(designData) {
        // If designData has direct images array
        if (Array.isArray(designData.images)) {
            return designData.images;
        }
        
        // If designData has image URLs in different properties
        const images = [];
        for (let i = 1; i <= 4; i++) {
            if (designData[`image${i}`] || designData[`imageUrl${i}`]) {
                images.push(designData[`image${i}`] || designData[`imageUrl${i}`]);
            }
        }
        
        return images;
    }

    // Progress bar updates
    updateProgressForStage(stage) {
        const stageProgress = {
            'enhancing image': 25,
            'preparing wallpaper and case': 50,
            'producing design': 75,
            'mockup ready': 90
        };
        
        const progress = stageProgress[stage] || 10;
        this.updateProgressBar(progress);
    }

    updateProgressBar(progress) {
        const progressBar = document.getElementById('progress-bar');
        const progressMessage = document.getElementById('progress-message');
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        if (progressMessage && progress < 100) {
            progressMessage.innerText = this.getProgressMessage(progress);
        }
    }

    getProgressMessage(progress) {
        if (progress <= 25) return 'Enhancing your images...';
        if (progress <= 50) return 'Preparing wallpaper and case designs...';
        if (progress <= 75) return 'Producing your custom designs...';
        if (progress <= 90) return 'Finalizing mockups...';
        return 'Complete!';
    }

    getFriendlyStageName(stage) {
        const stageMap = {
            'enhancing image': '🧪 Enhancing your image',
            'preparing wallpaper and case': '🧩 Preparing wallpaper and case',
            'producing design': '🎨 Generating your phone case design',
            'mockup ready': '✅ Your design is ready'
        };
        return stageMap[stage] || 'Processing your design...';
    }

    // Reset method
    reset() {
        this.completedDesigns.clear();
        this.progressTracker.reset();
        this.hasDisplayedProduct = false;
    }
}
