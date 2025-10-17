
// // // class RealTimeUpdates {
// // //     constructor() {
// // //         this.socket = null;
// // //         this.isConnected = false;
// // //         this.pendingImages = new Map();
// // //     }

// // //     initialize() {
// // //         this.setupWebSocket();
// // //         this.renderUpdatesPanel();
// // //     }

// // //     setupWebSocket() {
// // //         const WS_URL = 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production';
// // //         this.socket = new WebSocket(WS_URL);
        
// // //         this.socket.onopen = () => {
// // //             console.log('WebSocket connected');
// // //             this.authenticateWebSocket();
// // //         };

// // //         this.socket.onmessage = (event) => {
// // //             const data = JSON.parse(event.data);
// // //             this.handleUpdate(data);
// // //         };

// // //         this.socket.onclose = () => {
// // //             console.log('WebSocket disconnected');
// // //             this.isConnected = false;
// // //             // Attempt reconnect after 5 seconds
// // //             setTimeout(() => this.setupWebSocket(), 5000);
// // //         };
// // //     }

// // //     authenticateWebSocket() {
// // //         const session = this.getSession();
// // //         if (session && session.id_token) {
// // //             this.socket.send(JSON.stringify({
// // //                 action: 'authorize',
// // //                 id_token: session.id_token
// // //             }));
// // //             this.isConnected = true;
// // //         }
// // //     }

// // //     handleUpdate(data) {
// // //         console.log('Received update:', data);
        
// // //         switch(data.type) {
// // //             case 'image_update':
// // //                 this.updateImageStatus(data);
// // //                 break;
// // //             default:
// // //                 console.log('Unknown message type:', data.type);
// // //         }
// // //     }

// // //     updateImageStatus(update) {
// // //         const container = document.getElementById('realtimeUpdates');
// // //         if (!container) return;

// // //         const fileName = update.fileName;
// // //         const stage = update.stage;
        
// // //         // Create or update progress item
// // //         let item = this.pendingImages.get(fileName);
// // //         if (!item) {
// // //             item = this.createProgressItem(fileName);
// // //             this.pendingImages.set(fileName, item);
// // //         }
        
// // //         this.updateProgressItem(item, stage, update.timestamp);
// // //     }

// // //     createProgressItem(fileName) {
// // //         const container = document.getElementById('realtimeUpdates');
// // //         const item = document.createElement('div');
// // //         item.className = 'progress-item';
// // //         item.innerHTML = `
// // //             <div class="file-name">${this.formatFileName(fileName)}</div>
// // //             <div class="progress-stages">
// // //                 <div class="stage uploaded">📤 Uploaded</div>
// // //                 <div class="stage stage1">🔄 Stage 1</div>
// // //                 <div class="stage stage2">🔄 Stage 2</div>
// // //                 <div class="stage final">✅ Final</div>
// // //             </div>
// // //             <div class="timestamp"></div>
// // //         `;
// // //         container.appendChild(item);
// // //         return item;
// // //     }

// // //     updateProgressItem(item, stage, timestamp) {
// // //         // Update stage indicators
// // //         const stages = item.querySelectorAll('.stage');
// // //         stages.forEach(stageEl => stageEl.classList.remove('active', 'completed'));
        
// // //         switch(stage) {
// // //             case 'uploaded':
// // //                 item.querySelector('.uploaded').classList.add('completed');
// // //                 break;
// // //             case 'stage1_complete':
// // //                 item.querySelector('.uploaded').classList.add('completed');
// // //                 item.querySelector('.stage1').classList.add('completed');
// // //                 break;
// // //             case 'stage2_complete':
// // //                 item.querySelector('.uploaded').classList.add('completed');
// // //                 item.querySelector('.stage1').classList.add('completed');
// // //                 item.querySelector('.stage2').classList.add('completed');
// // //                 break;
// // //             case 'final_complete':
// // //                 stages.forEach(stageEl => stageEl.classList.add('completed'));
// // //                 this.showFinalImage(item, timestamp);
// // //                 break;
// // //         }
        
// // //         // Update active stage
// // //         const activeStage = item.querySelector(`.${stage.split('_')[0]}`);
// // //         if (activeStage) {
// // //             activeStage.classList.add('active');
// // //         }
        
