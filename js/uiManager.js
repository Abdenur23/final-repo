class UIManager {
    constructor() {
        this.uploadBtn = document.getElementById('uploadBtn');
        this.consentCheckbox = document.getElementById('consentCheckbox');
        this.progressContainer = document.getElementById('progressContainer');
        this.fileProgressContainer = document.getElementById('fileProgressContainer');
        this.progressText = document.getElementById('progressText');
        this.successMessage = document.getElementById('successMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
    }

    validateUpload(hasRequiredFiles) {
        const hasConsent = this.consentCheckbox.checked;
        
        this.uploadBtn.disabled = !(hasRequiredFiles && hasConsent);
        
        if (!hasRequiredFiles) {
            this.uploadBtn.textContent = `Create Design (${fileManager.selectedFiles.size}/${fileManager.MAX_FILES})`;
        } else if (!hasConsent) {
            this.uploadBtn.textContent = 'Please accept terms to continue';
        } else {
            this.uploadBtn.textContent = 'Create My Design';
        }
    }

    showProgress() {
        this.uploadBtn.disabled = true;
        this.progressContainer.style.display = 'block';
        this.successMessage.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.progressText.textContent = 'Preparing your design...';
    }

    createProgressBars(uploadUrls) {
        this.fileProgressContainer.innerHTML = '';
        const fileProgressMap = new Map();

        uploadUrls.forEach((urlData) => {
            const fileProgress = document.createElement('div');
            fileProgress.className = 'file-progress';
            fileProgress.innerHTML = `
                <div class="file-progress-info">
                    <span>${urlData.fileName}</span>
                    <span class="progress-percent">0%</span>
                </div>
                <div class="file-progress-bar">
                    <div class="file-progress-fill" data-file="${urlData.fileId}"></div>
                </div>
            `;
            this.fileProgressContainer.appendChild(fileProgress);
            fileProgressMap.set(urlData.fileId, {
                element: fileProgress.querySelector('.file-progress-fill'),
                percent: fileProgress.querySelector('.progress-percent')
            });
        });

        return fileProgressMap;
    }

    updateProgress(progressData, percentComplete) {
        if (progressData) {
            progressData.element.style.width = percentComplete + '%';
            progressData.percent.textContent = Math.round(percentComplete) + '%';
        }
    }

    showSuccess() {
        this.progressText.textContent = 'Design creation complete!';
        this.successMessage.style.display = 'flex';
    }

    showError(error) {
        this.errorText.textContent = error.message;
        this.errorMessage.style.display = 'flex';
        this.uploadBtn.disabled = false;
        this.uploadBtn.textContent = 'Try Again';
    }

    resetUI() {
        this.progressContainer.style.display = 'none';
        this.successMessage.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.validateUpload(fileManager.selectedFiles.size === fileManager.MAX_FILES);
    }
}
