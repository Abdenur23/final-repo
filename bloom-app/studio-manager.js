//studio-manager.js
// Studio/product creation management
class StudioManager {
    constructor(cartManager,deviceManager,uploadManager) {
        this.cartManager = cartManager;
        this.deviceManager = deviceManager;
        this.uploadManager = uploadManager;
        this.currentStep = 1;
        // Delay setup to ensure DOM is ready
        setTimeout(() => this.setupEventListeners(), 100);
    }
    setRealTimeUpdates(realTimeUpdates) {
        this.realTimeUpdates = realTimeUpdates;
    }
    // Method for RealTimeUpdates to add products
    addRealTimeProduct(product) {
        console.log('Adding real-time product:', product);
        
        // Add to localStorage
        const existingDesigns = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        const updatedDesigns = [...existingDesigns, product];
        localStorage.setItem(STORAGE_KEYS.PRODUCT_DESIGNS, JSON.stringify(updatedDesigns));
        
        // Update UI
        if (this.currentStep === 3) {
            this.renderProductList(); // Refresh product list
        } else {
            this.finishProcessing(); // Move to product display step
        }
    }

    // Method for RealTimeUpdates to show progress images
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
        
        // Update progress message
        document.getElementById('progress-message').innerText = description;
        
        // Add update animation
        imageCard.classList.add('image-update');
        setTimeout(() => imageCard.classList.remove('image-update'), 500);
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
            this.deviceManager.updateCustomerDevice(dropdown.value, selectedText);
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
        const files = [
            document.getElementById('photo-upload-1').files[0],
            document.getElementById('photo-upload-2').files[0],
            document.getElementById('photo-upload-3').files[0]
        ];

        if (files.some(f => !f)) {
            alert('Please upload exactly 3 photos.');
            return;
        }

        // Show processing UI
        document.getElementById('upload-area').style.display = 'none';
        document.getElementById('processing-progress').style.display = 'block';
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-message').innerText = 'Starting image analysis...';

        this.createImagePreviewContainer();

        const startOverBtn = document.getElementById('start-over-button');
        if (startOverBtn) {
            startOverBtn.style.display = 'block';
        }

        // Check if realTimeUpdates exists before using it
        if (this.realTimeUpdates) {
            this.realTimeUpdates.initialize();
        } else {
            console.error('RealTimeUpdates not initialized');
            // Fallback to simulated progress if real-time updates aren't available
            this.simulateProgressWithImages();
            return;
        }
        
        // Upload files - this triggers server processing
        this.uploadManager.uploadFiles(files);
        
