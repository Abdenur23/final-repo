//realtime-updates.js
class RealTimeUpdates {
    constructor(studioManager) {
        this.studioManager = studioManager;
        this.websocketManager = new WebSocketManager();
        this.progressTracker = new Map(); // Simple progress tracking
        this.completedDesigns = new Set(); // Track completed designs to avoid duplicates
        this.processedUpdates = new Set(); // Track processed image updates to avoid duplicates
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
        
        // FIX 3: Prevent duplicate products
        if (this.completedDesigns.has(designId)) {
            console.log('Skipping duplicate design:', designId);
            return;
        }
        
        this.completedDesigns.add(designId);
        
        // Convert to product format and send to StudioManager
        // const product = {
        //     designId: designId,
        //     name: designData.paletteName || `Bloom Design ${designId}`,
        //     price: designData.originalPrice || 49.99,
        //     device_id: designData.device_id,
        //     images: designData.imageUrls || [] // Should contain 4 product view images
        // };
        
        // // Add product to StudioManager
        // this.studioManager.addRealTimeProduct(product);



        const product = {
            designId: designId,
            name: designData.paletteName || `Bloom Design ${designId}`,
            price: parseFloat(designData.originalPrice) || 49.99,
            device_id: designData.device_id,
            imageUrls: designData.imageUrls || {},
            product_type: designData.product_type
        };

        // Add product to StudioManager
        this.studioManager.addRealTimeProduct(product);
        // Update progress bar when design is complete
        this.updateProgressBar(100);
    }

    handleImageUpdate(update) {
        console.log('Individual image update:', update);
        
        // FIX 2: Prevent duplicate image updates
        const updateKey = `${update.stage}_${update.imageUrl}`;
        if (this.processedUpdates.has(updateKey)) {
            console.log('Skipping duplicate image update:', updateKey);
            return;
        }
        
        this.processedUpdates.add(updateKey);
        
        // FIX 1: Update progress bar based on stage
        this.updateProgressForStage(update.stage);
        
        // Send progress image to StudioManager
        this.studioManager.displayRealTimeProgress(
            update.imageUrl, 
            update.stage, 
            this.getFriendlyStageName(update.stage)
        );
    }

    // FIX 1: Progress bar updates
    updateProgressForStage(stage) {
        //const normalizedStage = stage.toLowerCase();
        //console.log('stage is :', stage);
        const stageProgress = {
            'Enhancing image': 25,
            'Producing design': 50,
            'Preparing wallpaper and case': 75,
            'Mockup ready': 90
        };
        
        const progress = stageProgress[stage] || 40; // Default to 10% for unknown stages
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

    // Reset method for when starting over
    reset() {
        this.completedDesigns.clear();
        this.processedUpdates.clear();
        this.progressTracker.clear();
    }
}
