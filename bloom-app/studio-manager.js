// studio-manager.js
class StudioManager {
    constructor(cartManager, deviceManager, uploadManager) {
        this.cartManager = cartManager;
        this.deviceManager = deviceManager;
        this.uploadManager = uploadManager;
        this.productCarousel = new ProductCarousel();
        this.consentManager = new ConsentManager(this);
        this.currentStep = 1;
        
        setTimeout(() => this.setupEventListeners(), 100);
    }

    setRealTimeUpdates(realTimeUpdates) {
        this.realTimeUpdates = realTimeUpdates;
    }

    // Real-time update methods
    addRealTimeProduct(product) {
        console.log('Adding real-time product:', product);
        
        const existingDesigns = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        const updatedDesigns = [...existingDesigns, product];
        localStorage.setItem(STORAGE_KEYS.PRODUCT_DESIGNS, JSON.stringify(updatedDesigns));
        
        if (this.currentStep === 3) {
            this.renderProductList();
        } else {
            this.finishProcessing();
        }
    }

    displayRealTimeProgress(imageUrl, stage, description) {
        const previewContainer = document.getElementById('progress-image-preview');
        if (!previewContainer) return;
        
        let imageCard = document.getElementById(`progress-image-${stage}`);
        
        if (!imageCard) {
            imageCard = document.createElement('div');
            imageCard.id = `progress-image-${stage}`;
            imageCard.className = 'bg-white p-3 rounded-lg shadow-sm border border-gray-200';
            previewContainer.appendChild(imageCard);
        }
        
        imageCard.innerHTML = `
            <div class="mb-2">
                <img src="${imageUrl}" 
                    alt="${description}"
                    class="w-full h-32 object-cover rounded-md"
                    onerror="this.style.display='none'">
            </div>
            <p class="text-xs text-gray-600 text-center">${description}</p>
        `;
        
        document.getElementById('progress-message').innerText = description;
        imageCard.classList.add('image-update');
        setTimeout(() => imageCard.classList.remove('image-update'), 500);
    }

    setupEventListeners() {
        console.log('Setting up studio event listeners');
        
        // Device selection events
        const manufacturerRadios = document.querySelectorAll('input[name="device-manufacturer"]');
        manufacturerRadios.forEach(radio => {
            radio.addEventListener('change', this.handleManufacturerChange.bind(this));
        });
        
        const deviceDropdown = document.getElementById('device-dropdown');
        if (deviceDropdown) {
            deviceDropdown.addEventListener('change', this.updateDeviceDisplay.bind(this));
        }
        
        const ackBox = document.getElementById('acknowledgement-box');
        if (ackBox) {
            ackBox.addEventListener('change', this.updateDeviceDisplay.bind(this));
        }
        
        // File upload events
        const multiFileUpload = document.getElementById('multi-photo-upload');
        if (multiFileUpload) {
            multiFileUpload.addEventListener('change', this.handleMultiFileUpload.bind(this));
        }
        
        // Navigation events
        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.addEventListener('click', this.startOver.bind(this));
        }
        
