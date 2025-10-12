class RealtimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.userSub = null;
    }

    init(userSub) {
        this.userSub = userSub;
        this.connectWebSocket();
    }

    connectWebSocket() {
        const wsUrl = 'wss://qznzor4oy6.execute-api.us-east-1.amazonaws.com/production';
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            this.isConnected = true;
            this.socket.send(JSON.stringify({
                action: 'connect',
                sub: this.userSub
            }));
            this.onStatusChange('connected');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.socket.onclose = () => {
            this.isConnected = false;
            this.onStatusChange('disconnected');
            // Attempt reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.onStatusChange('error');
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'IMAGE_UPDATE':
                this.onImageUpdate(data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    onImageUpdate(data) {
        // This will be overridden by the main UI
        if (typeof this.imageUpdateCallback === 'function') {
            this.imageUpdateCallback(data);
        }
    }

    onStatusChange(status) {
        // This will be overridden by the main UI
        if (typeof this.statusChangeCallback === 'function') {
            this.statusChangeCallback(status);
        }
    }

    setImageUpdateCallback(callback) {
        this.imageUpdateCallback = callback;
    }

    setStatusChangeCallback(callback) {
        this.statusChangeCallback = callback;
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
