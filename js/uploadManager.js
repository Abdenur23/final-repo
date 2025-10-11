class UploadManager {
    constructor() {
        this.API_ENDPOINT = 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod/upload';
    }

    async uploadFiles(filesData) {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: filesData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to get presigned URLs');
            }

            return data.uploadUrls || data.urls;

        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    uploadFileToS3(urlData, file, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(urlData.fileName);
                } else {
                    reject(new Error(`Upload failed for ${urlData.fileName} (Status: ${xhr.status})`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error(`Upload failed for ${urlData.fileName}`));
            });

            xhr.open('PUT', urlData.uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    }
}
