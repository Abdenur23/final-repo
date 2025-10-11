// Initialize managers
const fileManager = new FileManager();
const uploadManager = new UploadManager();
const uiManager = new UIManager();

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadBtn = document.getElementById('uploadBtn');
const consentCheckbox = document.getElementById('consentCheckbox');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    initializeEventListeners();
});

function initializeDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);
}

function initializeEventListeners() {
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    consentCheckbox.addEventListener('change', () => uiManager.validateUpload(fileManager.selectedFiles.size === fileManager.MAX_FILES));
    uploadBtn.addEventListener('click', handleUpload);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = Array.from(dt.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
        fileManager.handleFiles(files);
    }
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
        fileManager.handleFiles(files);
    }
}

async function handleUpload() {
    if (fileManager.selectedFiles.size !== fileManager.MAX_FILES || !consentCheckbox.checked) {
        return;
    }

    uiManager.showProgress();

    try {
        // Prepare files data
        const filesData = Array.from(fileManager.selectedFiles.entries()).map(([fileId, file]) => ({
            fileId: fileId,
            fileName: file.name,
            fileType: file.type
        }));

        // Get presigned URLs
        const uploadUrls = await uploadManager.uploadFiles(filesData);

        if (!uploadUrls || uploadUrls.length === 0) {
            throw new Error('No upload URLs received from server');
        }

        // Create progress bars
        const fileProgressMap = uiManager.createProgressBars(uploadUrls);
        uiManager.progressText.textContent = 'Uploading your floral images...';

        // Upload all files
        const uploadPromises = uploadUrls.map(async (urlData) => {
            const file = fileManager.selectedFiles.get(urlData.fileId);
            if (!file) {
                throw new Error(`File not found: ${urlData.fileName}`);
            }

            const progressData = fileProgressMap.get(urlData.fileId);
            
            return uploadManager.uploadFileToS3(urlData, file, (percent) => {
                uiManager.updateProgress(progressData, percent);
            });
        });

        await Promise.all(uploadPromises);

        // Success
        uiManager.showSuccess();

        // Reset form after delay
        setTimeout(() => {
            fileManager.clearFiles();
            fileInput.value = '';
            consentCheckbox.checked = false;
            uiManager.resetUI();
        }, 5000);

    } catch (error) {
        console.error('Upload error:', error);
        uiManager.showError(error);
    }
}

// Export for global access (for onclick handlers in HTML)
window.fileManager = fileManager;
