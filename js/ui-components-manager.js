// class UIComponentsManager {
//     constructor() {
//         this.components = new Map();
//     }

//     // Progress Item Component
//     createProgressItem(itemKey, friendlyName) {
//         const id = `progress-${itemKey}`;
//         const html = `
//             <div id="${id}" class="progress-item">
//                 <div class="progress-content">
//                     <div class="file-name">${friendlyName}</div>
//                     <div class="current-stage">🔄 Processing started...</div>
//                     <div class="timestamp">${new Date().toLocaleTimeString()}</div>
//                 </div>
//                 <div class="image-container"></div>
//             </div>
//         `;
//         return { id, html };
//     }

//     // Product Card Component
//     createProductCard(designData, priceInfo) {
//         const designId = designData.designId;
//         const paletteName = designData.paletteName || 'Custom Design';
//         const imageUrls = Object.values(designData.imageUrls);
        
//         const priceHtml = priceInfo.discount > 0 ? 
//             `<span style="text-decoration: line-through; color: #6c757d; margin-right: 8px;">$${priceInfo.original.toFixed(2)}</span>
//              <span style="color: #28a745;">$${priceInfo.discounted.toFixed(2)}</span>
//              <div style="font-size: 12px; color: #28a745;">${priceInfo.discount}% OFF</div>` :
//             `$${priceInfo.original.toFixed(2)}`;

//         const html = `
//             <div id="design-${designId}" class="product-card">
//                 <div class="product-header">
//                     <h4>${paletteName}</h4>
//                     <div class="product-price">${priceHtml}</div>
//                 </div>
                
//                 <div class="design-viewer">
//                     <div class="main-image-container">
//                         <img src="${imageUrls[0]}" alt="${paletteName}" 
//                              class="main-image"
//                              onload="this.style.opacity='1'" 
//                              onerror="this.style.display='none'"
//                              style="opacity: 0; transition: opacity 0.3s ease; cursor: pointer;" />
//                     </div>
//                     <div class="image-navigation">
//                         <button class="nav-btn prev-btn">‹</button>
//                         <div class="image-counter">
//                             <span class="current-image">1</span> / <span class="total-images">${imageUrls.length}</span>
//                         </div>
//                         <button class="nav-btn next-btn">›</button>
//                     </div>
//                 </div>
                
//                 <button class="add-to-cart-btn">
//                     Add to Cart - $${priceInfo.discounted.toFixed(2)}
//                 </button>
//             </div>
//         `;
        
//         return { id: `design-${designId}`, html, metadata: { imageUrls, currentIndex: 0 } };
//     }

//     // Image Popup Component
//     createImagePopup(designId, imageIndex, imageUrls) {
//         const html = `
//             <div class="image-popup-overlay">
//                 <div class="image-popup-content">
//                     <button class="popup-close">&times;</button>
//                     <img src="${imageUrls[imageIndex]}" alt="Full size preview" class="popup-image">
//                     <div class="popup-navigation">
//                         <button class="nav-btn prev-btn">‹</button>
//                         <span class="popup-counter">${imageIndex + 1} / ${imageUrls.length}</span>
//                         <button class="nav-btn next-btn">›</button>
//                     </div>
//                 </div>
//             </div>
//         `;
//         return html;
//     }

//     // Updates Panel Component
//     createUpdatesPanel() {
//         const html = `
//             <div id="realtimePanel" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
//                 <div id="realtimeUpdates" class="updates-container"></div>
//             </div>
//         `;
//         return html;
//     }

//     // Products Container Component
//     createProductsContainer() {
//         const html = `
//             <div id="productsContainer" class="products-container">
//                 <h3>Your Custom Phone Cases</h3>
//             </div>
//         `;
//         return html;
//     }

//     registerComponent(name, component) {
//         this.components.set(name, component);
//     }

//     getComponent(name) {
//         return this.components.get(name);
//     }
// }


class UIComponentsManager {
    constructor() {
        this.components = new Map();
    }

