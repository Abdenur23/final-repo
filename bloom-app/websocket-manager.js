//websocket-manager.js
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.messageHandlers = new Map();
    }

    initialize(url) {
        this.url = url;
        this.setupWebSocket();
    }

    setupWebSocket() {
        try {
            this.socket = new WebSocket(this.url);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket creation failed:', error);
            this.handleReconnection();
        }
    }

    setupEventHandlers() {
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.trigger('connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.trigger('message', data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                this.trigger('error', error);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.trigger('disconnected');
            this.handleReconnection();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.trigger('error', error);
        };
    }

    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    }

    off(event, handler) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    trigger(event, data) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    send(data) {
        if (this.isConnected && this.socket) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected');
        }
    }

    authenticate(token) {
        if (token) {
            this.send({
                action: 'authorize',
                id_token: token
            });
        }
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms...`);
            setTimeout(() => this.setupWebSocket(), delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