// // //         // Update timestamp
// // //         item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
// // //     }

// // //     showFinalImage(item, timestamp) {
// // //         // You can extend this to actually show the final image
// // //         const finalBadge = document.createElement('div');
// // //         finalBadge.className = 'final-badge';
// // //         finalBadge.textContent = '🎉 Processing Complete!';
// // //         item.appendChild(finalBadge);
// // //     }

// // //     formatFileName(name) {
// // //         return name.length > 30 ? name.substring(0, 27) + '...' : name;
// // //     }

// // //     getSession() {
// // //         return JSON.parse(localStorage.getItem('cognitoSession'));
// // //     }

// // //     renderUpdatesPanel() {
// // //         const uploadSection = document.getElementById('uploadSection');
// // //         if (!uploadSection) return;

// // //         const updatesHTML = `
// // //             <div id="realtimePanel" style="margin-top: 20px; display: none;">
// // //                 <h3>🔄 Real-time Processing Updates</h3>
// // //                 <div id="realtimeUpdates" class="updates-container"></div>
// // //             </div>
// // //         `;
        
// // //         uploadSection.insertAdjacentHTML('afterend', updatesHTML);
// // //     }

// // //     showPanel() {
// // //         const panel = document.getElementById('realtimePanel');
// // //         if (panel) panel.style.display = 'block';
// // //     }

// // //     hidePanel() {
// // //         const panel = document.getElementById('realtimePanel');
// // //         if (panel) panel.style.display = 'none';
// // //     }
// // // }

// // // --------------------------------------

// // class RealTimeUpdates {
// //     constructor() {
// //         this.socket = null;
// //         this.isConnected = false;
// //         this.pendingImages = new Map();
// //     }

// //     initialize() {
// //         this.setupWebSocket();
// //         this.renderUpdatesPanel();
// //     }

// //     setupWebSocket() {
// //         const WS_URL = 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production';
// //         this.socket = new WebSocket(WS_URL);
        
// //         this.socket.onopen = () => {
// //             console.log('WebSocket connected');
// //             this.authenticateWebSocket();
// //         };

// //         this.socket.onmessage = (event) => {
// //             const data = JSON.parse(event.data);
// //             this.handleUpdate(data);
// //         };

// //         this.socket.onclose = () => {
// //             console.log('WebSocket disconnected');
// //             this.isConnected = false;
// //             setTimeout(() => this.setupWebSocket(), 5000);
// //         };
// //     }

// //     authenticateWebSocket() {
// //         const session = this.getSession();
// //         if (session && session.id_token) {
// //             this.socket.send(JSON.stringify({
// //                 action: 'authorize',
// //                 id_token: session.id_token
// //             }));
// //             this.isConnected = true;
// //         }
// //     }

// //     handleUpdate(data) {
// //         console.log('Received update:', data);
        
// //         switch(data.type) {
// //             case 'image_update':
// //                 this.updateImageStatus(data);
// //                 break;
// //             default:
// //                 console.log('Unknown message type:', data.type);
// //         }
// //     }

// //     updateImageStatus(update) {
// //         const container = document.getElementById('realtimeUpdates');
// //         if (!container) return;

// //         const fileName = update.fileName;
// //         const stage = update.stage;
        
// //         let item = this.pendingImages.get(fileName);
// //         if (!item) {
// //             item = this.createProgressItem(fileName);
// //             this.pendingImages.set(fileName, item);
// //         }
        
// //         this.updateProgressItem(item, stage, update.timestamp);
// //     }

// //     createProgressItem(fileName) {
// //         const container = document.getElementById('realtimeUpdates');
// //         const item = document.createElement('div');
// //         item.className = 'progress-item';
// //         item.innerHTML = `
// //             <div class="file-name">${this.formatFileName(fileName)}</div>
// //             <div class="current-stage">Starting...</div>
// //             <div class="timestamp"></div>
// //         `;
// //         container.appendChild(item);
// //         return item;
// //     }

// //     updateProgressItem(item, stage, timestamp) {
// //         // Update current stage text
// //         const stageElement = item.querySelector('.current-stage');
// //         stageElement.textContent = stage;
        
// //         // Update timestamp
// //         item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
        
