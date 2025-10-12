class ImageGallery {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.images = new Map(); // key -> image data
    }

    init() {
        this.container.innerHTML = `
            <div class="gallery-header">
                <h3>Processing Pipeline</h3>
                <div class="connection-status" id="connectionStatus">
                    <span class="status-dot disconnected"></span>
                    <span>Disconnected</span>
                </div>
            </div>
            <div class="images-grid" id="imagesGrid"></div>
        `;
        
        this.imagesGrid = document.getElementById('imagesGrid');
        this.connectionStatus = document.getElementById('connectionStatus');
    }

    updateConnectionStatus(status) {
        const statusDot = this.connectionStatus.querySelector('.status-dot');
        const statusText = this.connectionStatus.querySelector('span:last-child');
        
        statusDot.className = 'status-dot ' + status;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }

    addOrUpdateImage(key, imageData) {
        if (!this.images.has(key)) {
            this.images.set(key, imageData);
            this.createImageCard(key, imageData);
        } else {
            this.updateImageCard(key, imageData);
        }
    }

    createImageCard(key, imageData) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.id = `card-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        const imageUrl = `https://136-circulation-bucket.s3.us-east-1.amazonaws.com/${encodeURIComponent(key)}`;
        
        card.innerHTML = `
            <div class="image-container">
                <img src="${imageUrl}" alt="${key}" onerror="this.style.display='none'">
            </div>
            <div class="image-info">
                <div class="filename">${this.getShortName(key)}</div>
                <div class="timestamp">${new Date(imageData.timestamp).toLocaleTimeString()}</div>
                <div class="stage">${this.detectStage(key)}</div>
            </div>
        `;
        
        this.imagesGrid.appendChild(card);
    }

    getShortName(filename) {
        const parts = filename.split('_');
        return parts.slice(-3).join('_'); // Last 3 parts
    }

    detectStage(filename) {
        if (filename.includes('src_')) return 'Source';
        if (filename.includes('processed_')) return 'Processed';
        if (filename.includes('enhanced_')) return 'Enhanced';
        if (filename.includes('final_')) return 'Final';
        return 'Intermediate';
    }
}
