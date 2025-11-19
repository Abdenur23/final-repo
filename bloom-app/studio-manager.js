//studio-manager.js
// Studio/product creation management
class StudioManager {
    constructor(cartManager) {
        this.cartManager = cartManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const deviceDropdown = document.getElementById('device-dropdown');
        const ackBox = document.getElementById('acknowledgement-box');
        
        if (deviceDropdown) {
            deviceDropdown.addEventListener('change', this.updateDeviceDisplay.bind(this));
        }
        if (ackBox) {
            ackBox.addEventListener('change', this.updateDeviceDisplay.bind(this));
        }
    }

    updateDeviceDisplay() {
        const dropdown = document.getElementById('device-dropdown');
        const ackBox = document.getElementById('acknowledgement-box');
        const proceedButton = document.getElementById('proceed-upload-button');

        if (!dropdown || !ackBox || !proceedButton) return;

        const selectedText = dropdown.options[dropdown.selectedIndex].text;
        const selectedDeviceText = document.getElementById('selected-device-text');

        if (selectedDeviceText) {
            selectedDeviceText.innerText = selectedText === 'Choose your phone model...' ? 'None Selected' : selectedText;
        }
        
        proceedButton.disabled = dropdown.value === '' || !ackBox.checked;
    }

    checkDeviceAndProceed() {
        const device = document.getElementById('device-dropdown').value;
        const acknowledged = document.getElementById('acknowledgement-box').checked;

        if (device && acknowledged) {
            localStorage.setItem(STORAGE_KEYS.DEVICE_SELECTION, device);
            document.getElementById('device-selection-step').style.display = 'none';
            document.getElementById('upload-and-product-step').style.display = 'block';
            
            // Update steps UI
            const step1 = document.querySelector('#studio-page .flex span:nth-child(1)');
            const step2 = document.querySelector('#studio-page .flex span:nth-child(2)');
            
            if (step1) {
                step1.classList.remove('border-magenta');
                step1.classList.add('border-gray-300');
            }
            if (step2) {
                step2.classList.add('border-magenta');
            }
        } else {
            alert('Please select a device and acknowledge the statement to proceed.');
        }
    }

    processImages() {
        // Check if files are selected
        const files = [
            document.getElementById('photo-upload-1').files[0],
            document.getElementById('photo-upload-2').files[0],
            document.getElementById('photo-upload-3').files[0]
        ];

        if (files.some(f => !f)) {
            alert('Please upload exactly 3 photos.');
            return;
        }

        document.getElementById('upload-area').style.display = 'none';
        document.getElementById('processing-progress').style.display = 'block';
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-message').innerText = 'Starting image analysis...';

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            document.getElementById('progress-bar').style.width = progress + '%';

            if (progress === 30) {
                document.getElementById('progress-message').innerText = 'Generating flower collage composition...';
            } else if (progress === 60) {
                document.getElementById('progress-message').innerText = 'Rendering 3D product mockups...';
            } else if (progress >= 100) {
                clearInterval(interval);
                document.getElementById('processing-progress').style.display = 'none';
                this.finishProcessing();
            }
        }, 500);
    }

    finishProcessing() {
        localStorage.setItem(STORAGE_KEYS.PRODUCT_DESIGNS, JSON.stringify(MOCK_DESIGNS));
        document.getElementById('product-list-area').style.display = 'block';
        
        // Update steps UI
        const step2 = document.querySelector('#studio-page .flex span:nth-child(2)');
        const step3 = document.querySelector('#studio-page .flex span:nth-child(3)');
        
        if (step2) {
            step2.classList.remove('border-magenta');
            step2.classList.add('border-gray-300');
        }
        if (step3) {
            step3.classList.add('border-magenta');
        }

        this.renderProductList();
    }

    renderProductList() {
        const productListDiv = document.getElementById('mockup-products');
        if (!productListDiv) return;

        const designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        const cart = this.cartManager.getCart();
        const selectedDevice = localStorage.getItem(STORAGE_KEYS.DEVICE_SELECTION) || 'Not Set';
        
        if (designs.length === 0) {
            productListDiv.innerHTML = '<p class="text-center">No blooms generated yet.</p>';
            return;
        }

        productListDiv.innerHTML = designs.map(product => {
            const isInCart = cart.some(item => item.designId === product.designId);
            const buttonText = isInCart ? 'In Cart (Remove)' : 'Add to Cart';
            const buttonClass = isInCart ? 'bg-red-500 hover:bg-red-600' : 'cta-magenta';

            return `
                <div class="p-4 border border-gray-200 rounded-lg shadow-sm">
                    <h4 class="text-xl font-semibold mb-2">${product.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">For: <span class="font-medium">${selectedDevice}</span></p>
                    <div class="bg-gray-100 h-40 flex items-center justify-center mb-3 rounded-md">
                        <span class="text-gray-400">Product Preview</span>
                    </div>
                    <p class="font-bold text-lg mb-3 gold-highlight">$${product.price.toFixed(2)}</p>
                    <button onclick="window.app.studioManager.handleCartAction('${product.designId}')" 
                        class="w-full px-4 py-2 text-white font-semibold rounded-md ${buttonClass}">
                        ${buttonText}
                    </button>
                    <p class="text-xs text-gray-500 mt-2 text-center">See all 4 images on Cart page.</p>
                </div>
            `;
        }).join('');
    }

    handleCartAction(designId) {
        const cart = this.cartManager.getCart();
        const isInCart = cart.some(item => item.designId === designId);
        const designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        const product = designs.find(d => d.designId === designId);
        const device = localStorage.getItem(STORAGE_KEYS.DEVICE_SELECTION);

        if (!product || !device) return;

        if (isInCart) {
            this.cartManager.removeFromCart(designId);
        } else {
            this.cartManager.addToCart({ ...product, device });
        }
    }
}