// //         // Add visual feedback based on stage
// //         item.className = 'progress-item ' + stage.toLowerCase().replace(/\s+/g, '-');
        
// //         // Show completion
// //         if (stage === 'Getting mockup files') {
// //             const finalBadge = document.createElement('div');
// //             finalBadge.className = 'final-badge';
// //             finalBadge.textContent = '✅ Complete!';
// //             if (!item.querySelector('.final-badge')) {
// //                 item.appendChild(finalBadge);
// //             }
// //         }
// //     }

// //     formatFileName(name) {
// //         // Extract just the filename from path
// //         const filename = name.split('/').pop();
// //         return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
// //     }

// //     getSession() {
// //         return JSON.parse(localStorage.getItem('cognitoSession'));
// //     }

// //     renderUpdatesPanel() {
// //         const uploadSection = document.getElementById('uploadSection');
// //         if (!uploadSection) return;

// //         const updatesHTML = `
// //             <div id="realtimePanel" style="margin-top: 20px; display: none;">
// //                 <h3>🔄 Processing Updates</h3>
// //                 <div id="realtimeUpdates" class="updates-container"></div>
// //             </div>
// //         `;
        
// //         uploadSection.insertAdjacentHTML('afterend', updatesHTML);
// //     }

// //     showPanel() {
// //         const panel = document.getElementById('realtimePanel');
// //         if (panel) panel.style.display = 'block';
// //     }

// //     hidePanel() {
// //         const panel = document.getElementById('realtimePanel');
// //         if (panel) panel.style.display = 'none';
// //     }
// // }
// // // ---------------------
// class RealTimeUpdates {
//     constructor() {
//         this.socket = null;
//         this.isConnected = false;
//         this.pendingImages = new Map();
//         this.mockupProducts = new Map();
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
        
//         // Handle Mockup ready images
//         if (stage === 'Getting mockup files' && update.imageUrl) {
//             this.handleMockupReady(update);
//             return;
//         }
        
//         let item = this.pendingImages.get(fileName);
//         if (!item) {
//             item = this.createProgressItem(fileName);
//             this.pendingImages.set(fileName, item);
//         }
        
//         this.updateProgressItem(item, stage, update.timestamp);
//     }

//     handleMockupReady(update) {
//         const cid = this.extractCID(update.fileName);
//         if (!cid) return;

//         if (!this.mockupProducts.has(cid)) {
//             this.mockupProducts.set(cid, []);
//         }
        
//         const productImages = this.mockupProducts.get(cid);
//         productImages.push({
//             fileName: update.fileName,
//             imageUrl: update.imageUrl
//         });
        
//         this.displayMockupGallery(cid, productImages);
//     }

//     extractCID(fileName) {
//         const match = fileName.match(/_cid_([^_]+)_/);
//         return match ? match[1] : null;
//     }

//     displayMockupGallery(cid, imageData) {
//         const existingGallery = document.getElementById(`mockup-gallery-${cid}`);
//         if (existingGallery) {
//             existingGallery.remove();
//         }

//         const container = document.getElementById('realtimeUpdates');
//         const gallery = document.createElement('div');
//         gallery.id = `mockup-gallery-${cid}`;
//         gallery.className = 'mockup-gallery';
//         gallery.innerHTML = `
//             <h4>📱 Product Mockup Ready</h4>
//             <div class="mockup-images" id="images-${cid}">
//                 ${imageData.map(data => 
//                     `<img src="${data.imageUrl}" alt="Product view" loading="lazy" />`
//                 ).join('')}
//             </div>
//         `;
        
//         container.appendChild(gallery);
//         this.loadMockupImages(cid, imageData);
//     }

//     async loadMockupImages(cid, imageData) {
//         const container = document.getElementById(`images-${cid}`);
//         if (!container) return;

//         for (const data of imageData) {
//             const img = container.querySelector(`[src="${data.imageUrl}"]`);
//             if (img) {
//                 try {
//                     await this.preloadImage(data.imageUrl);
//                     img.style.opacity = '1';
//                 } catch (error) {
//                     console.error('Failed to load image:', data.fileName);
//                     img.style.opacity = '0.3';
//                 }
//             }
//         }
//     }

