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
        console.log('Complete design ready with images:', designData);
        
        const designId = designData.designId;
        
        // Prevent duplicate products
        if (this.completedDesigns.has(designId)) {
            console.log('Skipping duplicate design:', designId);
            return;
        }
        
        this.completedDesigns.add(designId);
        
        // FIX: Ensure we have an array of 4 images for the product
        const productImages = this.extractProductImages(designData);
        
        // Convert to product format and send to StudioManager
        const product = {
            designId: designId,
            name: designData.name || `Bloom Design ${designId}`,
            price: designData.price || 49.99,
            images: productImages // This should be an array of 4 image URLs
        };
        
        console.log(`Creating product ${designId} with ${product.images.length} images`);
        
        // Add product to StudioManager
        this.studioManager.addRealTimeProduct(product);
        
        // Update progress bar when design is complete
        this.updateProgressBar(100);
    }

    // Helper method to extract product images from designData
    extractProductImages(designData) {
        // If designData.images is already an array, use it
        if (Array.isArray(designData.images) && designData.images.length > 0) {
            return designData.images;
        }
        
        // If designData has individual image fields
        const images = [];
        if (designData.image1) images.push(designData.image1);
        if (designData.image2) images.push(designData.image2);
        if (designData.image3) images.push(designData.image3);
        if (designData.image4) images.push(designData.image4);
        
        // If no images found, use a placeholder or log warning
        if (images.length === 0) {
            console.warn('No images found in designData:', designData);
            // You might want to add placeholder images here
        }
        
        return images;
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
        const stageProgress = {
            'enhancing image': 25,
            'preparing wallpaper and case': 50,
            'producing design': 75,
            'mockup ready': 90
        };
        
        const progress = stageProgress[stage] || 10; // Default to 10% for unknown stages
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
