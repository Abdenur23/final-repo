// class RealTimeUpdates {
//     constructor() {
//         this.socket = null;
//         this.isConnected = false;
//         this.pendingImages = new Map();
//     }

//     initialize() {
//         this.setupWebSocket();
//         this.renderUpdatesPanel();
//     }

//     setupWebSocket() {
//         const WS_URL = 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production';
//         this.socket = new WebSocket(WS_URL);
        
//         this.socket.onopen = () => {
//             console.log('WebSocket connected');
//             this.authenticateWebSocket();
//         };

//         this.socket.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             this.handleUpdate(data);
//         };

//         this.socket.onclose = () => {
//             console.log('WebSocket disconnected');
//             this.isConnected = false;
//             // Attempt reconnect after 5 seconds
//             setTimeout(() => this.setupWebSocket(), 5000);
//         };
//     }

//     authenticateWebSocket() {
//         const session = this.getSession();
//         if (session && session.id_token) {
//             this.socket.send(JSON.stringify({
//                 action: 'authorize',
//                 id_token: session.id_token
//             }));
//             this.isConnected = true;
//         }
//     }

//     handleUpdate(data) {
//         console.log('Received update:', data);
        
//         switch(data.type) {
//             case 'image_update':
//                 this.updateImageStatus(data);
//                 break;
//             default:
//                 console.log('Unknown message type:', data.type);
//         }
//     }

//     updateImageStatus(update) {
//         const container = document.getElementById('realtimeUpdates');
//         if (!container) return;

//         const fileName = update.fileName;
//         const stage = update.stage;
        
//         // Create or update progress item
//         let item = this.pendingImages.get(fileName);
//         if (!item) {
//             item = this.createProgressItem(fileName);
//             this.pendingImages.set(fileName, item);
//         }
        
//         this.updateProgressItem(item, stage, update.timestamp);
//     }

//     createProgressItem(fileName) {
//         const container = document.getElementById('realtimeUpdates');
//         const item = document.createElement('div');
//         item.className = 'progress-item';
//         item.innerHTML = `
//             <div class="file-name">${this.formatFileName(fileName)}</div>
//             <div class="progress-stages">
//                 <div class="stage uploaded">📤 Uploaded</div>
//                 <div class="stage stage1">🔄 Stage 1</div>
//                 <div class="stage stage2">🔄 Stage 2</div>
//                 <div class="stage final">✅ Final</div>
//             </div>
//             <div class="timestamp"></div>
//         `;
//         container.appendChild(item);
//         return item;
//     }

//     updateProgressItem(item, stage, timestamp) {
//         // Update stage indicators
//         const stages = item.querySelectorAll('.stage');
//         stages.forEach(stageEl => stageEl.classList.remove('active', 'completed'));
        
//         switch(stage) {
//             case 'uploaded':
//                 item.querySelector('.uploaded').classList.add('completed');
//                 break;
//             case 'stage1_complete':
//                 item.querySelector('.uploaded').classList.add('completed');
//                 item.querySelector('.stage1').classList.add('completed');
//                 break;
//             case 'stage2_complete':
//                 item.querySelector('.uploaded').classList.add('completed');
//                 item.querySelector('.stage1').classList.add('completed');
//                 item.querySelector('.stage2').classList.add('completed');
//                 break;
//             case 'final_complete':
//                 stages.forEach(stageEl => stageEl.classList.add('completed'));
//                 this.showFinalImage(item, timestamp);
//                 break;
//         }
        
//         // Update active stage
//         const activeStage = item.querySelector(`.${stage.split('_')[0]}`);
//         if (activeStage) {
//             activeStage.classList.add('active');
//         }
        
//         // Update timestamp
//         item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
//     }

//     showFinalImage(item, timestamp) {
//         // You can extend this to actually show the final image
//         const finalBadge = document.createElement('div');
//         finalBadge.className = 'final-badge';
//         finalBadge.textContent = '🎉 Processing Complete!';
//         item.appendChild(finalBadge);
//     }

