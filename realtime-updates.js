
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
        this.productVariants = new Map();
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
                this.updateImageStatus(data);
                break;
            case 'coordinated_mockup_ready':
                this.handleCoordinatedMockupReady(data);
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
        
        // Handle Mockup ready images (individual notifications)
        if (stage === 'Mockup ready' && update.imageUrl) {
            console.log('Mockup ready with image URL:', update.imageUrl);
            this.handleMockupReady(update);
        }
        
        // Handle other stages and progress updates
        let item = this.pendingImages.get(fileName);
        if (!item) {
            item = this.createProgressItem(fileName);
            this.pendingImages.set(fileName, item);
        }
        this.updateProgressItem(item, stage, update.timestamp);
    }

    handleCoordinatedMockupReady(data) {
        console.log('Handling coordinated mockup ready:', data);
        const cid = data.cid;
        const variantId = data.variantId;
        const files = data.files || [];
        
        console.log(`Received coordinated mockup for CID ${cid}, variant ${variantId} with ${files.length} files`);
        
        if (files.length === 0) return;

        // Store or update the product variant
        if (!this.productVariants.has(cid)) {
            this.productVariants.set(cid, []);
        }
        
        const variants = this.productVariants.get(cid);
        const existingVariantIndex = variants.findIndex(v => v.variantId === variantId);
        
        if (existingVariantIndex >= 0) {
            variants[existingVariantIndex] = { variantId, files, timestamp: data.timestamp };
        } else {
            variants.push({ variantId, files, timestamp: data.timestamp });
        }
        
        // Display all variants for this product
        this.displayProductVariants(cid);
        
        // Also update individual progress items for each file
        files.forEach(fileData => {
            this.updateImageStatus({
                fileName: fileData.fileName,
                stage: 'Mockup ready',
                imageUrl: fileData.imageUrl,
                timestamp: data.timestamp
            });
        });
    }

    handleMockupReady(update) {
        console.log('Handling individual mockup ready:', update);
        const cid = this.extractCID(update.fileName);
        if (!cid) {
            console.log('No CID found in filename:', update.fileName);
            return;
        }

        // For individual mockup notifications, still add to the collection
        // but coordinated notifications will take precedence
        if (!this.productVariants.has(cid)) {
            this.productVariants.set(cid, []);
        }
    }

    displayProductVariants(cid) {
        const variants = this.productVariants.get(cid) || [];
        console.log(`Displaying ${variants.length} variants for CID ${cid}`);
        
        let productContainer = document.getElementById(`product-${cid}`);
        if (!productContainer) {
            const updatesContainer = document.getElementById('realtimeUpdates');
            productContainer = document.createElement('div');
            productContainer.id = `product-${cid}`;
            productContainer.className = 'product-container';
            updatesContainer.appendChild(productContainer);
        }
        
        productContainer.innerHTML = `
            <h3>🎨 Complete Product Designs</h3>
            <div class="variants-container">
                ${variants.map((variant, index) => this.renderVariant(variant, index)).join('')}
            </div>
        `;
        
        productContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderVariant(variant, index) {
        const sortedFiles = variant.files.sort((a, b) => 
            a.fileName.localeCompare(b.fileName)
        );
        
        return `
            <div class="variant-card">
                <div class="variant-header">
                    <h4>Design Option ${index + 1}</h4>
                    <span class="variant-badge">${this.formatVariantName(variant.variantId)}</span>
                </div>
                <div class="variant-images">
                    ${sortedFiles.map(file => `
                        <div class="variant-image">
                            <img src="${file.imageUrl}" 
                                 alt="${this.getViewName(file.fileName)}"
                                 onload="this.style.opacity='1'" 
                                 onerror="this.style.opacity='0.3'" 
                                 style="opacity: 0; transition: opacity 0.3s ease;" />
                            <div class="view-label">${this.getViewName(file.fileName)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="variant-timestamp">
                    Generated: ${new Date(variant.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;
    }

    extractCID(fileName) {
        const match = fileName.match(/_cid_([^_]+)_/);
        return match ? match[1] : null;
    }

    getViewName(fileName) {
        const prefix = fileName.split('_')[0];
        const viewMap = {
            'opt-turn_006': 'Front View',
            'opt-turn_010': 'Side View', 
            'opt-turn_014': 'Back View'
        };
        return viewMap[prefix] || prefix;
    }

    formatVariantName(variantId) {
        return variantId.split('_')
            .reduce((acc, part, index, array) => {
                if (index % 2 === 0) {
                    acc.push(part.charAt(0).toUpperCase() + part.slice(1));
                } else {
                    acc[acc.length - 1] += ` ${part}`;
                }
                return acc;
            }, [])
            .join(', ');
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

// Add CSS styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
.product-container {
    margin: 20px 0;
    padding: 20px;
    border: 2px solid #4CAF50;
    border-radius: 12px;
    background: #f8fff8;
}

.product-container h3 {
    margin: 0 0 20px 0;
    color: #2c5aa0;
    font-size: 24px;
    text-align: center;
}

.variants-container {
    display: grid;
    gap: 20px;
}

.variant-card {
    border: 2px solid #2196F3;
    border-radius: 8px;
    padding: 15px;
    background: white;
}

.variant-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.variant-header h4 {
    margin: 0;
    color: #333;
}

.variant-badge {
    background: #2196F3;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.variant-images {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.variant-image {
    text-align: center;
}

.variant-image img {
    width: 180px;
    height: 180px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 4px;
    display: block;
}

.view-label {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    font-weight: bold;
}

.variant-timestamp {
    margin-top: 10px;
    text-align: center;
    font-size: 12px;
    color: #999;
}

.progress-item {
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #007bff;
    background: white;
    border-radius: 4px;
}

.progress-item .file-name {
    font-weight: bold;
    margin-bottom: 5px;
}

.progress-item .current-stage {
    color: #666;
    margin-bottom: 3px;
}

.progress-item .timestamp {
    font-size: 12px;
    color: #999;
}
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