    // Progress Item Component
    createProgressItem(itemKey, friendlyName) {
        const id = `progress-${itemKey}`;
        const html = `
            <div id="${id}" class="progress-item">
                <div class="progress-content">
                    <div class="file-name">${friendlyName}</div>
                    <div class="current-stage">🔄 Processing started...</div>
                    <div class="timestamp">${new Date().toLocaleTimeString()}</div>
                </div>
                <div class="image-container"></div>
            </div>
        `;
        return { id, html };
    }

    // Product Card Component - FIXED: Ensure all required data exists
    createProductCard(designData, priceInfo) {
        const designId = designData.designId;
        const paletteName = designData.paletteName || 'Custom Design';
        const imageUrls = designData.imageUrls ? Object.values(designData.imageUrls) : [];
        
        // Ensure we have at least one image URL
        if (imageUrls.length === 0) {
            console.warn('No image URLs found in design data:', designData);
            imageUrls.push('/images/placeholder.jpg'); // Fallback image
        }

        const priceHtml = priceInfo.discount > 0 ? 
            `<span style="text-decoration: line-through; color: #6c757d; margin-right: 8px;">$${priceInfo.original.toFixed(2)}</span>
             <span style="color: #28a745;">$${priceInfo.discounted.toFixed(2)}</span>
             <div style="font-size: 12px; color: #28a745;">${priceInfo.discount}% OFF</div>` :
            `$${priceInfo.original.toFixed(2)}`;

        const html = `
            <div id="design-${designId}" class="product-card">
                <div class="product-header">
                    <h4>${this.escapeHtml(paletteName)}</h4>
                    <div class="product-price">${priceHtml}</div>
                </div>
                
                <div class="design-viewer">
                    <div class="main-image-container">
                        <img src="${imageUrls[0]}" alt="${this.escapeHtml(paletteName)}" 
                             class="main-image"
                             onload="this.style.opacity='1'" 
                             onerror="this.style.display='none'"
                             style="opacity: 0; transition: opacity 0.3s ease; cursor: pointer;" />
                    </div>
                    <div class="image-navigation">
                        <button class="nav-btn prev-btn">‹</button>
                        <div class="image-counter">
                            <span class="current-image">1</span> / <span class="total-images">${imageUrls.length}</span>
                        </div>
                        <button class="nav-btn next-btn">›</button>
                    </div>
                </div>
                
                <button class="add-to-cart-btn">
                    Add to Cart - $${priceInfo.discounted.toFixed(2)}
                </button>
            </div>
        `;
        
        return { 
            id: `design-${designId}`, 
            html, 
            metadata: { 
                imageUrls, 
                currentIndex: 0 
            } 
        };
    }

    // Helper method to escape HTML
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    createImagePopup(designId, imageIndex, imageUrls) {
        const html = `
            <div class="image-popup-overlay">
                <div class="image-popup-content">
                    <button class="popup-close">&times;</button>
                    <img src="${imageUrls[imageIndex]}" alt="Full size preview" class="popup-image">
                    <div class="popup-navigation">
                        <button class="nav-btn prev-btn">‹</button>
                        <span class="popup-counter">${imageIndex + 1} / ${imageUrls.length}</span>
                        <button class="nav-btn next-btn">›</button>
                    </div>
                </div>
            </div>
        `;
        return html;
    }
    
    // Updates Panel Component
    createUpdatesPanel() {
        const html = `
            <div id="realtimePanel" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
                <div id="realtimeUpdates" class="updates-container"></div>
            </div>
        `;
        return html;
    }
    
    // Products Container Component
    createProductsContainer() {
        const html = `
            <div id="productsContainer" class="products-container">
                <h3>Your Custom Phone Cases</h3>
            </div>
        `;
        return html;
    }
    


    registerComponent(name, component) {
        this.components.set(name, component);
    }

    getComponent(name) {
        return this.components.get(name);
    }
}
