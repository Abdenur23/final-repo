class FileManager {
    constructor() {
        this.selectedFiles = new Map();
        this.MAX_FILES = 3;
    }

    generateFileId(file) {
        return `${file.name}-${file.size}-${file.lastModified}`;
    }

    handleFiles(newFiles) {
        const availableSlots = this.MAX_FILES - this.selectedFiles.size;
        const filesToAdd = newFiles.slice(0, availableSlots);

        if (filesToAdd.length === 0) {
            this.showWarning(`Maximum ${this.MAX_FILES} images allowed. Remove some images first.`);
            return;
        }

        if (newFiles.length > availableSlots) {
            this.showWarning(`Only ${availableSlots} more image(s) can be added.`);
        }

        filesToAdd.forEach(file => {
            const fileId = this.generateFileId(file);
            
            if (this.selectedFiles.has(fileId)) {
                this.showWarning(`Duplicate image detected: ${file.name}`);
                return;
            }

            this.selectedFiles.set(fileId, file);
        });

        this.updateFileDisplay();
        this.validateUpload();
    }

    removeFile(fileId) {
        this.selectedFiles.delete(fileId);
        this.updateFileDisplay();
        this.validateUpload();
        this.hideWarning();
    }

    updateFileDisplay() {
        const filesGrid = document.getElementById('filesGrid');
        filesGrid.innerHTML = '';
        
        this.selectedFiles.forEach((file, fileId) => {
            const fileCard = this.createFileCard(file, fileId);
            filesGrid.appendChild(fileCard);
        });

        this.addPlaceholderCard();
    }

    createFileCard(file, fileId) {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            fileCard.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}" class="file-preview">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
                <button class="remove-btn" onclick="fileManager.removeFile('${fileId}')">Remove</button>
            `;
        };
        reader.readAsDataURL(file);
        
        return fileCard;
    }

    addPlaceholderCard() {
        const filesGrid = document.getElementById('filesGrid');
        const remainingSlots = this.MAX_FILES - this.selectedFiles.size;
        
        if (remainingSlots > 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'file-card';
            placeholder.style.cursor = 'pointer';
            placeholder.innerHTML = `
                <div style="font-size: 2rem; color: #cbd5e0; margin: 1rem 0;">+</div>
                <div class="file-name" style="color: #a0aec0;">Add Image</div>
                <div class="file-size" style="color: #a0aec0;">${remainingSlots} remaining</div>
            `;
            placeholder.onclick = () => document.getElementById('fileInput').click();
            filesGrid.appendChild(placeholder);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showWarning(message) {
        const warningMessage = document.getElementById('warningMessage');
        warningMessage.textContent = message;
        warningMessage.style.display = 'block';
    }

    hideWarning() {
        const warningMessage = document.getElementById('warningMessage');
        warningMessage.style.display = 'none';
    }

    clearFiles() {
        this.selectedFiles.clear();
        this.updateFileDisplay();
        this.validateUpload();
    }
}
