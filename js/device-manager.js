class DeviceManager {
    constructor() {
        this.selectedFiles = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Brand selection
        const brandRadios = document.querySelectorAll('input[name="brand"]');
        brandRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateDeviceOptions());
        });
        
        // Device selection
        const deviceSelect = document.getElementById('deviceSelect');
        deviceSelect.addEventListener('change', () => this.showAcknowledgeSection());
        
        // Acknowledge checkbox
        const acknowledgeCheckbox = document.getElementById('acknowledgeCheckbox');
        acknowledgeCheckbox.addEventListener('change', () => this.toggleUploadSection());
        
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.selectedFiles = Array.from(e.target.files);
            if (this.selectedFiles.length !== 3) {
                alert("Please select exactly 3 images");
            }
        });
    }

    updateDeviceOptions() {
        const selectedBrand = document.querySelector('input[name="brand"]:checked').value;
        const deviceSelect = document.getElementById('deviceSelect');
        deviceSelect.innerHTML = '<option value="">-- Choose Model --</option>';
        
        if (!selectedBrand || !CONFIG.DEVICES[selectedBrand]) return;
        
        CONFIG.DEVICES[selectedBrand].forEach(device => {
            const option = document.createElement('option');
            option.value = device.value;
            option.textContent = device.name;
            deviceSelect.appendChild(option);
        });
        
        this.hideAcknowledgeSection();
    }

    showAcknowledgeSection() {
        const deviceSelect = document.getElementById('deviceSelect');
        const acknowledgeSection = document.getElementById('acknowledgeSection');
        
        if (deviceSelect.value) {
            const selectedDevice = deviceSelect.options[deviceSelect.selectedIndex].text;
            const deviceValue = deviceSelect.value;
            
            document.getElementById('selectedDevice').textContent = selectedDevice;
            document.getElementById('deviceName').textContent = selectedDevice;
            acknowledgeSection.style.display = 'block';
            
            console.log('🔄 Device selected, updating database...');
            this.updateCustomerDevice(deviceValue);
        } else {
            this.hideAcknowledgeSection();
        }
    }

    hideAcknowledgeSection() {
        document.getElementById('acknowledgeSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('acknowledgeCheckbox').checked = false;
    }

    toggleUploadSection() {
        const acknowledgeCheckbox = document.getElementById('acknowledgeCheckbox');
        const uploadSection = document.getElementById('uploadSection');
        
        uploadSection.style.display = acknowledgeCheckbox.checked ? 'block' : 'none';
    }

    async updateCustomerDevice(deviceId) {
        const token = getSession()?.id_token; 
        if (!token) {
            console.log('User not signed in, skipping device update');
            return; 
        }
        
        try {
            console.log('🚀 Calling Lambda to update device:', deviceId);
            const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ 
                    device_id: deviceId,
                    device_display: selectedDevice,
                    action: 'updateDevice'
                })
            });
            
            console.log('📡 API Response status:', response.status);
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Device updated successfully:', result);
            } else {
                const error = await response.text();
                console.error('❌ Failed to update device:', error);
            }
        } catch (error) {
            console.error('💥 Error updating device:', error);
        }
    }

    getSelectedFiles() {
        return this.selectedFiles;
    }

    clearSelectedFiles() {
        this.selectedFiles = [];
        document.getElementById('fileInput').value = '';
    }
}
