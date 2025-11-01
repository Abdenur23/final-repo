class ProgressTracker {
    constructor() {
        this.pendingItems = new Map();
        this.processedFiles = new Set();
        this.completedDesigns = new Map();
    }

    trackProgress(itemKey, data = {}) {
        if (!this.pendingItems.has(itemKey)) {
            this.pendingItems.set(itemKey, {
                key: itemKey,
                stages: [],
                startTime: Date.now(),
                ...data
            });
        }
        return this.pendingItems.get(itemKey);
    }

    updateProgress(itemKey, stage, metadata = {}) {
        const item = this.pendingItems.get(itemKey);
        if (item) {
            item.stages.push({
                stage,
                timestamp: Date.now(),
                ...metadata
            });
            item.currentStage = stage;
            item.lastUpdate = Date.now();
        }
    }

    // markComplete(itemKey, result) {
    //     const item = this.pendingItems.get(itemKey);
    //     if (item) {
    //         item.completed = true;
    //         item.completionTime = Date.now();
    //         item.result = result;
    //         this.pendingItems.delete(itemKey);
    //         this.completedDesigns.set(itemKey, result);
    //     }
    // }
    markComplete(itemKey, result) {
        const item = this.pendingItems.get(itemKey);
        if (item) {
            item.completed = true;
            item.completionTime = Date.now();
            item.result = result;
            this.pendingItems.delete(itemKey);
        }
        // ALWAYS store in completedDesigns, regardless of pending status
        this.completedDesigns.set(itemKey, result);
    }

    isDuplicateUpdate(fileName, stage) {
        const fileKey = fileName + '_' + stage;
        if (this.processedFiles.has(fileKey)) {
            return true;
        }
        this.processedFiles.add(fileKey);
        return false;
    }

    extractDesignId(fileName) {
        const match = fileName.match(/_palette_id_(\d+)_flavor_(\d+)/);
        return match ? `design_${match[1]}_${match[2]}` : null;
    }

    getProgress(itemKey) {
        return this.pendingItems.get(itemKey);
    }

    getCompletedDesign(designId) {
        console.log('Looking for design:', designId);
        console.log('Available designs:', Array.from(this.completedDesigns.keys()));
        return this.completedDesigns.get(designId);
    }

    hasCompletedDesigns() {
        return this.completedDesigns.size > 0;
    }

    reset() {
        this.pendingItems.clear();
        this.processedFiles.clear();
        this.completedDesigns.clear();
    }
}
