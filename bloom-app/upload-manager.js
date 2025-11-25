//upload-manager.js
class UploadManager {
    constructor(studioManager) {
        this.studioManager = studioManager;
        this.completedDesignsCount = 0;
    }

    async uploadFiles(selectedFiles) {
        const token = getSession()?.id_token;
        
        // Or check if all 3 files are selected
        const hasAllFiles = selectedFiles.length === 3;

        if (!token) return alert('Please sign in first');
        
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
                    files: filesData
                })
            });

            const data = await response.json();

            if (!response.ok || !data.uploadUrls) {
                resultDiv.innerHTML = `<div style="color: #dc3545;">❌ Upload failed: ${data.error || JSON.stringify(data)}</div>`;
                return;
            }

            // Upload files to S3
            await this.uploadToS3(data.uploadUrls, selectedFiles, data.cid, token);

        } catch (error) {
            resultDiv.innerHTML = `<div style="color: #dc3545;">❌ Error uploading files: ${error.message}</div>`;
        }
    }

    async uploadToS3(uploadUrls, selectedFiles, cid, token) {
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
                        device_id: uploadInfo.device_id 
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
}