        this.showConsentModal();
    }

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
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            document.getElementById('progress-bar').style.width = progress + '%';

            // Update progress message and show intermediate images
            if (progress === 10) {
                document.getElementById('progress-message').innerText = 'Analyzing your photos...';
                this.showIntermediateImage('analyzing', 'Photo analysis in progress');
            } else if (progress === 30) {
                document.getElementById('progress-message').innerText = 'Detecting facial features and composition...';
                this.showIntermediateImage('feature-detection', 'Feature detection complete');
            } else if (progress === 50) {
                document.getElementById('progress-message').innerText = 'Generating flower collage composition...';
                this.showIntermediateImage('composition', 'Initial composition created');
            } else if (progress === 70) {
                document.getElementById('progress-message').innerText = 'Applying artistic filters and color grading...';
                this.showIntermediateImage('color-grading', 'Color grading applied');
            } else if (progress === 85) {
                document.getElementById('progress-message').innerText = 'Rendering 3D product mockups...';
                this.showIntermediateImage('rendering', '3D rendering in progress');
            } else if (progress >= 100) {
                clearInterval(interval);
                document.getElementById('progress-message').innerText = 'Finalizing your bloom...';
                setTimeout(() => {
                    document.getElementById('processing-progress').style.display = 'none';
                    this.finishProcessing();
                }, 1000);
            }
        }, 500);
    }

    showIntermediateImage(stage, description) {
        // In a real implementation, you would fetch these from your server
        // For now, we'll use placeholder images that simulate server responses
        
        const imageUrls = {
            'analyzing': `https://picsum.photos/300/200?random=1&t=${Date.now()}`,
            'feature-detection': `https://picsum.photos/300/200?random=2&t=${Date.now()}`,
            'composition': `https://picsum.photos/300/200?random=3&t=${Date.now()}`,
            'color-grading': `https://picsum.photos/300/200?random=4&t=${Date.now()}`,
            'rendering': `https://picsum.photos/300/200?random=5&t=${Date.now()}`
        };

        const previewContainer = document.getElementById('progress-image-preview');
        const existingImage = document.getElementById(`progress-image-${stage}`);
        
        if (!existingImage) {
            const imageCard = document.createElement('div');
            imageCard.className = 'bg-white p-3 rounded-lg shadow-sm border border-gray-200';
            imageCard.innerHTML = `
                <div class="mb-2">
                    <img id="progress-image-${stage}" 
                         src="${imageUrls[stage]}" 
                         alt="${description}"
                         class="w-full h-32 object-cover rounded-md loading-image"
                         onload="this.classList.remove('loading-image')"
                         onerror="this.style.display='none'">
                </div>
                <p class="text-xs text-gray-600 text-center">${description}</p>
            `;
            previewContainer.appendChild(imageCard);
        }

        // Simulate server push - in real implementation, this would come from WebSocket/SSE
        this.simulateServerImageUpdate(stage, description);
    }

    simulateServerImageUpdate(stage, description) {
        // Simulate server sending updated images at different stages
        setTimeout(() => {
            const imageElement = document.getElementById(`progress-image-${stage}`);
            if (imageElement) {
                // Simulate image refinement - in real app, this would be actual server-sent images
                imageElement.src = `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 100)}&t=${Date.now()}`;
                
                // Add a subtle animation to show update
                imageElement.classList.add('image-update');
                setTimeout(() => imageElement.classList.remove('image-update'), 500);
            }
        }, 800);
    }

    // REAL SERVER INTEGRATION METHOD - Use this when you have a backend
    async connectToProgressWebSocket() {
        // Show consent modal
        this.showConsentModal();

        // Example WebSocket implementation for real server updates
        try {
            this.socket = new WebSocket('wss://your-server.com/progress');
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'progress_update':
                        document.getElementById('progress-bar').style.width = data.progress + '%';
                        document.getElementById('progress-message').innerText = data.message;
                        break;
                        
                    case 'intermediate_image':
                        this.displayServerImage(data.imageUrl, data.stage, data.description);
                        break;
                        
                    case 'processing_complete':
                        this.handleProcessingComplete(data.designs);
                        break;
                }
            };
            
            this.socket.onopen = () => {
                console.log('Connected to progress server');
                // Send the images to process
                this.sendImagesToProcess();
            };
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            // Fall back to simulated progress
            this.simulateProgressWithImages();
        }
    }

    displayServerImage(imageUrl, stage, description) {
        const previewContainer = document.getElementById('progress-image-preview');
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
        
        // Add update animation
        imageCard.classList.add('image-update');
        setTimeout(() => imageCard.classList.remove('image-update'), 500);
    }

    async sendImagesToProcess() {
        // Convert files to FormData for real server upload
        const formData = new FormData();
        const files = [
            document.getElementById('photo-upload-1').files[0],
            document.getElementById('photo-upload-2').files[0],
            document.getElementById('photo-upload-3').files[0]
        ];
        
        files.forEach((file, index) => {
            formData.append(`photo_${index + 1}`, file);
        });
        
        // Add device information
        const deviceSelection = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICE_SELECTION) || '{}');
        formData.append('device_info', JSON.stringify(deviceSelection));
        
        try {
            const response = await fetch('https://your-server.com/process-images', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('Images sent to server successfully');
            }
        } catch (error) {
            console.error('Failed to send images to server:', error);
        }
    }

    handleProcessingComplete(designs) {
        localStorage.setItem(STORAGE_KEYS.PRODUCT_DESIGNS, JSON.stringify(designs));
        document.getElementById('processing-progress').style.display = 'none';
        document.getElementById('product-list-area').style.display = 'block';
        this.currentStep = 3;
        this.updateStepIndicator(3);
        
        this.renderProductList();
    }

    finishProcessing() {
        // Check if we have real products from WebSocket
        const designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_DESIGNS) || '[]');
        
        if (designs.length === 0) {
            // Fallback to mock designs if no real products yet
            localStorage.setItem(STORAGE_KEYS.PRODUCT_DESIGNS, JSON.stringify(MOCK_DESIGNS));
        }
        
        document.getElementById('processing-progress').style.display = 'none';
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

            // Generate carousel HTML directly
            const carouselHTML = this.generateProductCarousel(product);
    
            return `
                <div class="product-card p-4 border border-gray-200 rounded-lg shadow-sm" data-design-id="${product.designId}">
                    <h4 class="text-xl font-semibold mb-2">${product.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">For: <span class="font-medium">${selectedDevice}</span></p>
                    
                    <!-- Embedded Carousel -->
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
    
        // Initialize carousels after rendering
        this.initializeAllCarousels();
    }

    generateProductCarousel(product) {
        // Get image URLs from the product object
        // Based on your server response, imageUrls is an object with prefixes as keys
        const imageUrls = product.imageUrls || {};
        
        // Extract the image URLs in the order you want them displayed
        const imageKeys = ['opt-turn_006', 'opt-turn_001', 'opt-turn_014', 'opt-turn_010'];
        const images = imageKeys.map(key => imageUrls[key]).filter(url => url);
        
        // If no images found, use a placeholder
        if (images.length === 0) {
            return `
                <div class="product-image-container bg-gray-100 h-64 mb-3 rounded-md flex items-center justify-center">
                    <p class="text-gray-500">No images available</p>
                </div>
            `;
        }

        // Generate carousel HTML
        return `
            <div class="product-carousel relative bg-gray-100 h-64 mb-3 rounded-md overflow-hidden">
                <div class="carousel-track flex h-full transition-transform duration-300 ease-in-out">
                    ${images.map((imageUrl, index) => `
                        <div class="carousel-slide flex-shrink-0 w-full h-full ${index === 0 ? 'active' : ''}">
                            <img src="${imageUrl}" 
                                 alt="${product.name} - View ${index + 1}"
                                 class="w-full h-full object-cover"
                                 onerror="this.style.display='none'; this.nextElementSibling?.style.display='flex';">
                            <div class="w-full h-full flex items-center justify-center bg-gray-200 hidden">
                                <p class="text-gray-500">Image failed to load</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Navigation Arrows -->
                ${images.length > 1 ? `
                    <button class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 shadow-md transition-opacity">
                        <svg class="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <button class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 shadow-md transition-opacity">
                        <svg class="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                ` : ''}
                
                <!-- Dots Indicator -->
                ${images.length > 1 ? `
                    <div class="carousel-dots absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        ${images.map((_, index) => `
                            <button class="carousel-dot w-2 h-2 rounded-full bg-white bg-opacity-50 ${index === 0 ? 'bg-opacity-100' : ''}"></button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    initializeAllCarousels() {
        const carousels = document.querySelectorAll('.product-carousel');
        
        carousels.forEach(carousel => {
            this.initializeCarousel(carousel);
        });
    }

    initializeCarousel(carousel) {
        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const dots = carousel.querySelectorAll('.carousel-dot');
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        
        if (totalSlides <= 1) {
            // Hide navigation if only one slide
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (dots.length > 0) dots[0].parentElement.style.display = 'none';
            return;
        }
        
        const updateCarousel = () => {
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('bg-opacity-100', index === currentSlide);
                dot.classList.toggle('bg-opacity-50', index !== currentSlide);
            });
        };
        
        // Previous button event
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                updateCarousel();
            });
        }
        
        // Next button event
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateCarousel();
            });
        }
        
        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
        });
        
        // Touch/swipe support
        let startX = 0;
        let endX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        carousel.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        });
        
        carousel.addEventListener('touchend', () => {
            const diff = startX - endX;
            const swipeThreshold = 50;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next
                    currentSlide = (currentSlide + 1) % totalSlides;
                } else {
                    // Swipe right - previous
                    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                }
                updateCarousel();
            }
        });
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
        
        // Refresh the product list to update button states
        this.renderProductList();
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