//     preloadImage(src) {
//         return new Promise((resolve, reject) => {
//             const img = new Image();
//             img.onload = resolve;
//             img.onerror = reject;
//             img.src = src;
//         });
//     }

//     createProgressItem(fileName) {
//         const container = document.getElementById('realtimeUpdates');
//         const item = document.createElement('div');
//         item.className = 'progress-item';
//         item.innerHTML = `
//             <div class="file-name">${this.formatFileName(fileName)}</div>
//             <div class="current-stage">Starting...</div>
//             <div class="timestamp"></div>
//         `;
//         container.appendChild(item);
//         return item;
//     }

//     updateProgressItem(item, stage, timestamp) {
//         const stageElement = item.querySelector('.current-stage');
//         stageElement.textContent = stage;
        
//         item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
//         item.className = 'progress-item ' + stage.toLowerCase().replace(/\s+/g, '-');
        
//         if (stage === 'Getting mockup files') {
//             const finalBadge = document.createElement('div');
//             finalBadge.className = 'final-badge';
//             finalBadge.textContent = '✅ Complete!';
//             if (!item.querySelector('.final-badge')) {
//                 item.appendChild(finalBadge);
//             }
//         }
//     }

//     formatFileName(name) {
//         const filename = name.split('/').pop();
//         return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
//     }

//     getSession() {
//         return JSON.parse(localStorage.getItem('cognitoSession'));
//     }

//     renderUpdatesPanel() {
//         const uploadSection = document.getElementById('uploadSection');
//         if (!uploadSection) return;

//         const updatesHTML = `
//             <div id="realtimePanel" style="margin-top: 20px; display: none;">
//                 <h3>🔄 Processing Updates</h3>
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

// // --- Inject styles ---
// const mockupStyles = `
// .mockup-gallery {
//     border: 1px solid #ddd;
//     padding: 15px;
//     margin: 10px 0;
//     border-radius: 8px;
//     background: #f9f9f9;
// }
// .mockup-gallery h4 {
//     margin: 0 0 10px 0;
//     color: #2c5aa0;
// }
// .mockup-images {
//     display: flex;
//     gap: 10px;
//     flex-wrap: wrap;
// }
// .mockup-images img {
//     width: 120px;
//     height: 120px;
//     object-fit: cover;
//     border-radius: 4px;
//     border: 2px solid #fff;
//     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//     opacity: 0;
//     transition: opacity 0.3s ease;
// }
// `;

