displayDesign(designData) {
    const container = document.getElementById('realtimeUpdates');
    const designId = designData.designId;

    if (document.getElementById(`design-${designId}`)) return;

    const product = document.createElement('div');
    product.id = `design-${designId}`;
    product.className = 'product-item';

    product.innerHTML = `
        <h4>Phone Case – ${designId.replace('design_', 'Color ')} ($35)</h4>
        <div class="product-gallery">
            ${Object.values(designData.imageUrls).map(url => `
                <img src="${url}" alt="case view"
                     onload="this.style.opacity='1'"
                     onerror="this.style.display='none'"
                     style="opacity:0;transition:opacity 0.3s;width:130px;height:auto;border:1px solid #ccc;border-radius:6px;margin:4px;background:#fff;" />
            `).join('')}
        </div>
        <button class="add-to-cart-btn">Add to Cart</button>
    `;

    container.appendChild(product);

    // progress feedback
    console.log(`✅ New product batch ready: ${designId}`);
}


// Add CSS styles
const styleSheet = document.createElement('style');
styleSheet.textContent += `
.product-item {
    border: 1px solid #aaa;
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    background: #fefefe;
}
.product-item h4 {
    margin: 0 0 10px;
    font-size: 16px;
}
.product-gallery {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}
.add-to-cart-btn {
    margin-top: 10px;
    padding: 6px 12px;
    border: 1px solid #333;
    background: #eee;
    cursor: pointer;
    border-radius: 4px;
}
.add-to-cart-btn:hover {
    background: #ddd;
}
`;

styleSheet.textContent = `
.design-container {
    border: 2px solid #4CAF50;
    padding: 15px;
    margin: 10px 0;
    border-radius: 8px;
    background: #f8fff8;
}
.design-container h4 {
    margin: 0 0 15px 0;
    color: #2c5aa0;
    font-size: 18px;
}
.design-views {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    justify-content: center;
}
.view-container {
    text-align: center;
    flex: 1;
    min-width: 150px;
    max-width: 200px;
}
.view-label {
    font-weight: bold;
    margin-bottom: 5px;
    color: #555;
}
.view-container img {
    width: 100%;
    height: 150px;
    object-fit: contain;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px;
    background: white;
}
.progress-item {
    padding: 10px;
    margin: 5px 0;
    border-left: 4px solid #007bff;
    background: white;
    border-radius: 4px;
}
.progress-item img {
    border: 1px solid #ddd;
    border-radius: 4px;
}
`;
document.head.appendChild(styleSheet);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.realtimeUpdates = new RealTimeUpdates();
    window.realtimeUpdates.initialize();
});
