class DesignManager {
    constructor() {
        this.selectedDesigns = new Set();
    }

    displayDesigns(designs) {
        const designsGrid = document.getElementById('designsGrid');
        const designSelection = document.getElementById('designSelection');
        
        designsGrid.innerHTML = '';
        
        designs.forEach((design, index) => {
            const designCard = this.createDesignCard(design, index);
            designsGrid.appendChild(designCard);
        });
        
        // Show design selection section
        designSelection.style.display = 'block';
        
        // Scroll to designs
        designSelection.scrollIntoView({ behavior: 'smooth' });
    }

    createDesignCard(design, index) {
        const designCard = document.createElement('div');
        designCard.className = 'design-card';
        designCard.innerHTML = `
            <div class="design-preview">
                <img src="${design.imageUrl}" alt="Design ${index + 1}" class="design-image">
                <div class="design-overlay">
                    <button class="select-design-btn" data-design="${index}">
                        ${this.selectedDesigns.has(index) ? '✓ Selected' : 'Select Design'}
                    </button>
                </div>
            </div>
            <div class="design-info">
                <h4>Design ${index + 1}</h4>
                <div class="design-features">
                    <span>Includes matching wallpaper</span>
                </div>
                <div class="design-price">$${productManager.getCurrentProduct().price}</div>
            </div>
            <div class="design-selector">
                <input type="checkbox" id="design-${index}" class="design-checkbox" ${this.selectedDesigns.has(index) ? 'checked' : ''}>
                <label for="design-${index}">Add to cart</label>
            </div>
        `;

        // Add event listeners
        const checkbox = designCard.querySelector('.design-checkbox');
        const selectBtn = designCard.querySelector('.select-design-btn');
        
        checkbox.addEventListener('change', (e) => {
            this.toggleDesignSelection(index, e.target.checked);
            this.updateSelectButton(selectBtn, index);
        });
        
        selectBtn.addEventListener('click', () => {
            const isSelected = !this.selectedDesigns.has(index);
            checkbox.checked = isSelected;
            this.toggleDesignSelection(index, isSelected);
            this.updateSelectButton(selectBtn, index);
        });

        return designCard;
    }

    toggleDesignSelection(designIndex, selected) {
        if (selected) {
            this.selectedDesigns.add(designIndex);
        } else {
            this.selectedDesigns.delete(designIndex);
        }
        this.updateCheckoutButton();
    }

    updateSelectButton(button, designIndex) {
        if (this.selectedDesigns.has(designIndex)) {
            button.textContent = '✓ Selected';
            button.classList.add('selected');
        } else {
            button.textContent = 'Select Design';
            button.classList.remove('selected');
        }
    }

    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const selectedCount = this.selectedDesigns.size;
        
        if (selectedCount > 0) {
            const totalPrice = selectedCount * productManager.getCurrentProduct().price;
            checkoutBtn.textContent = `Checkout (${selectedCount} items) - $${totalPrice}`;
            checkoutBtn.disabled = false;
        } else {
            checkoutBtn.textContent = 'Select designs to continue';
            checkoutBtn.disabled = true;
        }
    }

    getSelectedDesigns() {
        return Array.from(this.selectedDesigns);
    }

    resetSelection() {
        this.selectedDesigns.clear();
        this.updateCheckoutButton();
    }
}