//     formatFileName(name) {
//         return name.length > 30 ? name.substring(0, 27) + '...' : name;
//     }

//     getSession() {
//         return JSON.parse(localStorage.getItem('cognitoSession'));
//     }

//     renderUpdatesPanel() {
//         const uploadSection = document.getElementById('uploadSection');
//         if (!uploadSection) return;

//         const updatesHTML = `
//             <div id="realtimePanel" style="margin-top: 20px; display: none;">
//                 <h3>🔄 Real-time Processing Updates</h3>
//                 <div id="realtimeUpdates" class="updates-container"></div>
//             </div>
//         `;
        
//         uploadSection.insertAdjacentHTML('afterend', updatesHTML);
//     }

//     showPanel() {
//         const panel = document.getElementById('realtimePanel');
//         if (panel) panel.style.display = 'block';
//     }

//     hidePanel() {
//         const panel = document.getElementById('realtimePanel');
//         if (panel) panel.style.display = 'none';
//     }
// }



class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
    }

    initialize() {
        this.setupWebSocket();
        this.renderUpdatesPanel();
    }

    setupWebSocket() {
        const WS_URL = 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production';
        this.socket = new WebSocket(WS_URL);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.authenticateWebSocket();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleUpdate(data);
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    authenticateWebSocket() {
        const session = this.getSession();
        if (session && session.id_token) {
            this.socket.send(JSON.stringify({
                action: 'authorize',
                id_token: session.id_token
            }));
            this.isConnected = true;
        }
    }

    handleUpdate(data) {
        console.log('Received update:', data);
        
        switch(data.type) {
            case 'image_update':
                this.updateImageStatus(data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    updateImageStatus(update) {
        const container = document.getElementById('realtimeUpdates');
        if (!container) return;

        const fileName = update.fileName;
        const stage = update.stage;
        
        let item = this.pendingImages.get(fileName);
        if (!item) {
            item = this.createProgressItem(fileName);
            this.pendingImages.set(fileName, item);
        }
        
        this.updateProgressItem(item, stage, update.timestamp);
    }

    createProgressItem(fileName) {
        const container = document.getElementById('realtimeUpdates');
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.innerHTML = `
            <div class="file-name">${this.formatFileName(fileName)}</div>
            <div class="current-stage">Starting...</div>
            <div class="timestamp"></div>
        `;
        container.appendChild(item);
        return item;
    }

    updateProgressItem(item, stage, timestamp) {
        // Update current stage text
        const stageElement = item.querySelector('.current-stage');
        stageElement.textContent = stage;
        
        // Update timestamp
        item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
        
        // Add visual feedback based on stage
        item.className = 'progress-item ' + stage.toLowerCase().replace(/\s+/g, '-');
        
        // Show completion
        if (stage === 'Getting mockup files') {
            const finalBadge = document.createElement('div');
            finalBadge.className = 'final-badge';
            finalBadge.textContent = '✅ Complete!';
            if (!item.querySelector('.final-badge')) {
                item.appendChild(finalBadge);
            }
        }
    }

    formatFileName(name) {
        // Extract just the filename from path
        const filename = name.split('/').pop();
        return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
    }

    getSession() {
        return JSON.parse(localStorage.getItem('cognitoSession'));
    }

    renderUpdatesPanel() {
        const uploadSection = document.getElementById('uploadSection');
        if (!uploadSection) return;

        const updatesHTML = `
            <div id="realtimePanel" style="margin-top: 20px; display: none;">
                <h3>🔄 Processing Updates</h3>
                <div id="realtimeUpdates" class="updates-container"></div>
            </div>
        `;
        
        uploadSection.insertAdjacentHTML('afterend', updatesHTML);
    }

    showPanel() {
        const panel = document.getElementById('realtimePanel');
        if (panel) panel.style.display = 'block';
    }

    hidePanel() {
        const panel = document.getElementById('realtimePanel');
        if (panel) panel.style.display = 'none';
    }
}