// const styleSheet = document.createElement('style');
// styleSheet.textContent = mockupStyles;
// document.head.appendChild(styleSheet);
class RealTimeUpdates {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.pendingImages = new Map();
        // Stores batches of images (design options) grouped by CID
        this.mockupGalleries = new Map(); 
    }

    initialize() {
        this.setupWebSocket();
        this.renderUpdatesPanel();
        this.showPanel();
    }

    setupWebSocket() {
        const WS_URL = 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production';
        this.socket = new WebSocket(WS_URL);
        
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
        console.log('Processing update:', data);
        
        switch(data.type) {
            case 'image_update':
                // Handles continuous progress updates (stages other than 'Mockup ready')
                this.updateImageStatus(data);
                break;
            case 'image_batch_update':
                // Handles the final combined notification
                this.handleMockupReady(data);
                break;
        }
    }

    updateImageStatus(update) {
        console.log('Updating image status:', update);
        const container = document.getElementById('realtimeUpdates');
        if (!container) {
            console.error('realtimeUpdates container not found');
            return;
        }

        const fileName = update.fileName;
        const stage = update.stage;
        
        // Ignore single-file updates if the stage is 'Mockup ready', 
        // as the batch update will be handling the final display.
        if (stage === 'Mockup ready') {
            console.log(`Ignoring single update for Mockup ready file: ${fileName}. Awaiting batch notification.`);
            return;
        }
        
        // Handle other (continuous progress) stages
        let item = this.pendingImages.get(fileName);
        if (!item) {
            item = this.createProgressItem(fileName);
            this.pendingImages.set(fileName, item);
        }
        this.updateProgressItem(item, stage, update.timestamp);
    }

    handleMockupReady(update) {
        // 'update' is the 'image_batch_update' object: {cid, stage, images: [{fileName, imageUrl}, ...]}
        console.log('Handling mockup batch ready:', update);
        
        const cid = update.cid; 
        const imageDataBatch = update.images; // This is the array of 3 images

        if (!cid) {
            console.log('No CID found in batch update:', update);
            return;
        }

        if (!this.mockupGalleries.has(cid)) {
            this.mockupGalleries.set(cid, []);
        }
        
        const designBatches = this.mockupGalleries.get(cid);
        
        // Add the new design option batch
        designBatches.push(imageDataBatch); 
        
        console.log(`Collected ${designBatches.length} design options for CID ${cid}`);
        this.displayMockupGallery(cid, designBatches);
        
        // Remove progress items related to these files since the batch is complete
        imageDataBatch.forEach(img => {
            const item = this.pendingImages.get(img.fileName);
            if(item) {
                item.remove();
                this.pendingImages.delete(img.fileName);
            }
        });
    }

    displayMockupGallery(cid, designBatches) {
        // designBatches is an array of arrays: [[img_design1_view1, img_design1_view2, ...], [img_design2_view1, ...]]
        console.log('Displaying mockup gallery for CID:', cid, 'with', designBatches.length, 'design options');
        
        let galleryContainer = document.getElementById(`mockup-gallery-container-${cid}`);
        if (!galleryContainer) {
            const container = document.getElementById('realtimeUpdates');
            galleryContainer = document.createElement('div');
            galleryContainer.id = `mockup-gallery-container-${cid}`;
            container.appendChild(galleryContainer);
        }
        
        galleryContainer.innerHTML = ''; // Clear previous content

        // Iterate over each design option batch and create a separate gallery section
        designBatches.forEach((batch, designIndex) => {
            const designOptionElement = document.createElement('div');
            designOptionElement.className = 'mockup-gallery';
            designOptionElement.innerHTML = `
                <h4>✅ Design Option ${designIndex + 1} Ready (CID: ${cid})</h4>
                <div class="mockup-images">
                    ${batch.map((data, imageIndex) => {
                        const prefix = data.fileName.split('_')[0];
                        return `
                        <div class="image-container">
                            <img src="${data.imageUrl}" alt="View ${imageIndex + 1}" onload="this.style.opacity='1'" onerror="this.style.opacity='0.3'; console.error('Failed to load image:', this.src)" style="opacity: 0; transition: opacity 0.3s ease;" />
                            <div class="image-label">${prefix}</div>
                        </div>`;
                    }).join('')}
                </div>
            `;
            galleryContainer.appendChild(designOptionElement);
        });
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
        container.prepend(item); // Use prepend to show new progress items at the top
        return item;
    }

    updateProgressItem(item, stage, timestamp) {
        const stageElement = item.querySelector('.current-stage');
        stageElement.textContent = stage;
        item.querySelector('.timestamp').textContent = new Date(timestamp).toLocaleTimeString();
    }

    formatFileName(name) {
        const filename = name.split('/').pop();
        return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
    }

    getSession() {
        return JSON.parse(localStorage.getItem('cognitoSession'));
    }

    renderUpdatesPanel() {
        if (document.getElementById('realtimePanel')) return;

        const uploadSection = document.getElementById('uploadSection');
        const updatesHTML = `
            <div id="realtimePanel" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
                <h3>🔄 Processing Updates</h3>
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
}

// Add CSS styles (updated to include image-label)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
.mockup-gallery {
    border: 2px solid #4CAF50;
    padding: 15px;
    margin: 10px 0;
    border-radius: 8px;
    background: #f8fff8;
}
.mockup-gallery h4 {
    margin: 0 0 15px 0;
    color: #2c5aa0;
    font-size: 18px;
}
.mockup-images {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}
.mockup-images .image-container {
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 5px;
    background: white;
    text-align: center;
}
.mockup-images img {
    width: 200px;
    height: 200px;
    object-fit: contain;
    border-radius: 4px;
    display: block;
}
.image-label {
    margin-top: 5px;
    font-size: 0.8em;
    color: #555;
    font-weight: bold;
}
.progress-item {
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #007bff;
    background: white;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
}
.progress-item .file-name {
    flex-grow: 1;
    font-weight: bold;
}
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
