// File upload management
class UploadManager {
    constructor() {
        this.selectedFiles = [];
        this.uploadInProgress = false;
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        const uploadBtn = document.querySelector('button[onclick="uploadFiles()"]');
        if (uploadBtn) {
            uploadBtn.onclick = () => this.uploadFiles();
        }
    }

    handleFileSelect(event) {
        this.selectedFiles = Array.from(event.target.files);
        if (this.selectedFiles.length !== CONFIG.PRODUCT.MAX_IMAGES) {
            this.showMessage('Please select exactly 3 images', 'warning');
        }
    }

    async uploadFiles() {
        if (this.uploadInProgress) return;
        
        const token = getSession()?.id_token;
        const deviceId = document.getElementById('deviceSelect')?.value;

        if (!token) {
            this.showMessage('Please sign in first', 'error');
            return;
        }

        if (!deviceId) {
            this.showMessage('Please select a device before uploading', 'error');
            return;
        }

        if (this.selectedFiles.length !== CONFIG.PRODUCT.MAX_IMAGES) {
            this.showMessage('Please select exactly 3 images', 'error');
            return;
        }

        this.uploadInProgress = true;
        this.disableUploadInterface();

        try {
            const result = await this.processUpload(token, deviceId);
            this.showMessage('✅ All 3 files uploaded successfully! Processing started...', 'success');
            
            // Initialize realtime updates
            if (window.realtimeUpdates) {
                window.realtimeUpdates.showPanel();
                window.realtimeUpdates.resetForNewUpload();
            }
        } catch (error) {
            this.showMessage(`❌ Upload failed: ${error.message}`, 'error');
        } finally {
            this.uploadInProgress = false;
            this.enableUploadInterface();
        }
    }

    async processUpload(token, deviceId) {
        const filesData = this.selectedFiles.map((file, index) => ({
            fileId: index + 1,
            fileName: file.name,
            fileType: file.type
        }));

        const response = await fetch(CONFIG.API.BASE_URL + CONFIG.API.UPLOAD_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ 
                files: filesData, 
                device_id: deviceId 
            })
        });

        const data = await response.json();

        if (!response.ok || !data.uploadUrls) {
            throw new Error(data.error || 'Upload preparation failed');
        }

        // Upload files to S3
        await this.uploadToS3(data.uploadUrls);
        return data;
    }

    async uploadToS3(uploadUrls) {
        const uploadPromises = uploadUrls.map(async (uploadInfo, index) => {
            const response = await fetch(uploadInfo.uploadUrl, {
                method: 'PUT',
                body: this.selectedFiles[index],
                headers: { 'Content-Type': this.selectedFiles[index].type }
            });

            if (!response.ok) {
                throw new Error(`Failed to upload ${uploadInfo.fileName}`);
            }

            // Notify backend of upload completion
            await this.notifyUploadComplete(uploadInfo);
        });

        await Promise.all(uploadPromises);
    }

    async notifyUploadComplete(uploadInfo) {
        const token = getSession()?.id_token;
        const notificationPayload = {
            action: 'uploadComplete',
            fileKey: uploadInfo.key,
            metadata: {
                fileName: uploadInfo.fileName,
                priority: uploadInfo.priority,
                srcid: uploadInfo.srcid,
                palette_id: uploadInfo.palette_id,
                flavor: uploadInfo.flavor,
                cid: uploadInfo.cid,
                device_id: document.getElementById('deviceSelect')?.value
            }
        };

        await fetch(CONFIG.API.BASE_URL + CONFIG.API.UPLOAD_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify(notificationPayload)
        });
    }

    showMessage(message, type) {
        const resultDiv = document.getElementById('uploadResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="upload-message ${type}">
                    ${message}
                </div>
            `;
        }
    }

    disableUploadInterface() {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.querySelector('button[onclick="uploadFiles()"]');
        
        if (fileInput) fileInput.disabled = true;
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';
        }
    }

    enableUploadInterface() {
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.querySelector('button[onclick="uploadFiles()"]');
        
        if (fileInput) fileInput.disabled = false;
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
        }
    }

    reset() {
        this.selectedFiles = [];
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        this.showMessage('', '');
    }
}