        this.updateStepIndicator(1);
    }

    // Device selection methods
    handleManufacturerChange(event) {
        const manufacturer = event.target.value;
        const deviceDropdown = document.getElementById('device-dropdown');
        
        if (deviceDropdown) {
            deviceDropdown.innerHTML = '<option value="" disabled selected>Choose your phone model...</option>';
            
            if (DEVICE_OPTIONS[manufacturer]) {
                DEVICE_OPTIONS[manufacturer].forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.value;
                    option.textContent = device.label;
                    deviceDropdown.appendChild(option);
                });
            }
            
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
            this.deviceManager.updateCustomerDevice(dropdown.value, selectedText);
        }
        
        const isReady = manufacturerSelected && dropdown.value && ackBox.checked;
        proceedButton.disabled = !isReady;
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
        } else {
            alert('Please select a device manufacturer, specific model, and acknowledge the statement to proceed.');
        }
    }

    // File upload methods
    handleMultiFileUpload(event) {
        const files = event.target.files;
        const fileInputs = [
            document.getElementById('photo-upload-1'),
            document.getElementById('photo-upload-2'),
            document.getElementById('photo-upload-3')
        ];
        
        fileInputs.forEach(input => {
            if (input) {
                const dataTransfer = new DataTransfer();
                input.files = dataTransfer.files;
            }
        });
        
        for (let i = 0; i < Math.min(files.length, 3); i++) {
            if (fileInputs[i]) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[i]);
                fileInputs[i].files = dataTransfer.files;
            }
        }
        
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

        this.createImagePreviewContainer();

        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.style.display = 'block';
        }

        if (this.realTimeUpdates) {
            this.realTimeUpdates.initialize();
        } else {
            console.error('RealTimeUpdates not initialized');
            this.simulateProgressWithImages();
            return;
        }
        
        this.uploadManager.uploadFiles(files);
        
        // Show consent modal after starting processing
        setTimeout(() => {
            this.consentManager.showConsentModal();
        }, 30000);// 30 seconds = 30000 milliseconds
    }

    // Progress and processing methods
    createImagePreviewContainer() {
        let previewContainer = document.getElementById('progress-image-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'progress-image-preview';
            previewContainer.className = 'mt-6 grid grid-cols-1 md:grid-cols-2 gap-4';
            
            const progressContainer = document.getElementById('processing-progress');
            progressContainer.appendChild(previewContainer);
        } else {
            previewContainer.innerHTML = '';
        }
    }

    simulateProgressWithImages() {
        // ... (keep existing simulation logic)
    }

    finishProcessing() {
        const designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        
        if (designs.length === 0) {
            localStorage.setItem(STORAGE_KEYS.PRODUCT_DESIGNS, JSON.stringify(MOCK_DESIGNS));
        }
        
        document.getElementById('processing-progress').style.display = 'none';
        document.getElementById('product-list-area').style.display = 'block';
        this.currentStep = 3;
        this.updateStepIndicator(3);
        
        this.renderProductList();
    }

    // Product display methods
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

            const carouselHTML = this.generateProductCarousel(product);
    
            return `
                <div class="product-card p-4 border border-gray-200 rounded-lg shadow-sm" data-design-id="${product.designId}">
                    <h4 class="text-xl font-semibold mb-2">${product.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">For: <span class="font-medium">${selectedDevice}</span></p>
                    
                    ${carouselHTML}
                    
                    <p class="font-bold text-lg mb-3 gold-highlight">$${product.price.toFixed(2)}</p>
                    <button onclick="window.app.studioManager.handleCartAction('${product.designId}')" 
                        class="w-full px-4 py-2 text-white font-semibold rounded-md ${buttonClass}">
                        ${buttonText}
                    </button>
                    <p class="text-xs text-gray-500 mt-2 text-center">Swipe or use arrows to view all 4 images</p>
                </div>
            `;
        }).join('');
    
        // Initialize carousels using the dedicated carousel manager
        this.productCarousel.initializeAllCarousels();
    }

    generateProductCarousel(product) {
        const imageUrls = product.imageUrls || {};
        // const imageKeys = ['opt-turn_006', 'opt-turn_001', 'opt-turn_014', 'opt-turn_010'];
        const imageKeys = ['opt-turn_006', 'opt-turn_001', 'opt-turn_010'];
        
        const images = imageKeys.map(key => imageUrls[key]).filter(url => url);
        
        if (images.length === 0) {
            return `
                <div class="product-image-container bg-gray-100 rounded-lg mb-3 flex items-center justify-center aspect-[3/4]">
                    <p class="text-gray-500">No images available</p>
                </div>
            `;
        }

        return `
            <div class="product-carousel-wrapper bg-gray-50 rounded-lg mb-3 p-4">
                <div class="product-carousel relative bg-white rounded-lg overflow-hidden mx-auto max-w-xs">
                    <div class="carousel-track flex transition-transform duration-500 ease-out aspect-[3/4]">
                        ${images.map((imageUrl, index) => `
                            <div class="carousel-slide flex-shrink-0 w-full h-full flex items-center justify-center p-2 ${index === 0 ? 'active' : ''}">
                                <img src="${imageUrl}" 
                                     alt="${product.name} - View ${index + 1}"
                                     class="max-w-full max-h-full object-contain"
                                     onerror="this.style.display='none'; this.nextElementSibling?.style.display='flex';">
                                <div class="w-full h-full flex items-center justify-center bg-gray-100 hidden">
                                    <p class="text-gray-500 text-sm">Image loading failed</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${images.length > 1 ? `
                        <button class="carousel-prev absolute left-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200">
                            <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button class="carousel-next absolute right-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200">
                            <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                        
                        <div class="carousel-dots absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            ${images.map((_, index) => `
                                <button class="carousel-dot w-2 h-2 rounded-full bg-gray-300 transition-all duration-200 ${index === 0 ? 'active bg-gray-600' : ''}"></button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
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
        
        this.renderProductList();
    }

    // Navigation methods
    updateStepIndicator(step) {
        console.log('Updating step indicator to:', step);
        const stepElements = document.querySelectorAll('.step-indicator');
        stepElements.forEach((element, index) => {
            const stepNumber = index + 1;
            const stepCircle = element.querySelector('div:first-child');
            const stepText = element.querySelector('span');
            
            if (stepCircle && stepText) {
                if (stepNumber === step) {
                    stepCircle.classList.remove('bg-gray-300', 'bg-gold');
                    stepCircle.classList.add('bg-magenta', 'text-white');
                    stepText.classList.remove('border-gray-300', 'text-gray-600');
                    stepText.classList.add('border-magenta', 'text-magenta', 'font-semibold');
                } else if (stepNumber < step) {
                    stepCircle.classList.remove('bg-gray-300', 'bg-magenta');
                    stepCircle.classList.add('bg-gold', 'text-white');
                    stepText.classList.remove('border-gray-300', 'text-gray-600', 'border-magenta');
                    stepText.classList.add('border-gold', 'text-gold', 'font-semibold');
                } else {
                    stepCircle.classList.remove('bg-magenta', 'bg-gold', 'text-white');
                    stepCircle.classList.add('bg-gray-300', 'text-gray-600');
                    stepText.classList.remove('border-magenta', 'border-gold', 'text-magenta', 'text-gold', 'font-semibold');
                    stepText.classList.add('border-gray-300', 'text-gray-600');
                }
            }
        });
    }

    showConsentModal() {
        // ... (keep existing consent modal logic)
    }

    closeConsentModal(accepted) {
        // ... (keep existing consent modal logic)
    }

    startOver() {
        const fileInputs = [
            document.getElementById('photo-upload-1'),
            document.getElementById('photo-upload-2'),
            document.getElementById('photo-upload-3'),
            document.getElementById('multi-photo-upload')
        ];
        
        fileInputs.forEach(input => {
            if (input) input.value = '';
        });
        
        const fileNamesContainer = document.getElementById('file-names-display');
        if (fileNamesContainer) {
            fileNamesContainer.innerHTML = '<p class="text-sm text-gray-500">No files selected</p>';
        }
        
        document.getElementById('processing-progress').style.display = 'none';
        document.getElementById('product-list-area').style.display = 'none';
        document.getElementById('upload-area').style.display = 'block';
        
        this.currentStep = 2;
        this.updateStepIndicator(2);
        
        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.style.display = 'none';
        }
        
        // Clean up carousels
        this.productCarousel.destroyAllCarousels();
        
        console.log('Started over with new images');
    }
}
