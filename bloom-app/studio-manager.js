//studio-manager.js
// Studio/product creation management
class StudioManager {
    constructor(cartManager) {
        this.cartManager = cartManager;
        this.currentStep = 1;
        // Delay setup to ensure DOM is ready
        setTimeout(() => this.setupEventListeners(), 100);
    }

    setupEventListeners() {
        console.log('Setting up studio event listeners'); // Debug
        
        // Manufacturer radio buttons
        const manufacturerRadios = document.querySelectorAll('input[name="device-manufacturer"]');
        manufacturerRadios.forEach(radio => {
            radio.addEventListener('change', this.handleManufacturerChange.bind(this));
        });
        
        // Device dropdown
        const deviceDropdown = document.getElementById('device-dropdown');
        if (deviceDropdown) {
            deviceDropdown.addEventListener('change', this.updateDeviceDisplay.bind(this));
        }
        
        // Acknowledgement checkbox
        const ackBox = document.getElementById('acknowledgement-box');
        if (ackBox) {
            ackBox.addEventListener('change', this.updateDeviceDisplay.bind(this));
        }
        
        // Multi-file upload
        const multiFileUpload = document.getElementById('multi-photo-upload');
        if (multiFileUpload) {
            multiFileUpload.addEventListener('change', this.handleMultiFileUpload.bind(this));
        }
        
        // Start over button
        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.addEventListener('click', this.startOver.bind(this));
        }
        
