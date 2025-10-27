class UploadManager {
    constructor(deviceManager, promoManager) {
        this.deviceManager = deviceManager;
        this.promoManager = promoManager;
        this.completedDesignsCount = 0;
    }

    hideUploadSection() {
        document.getElementById('uploadSection').style.display = 'none';
    }

    showUploadSection() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('startOverSection').style.display = 'none';
    }

    showStartOverButton() {
        document.getElementById('startOverSection').style.display = 'block';
    }

    async uploadFiles() {
        const token = getSession()?.id_token;
        const deviceId = document.getElementById('deviceSelect').value;
        const selectedFiles = this.deviceManager.getSelectedFiles();

        if (!token) return alert('Please sign in first');
        if (!deviceId) return alert('Please select a device before uploading');
        if (selectedFiles.length !== 3) return alert('Please select exactly 3 images');

        // Show upload success message IMMEDIATELY
        const resultDiv = document.getElementById('uploadResult');
        resultDiv.innerHTML = '<div class="upload-success">✅ All 3 files uploaded successfully! Processing started...</div>';

        // Hide upload section immediately after upload
        this.hideUploadSection();

        const filesData = selectedFiles.map((file, index) => ({
            fileId: index + 1,
            fileName: file.name,
            fileType: file.type
        }));

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
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
                resultDiv.innerHTML = `<div style="color: #dc3545;">❌ Upload failed: ${data.error || JSON.stringify(data)}</div>`;
                this.showUploadSection(); // Show upload section again if failed
                return;
            }

            // Upload files to S3
            await this.uploadToS3(data.uploadUrls, selectedFiles, data.cid, deviceId, token);

        } catch (error) {
            resultDiv.innerHTML = `<div style="color: #dc3545;">❌ Error uploading files: ${error.message}</div>`;
            this.showUploadSection(); // Show upload section again if failed
        }
        
        if (window.realtimeUpdates) {
            window.realtimeUpdates.showPanel();
        }
    }

    async uploadToS3(uploadUrls, selectedFiles, cid, deviceId, token) {
        const uploadPromises = uploadUrls.map(async (uploadInfo, index) => {
            const uploadResponse = await fetch(uploadInfo.uploadUrl, {
                method: 'PUT',
                body: selectedFiles[index],
                headers: { 'Content-Type': selectedFiles[index].type }
            });

            if (uploadResponse.ok) {
                const notificationPayload = {
                    action: 'uploadComplete',
                    fileKey: uploadInfo.key,
                    metadata: {
                        fileName: uploadInfo.fileName,
                        priority: uploadInfo.priority,
                        srcid: uploadInfo.srcid,
                        palette_id: uploadInfo.palette_id,
                        flavor: uploadInfo.flavor,
                        cid: cid,
                        device_id: deviceId 
                    }
                };

                // Notify Lambda about upload completion
                await fetch(`${CONFIG.API_BASE_URL}/upload`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': 'Bearer ' + token 
                    },
                    body: JSON.stringify(notificationPayload)
                });
            }

            return uploadResponse;
        });

        await Promise.all(uploadPromises);
    }

    startOver() {
        // Clear all displayed products and updates
        const updatesContainer = document.getElementById('realtimeUpdates');
        const productsContainer = document.getElementById('productsContainer');
        
        if (updatesContainer) updatesContainer.innerHTML = '';
        if (productsContainer) productsContainer.innerHTML = '';
        
        // Reset state (but keep promo discount!)
        this.completedDesignsCount = 0;
        this.deviceManager.clearSelectedFiles();
        document.getElementById('uploadResult').innerHTML = '';
        
        // Reset realtime updates (but keep promo discount!)
        if (window.realtimeUpdates) {
            window.realtimeUpdates.reset();
        }
        
        // Show upload section again
        this.showUploadSection();
    }

    incrementCompletedDesigns() {
        this.completedDesignsCount++;
        if (this.completedDesignsCount >= CONFIG.TOTAL_EXPECTED_DESIGNS) {
            this.showStartOverButton();
        }
    }
}
