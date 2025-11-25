//realtime-updates.js
class RealTimeUpdates {
    constructor(studioManager) {
        this.studioManager = studioManager;
        this.websocketManager = new WebSocketManager();
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
        const session = getSession(); // Fixed: remove 'this.'
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
        
        // Convert to product format and send to StudioManager
        const product = {
            designId: designData.designId,
            name: designData.name || `Bloom Design ${designData.designId}`,
            price: designData.price || 49.99,
            images: designData.images || [] // Should contain 4 product view images
        };
        
        // Add product to StudioManager
        this.studioManager.addRealTimeProduct(product);
        
        
    }

    handleImageUpdate(update) {
        console.log('Individual image update:', update);
        
        // Send progress image to StudioManager
        this.studioManager.displayRealTimeProgress(
            update.imageUrl, 
            update.stage, 
            this.getFriendlyStageName(update.stage)
        );
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
}