        // Initialize step indicator
        this.updateStepIndicator(1);
    }

    handleManufacturerChange(event) {
        const manufacturer = event.target.value;
        const deviceDropdown = document.getElementById('device-dropdown');
        
        if (deviceDropdown) {
            // Clear existing options except the first one
            deviceDropdown.innerHTML = '<option value="" disabled selected>Choose your phone model...</option>';
            
            // Add new options based on manufacturer
            if (DEVICE_OPTIONS[manufacturer]) {
                DEVICE_OPTIONS[manufacturer].forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.value;
                    option.textContent = device.label;
                    deviceDropdown.appendChild(option);
                });
            }
            
            // Enable the dropdown
            deviceDropdown.disabled = false;
        }
        
        this.updateDeviceDisplay();
    }

    updateDeviceDisplay() {
        const manufacturerSelected = document.querySelector('input[name="device-manufacturer"]:checked');
        const dropdown = document.getElementById('device-dropdown');
        const ackBox = document.getElementById('acknowledgement-box');
        const proceedButton = document.getElementById('proceed-upload-button');

        if (!dropdown || !ackBox || !proceedButton) return;

        const selectedText = dropdown.options[dropdown.selectedIndex]?.text || 'None Selected';
        const selectedDeviceText = document.getElementById('selected-device-text');

        if (selectedDeviceText) {
            selectedDeviceText.innerText = selectedText === 'Choose your phone model...' ? 'None Selected' : selectedText;
        }
        
        // Enable button only if manufacturer is selected, device is selected AND the box is checked
        const isReady = manufacturerSelected && dropdown.value && ackBox.checked;
        proceedButton.disabled = !isReady;
    }

    updateStepIndicator(step) {
        console.log('Updating step indicator to:', step); // Debug
        const stepElements = document.querySelectorAll('.step-indicator');
        stepElements.forEach((element, index) => {
            const stepNumber = index + 1;
            const stepCircle = element.querySelector('div:first-child');
            const stepText = element.querySelector('span');
            
            if (stepCircle && stepText) {
                if (stepNumber === step) {
                    // Current active step
                    stepCircle.classList.remove('bg-gray-300', 'bg-gold');
                    stepCircle.classList.add('bg-magenta', 'text-white');
                    stepText.classList.remove('border-gray-300', 'text-gray-600');
                    stepText.classList.add('border-magenta', 'text-magenta', 'font-semibold');
                } else if (stepNumber < step) {
                    // Completed step
                    stepCircle.classList.remove('bg-gray-300', 'bg-magenta');
                    stepCircle.classList.add('bg-gold', 'text-white');
                    stepText.classList.remove('border-gray-300', 'text-gray-600', 'border-magenta');
                    stepText.classList.add('border-gold', 'text-gold', 'font-semibold');
                } else {
                    // Future step
                    stepCircle.classList.remove('bg-magenta', 'bg-gold', 'text-white');
                    stepCircle.classList.add('bg-gray-300', 'text-gray-600');
                    stepText.classList.remove('border-magenta', 'border-gold', 'text-magenta', 'text-gold', 'font-semibold');
                    stepText.classList.add('border-gray-300', 'text-gray-600');
                }
            }
        });
    }

    checkDeviceAndProceed() {
        const manufacturer = document.querySelector('input[name="device-manufacturer"]:checked')?.value;
        const device = document.getElementById('device-dropdown').value;
        const acknowledged = document.getElementById('acknowledgement-box').checked;

        if (manufacturer && device && acknowledged) {
            localStorage.setItem(STORAGE_KEYS.DEVICE_SELECTION, JSON.stringify({
                manufacturer,
                model: device,
                label: document.getElementById('device-dropdown').options[document.getElementById('device-dropdown').selectedIndex].text
            }));
            
            document.getElementById('device-selection-step').style.display = 'none';
            document.getElementById('upload-and-product-step').style.display = 'block';
            this.currentStep = 2;
            this.updateStepIndicator(2);
            
            // Show consent modal
            this.showConsentModal();
        } else {
            alert('Please select a device manufacturer, specific model, and acknowledge the statement to proceed.');
        }
    }

    showConsentModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('consent-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="consent-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-xl font-semibold mb-4">Creating Your Unique Bloom</h3>
                    <p class="mb-4 text-gray-700">We're crafting your personalized artwork from your photos. This magical process typically takes 3-4 minutes to create your perfect bloom.</p>
                    
                    <div class="mb-4">
                        <label class="flex items-start space-x-2">
                            <input type="checkbox" id="email-consent" class="mt-1 accent-magenta">
                            <span class="text-sm text-gray-600">
                                Yes, I'd love to receive my design via email if it takes longer, plus future exclusive blooms and promotions.
                            </span>
                        </label>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button onclick="window.app.studioManager.closeConsentModal(false)" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                            Skip
                        </button>
                        <button onclick="window.app.studioManager.closeConsentModal(true)" class="cta-magenta px-4 py-2 rounded-md font-semibold">
                            Continue to Create
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeConsentModal(accepted) {
        const modal = document.getElementById('consent-modal');
        if (modal) {
            if (accepted) {
                const emailConsent = document.getElementById('email-consent').checked;
                localStorage.setItem(STORAGE_KEYS.USER_CONSENT, JSON.stringify({
                    emailUpdates: emailConsent,
                    timestamp: new Date().toISOString()
                }));
                console.log('User consent saved:', { emailUpdates: emailConsent });
            }
            modal.remove();
        }
    }

    handleMultiFileUpload(event) {
        const files = event.target.files;
        const fileInputs = [
            document.getElementById('photo-upload-1'),
            document.getElementById('photo-upload-2'),
            document.getElementById('photo-upload-3')
        ];
        
        // Clear previous files
        fileInputs.forEach(input => {
            if (input) {
                const dataTransfer = new DataTransfer();
                input.files = dataTransfer.files;
            }
        });
        
        // Assign files to individual inputs (up to 3)
        for (let i = 0; i < Math.min(files.length, 3); i++) {
            if (fileInputs[i]) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[i]);
                fileInputs[i].files = dataTransfer.files;
            }
        }
        
        // Update file names display
        this.updateFileNamesDisplay(files);
    }

    updateFileNamesDisplay(files) {
        const fileNamesContainer = document.getElementById('file-names-display');
        if (!fileNamesContainer) return;
        
        if (files.length === 0) {
            fileNamesContainer.innerHTML = '<p class="text-sm text-gray-500">No files selected</p>';
            return;
        }
        
        let html = '<p class="text-sm font-medium mb-2">Selected files:</p><ul class="text-sm text-gray-600 space-y-1">';
        for (let i = 0; i < Math.min(files.length, 3); i++) {
            html += `<li>• ${files[i].name}</li>`;
        }
        if (files.length > 3) {
            html += `<li class="text-orange-500">• Only the first 3 files will be used</li>`;
        }
        html += '</ul>';
        
        fileNamesContainer.innerHTML = html;
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

        // Show start over button
        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.style.display = 'block';
        }

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
        this.currentStep = 3;
        this.updateStepIndicator(3);
        
        this.renderProductList();
    }

    renderProductList() {
        const productListDiv = document.getElementById('mockup-products');
        if (!productListDiv) return;

        const designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        const cart = this.cartManager.getCart();
        const deviceSelection = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICE_SELECTION) || '{}');
        const selectedDevice = deviceSelection.label || 'Not Set';
        
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
        const deviceSelection = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICE_SELECTION) || '{}');

        if (!product || !deviceSelection.model) return;

        if (isInCart) {
            this.cartManager.removeFromCart(designId);
        } else {
            this.cartManager.addToCart({ 
                ...product, 
                device: deviceSelection.label,
                manufacturer: deviceSelection.manufacturer,
                model: deviceSelection.model
            });
        }
    }

    startOver() {
        // Clear file inputs
        const fileInputs = [
            document.getElementById('photo-upload-1'),
            document.getElementById('photo-upload-2'),
            document.getElementById('photo-upload-3'),
            document.getElementById('multi-photo-upload')
        ];
        
        fileInputs.forEach(input => {
            if (input) input.value = '';
        });
        
        // Clear file names display
        const fileNamesContainer = document.getElementById('file-names-display');
        if (fileNamesContainer) {
            fileNamesContainer.innerHTML = '<p class="text-sm text-gray-500">No files selected</p>';
        }
        
        // Hide processing and product areas
        document.getElementById('processing-progress').style.display = 'none';
        document.getElementById('product-list-area').style.display = 'none';
        
        // Show upload area
        document.getElementById('upload-area').style.display = 'block';
        
        // Reset step
        this.currentStep = 2;
        this.updateStepIndicator(2);
        
        // Hide start over button
        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.style.display = 'none';
        }
        
        console.log('Started over with new images');
    }
}
