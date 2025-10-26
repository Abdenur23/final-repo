// Device selection and management
class DeviceManager {
    constructor() {
        this.devices = {
            apple: [
                { name: "iPhone 17", value: "iphone17" },
                { name: "iPhone Air", value: "iphoneair" },
                { name: "iPhone 17 Pro", value: "iphone17pro" },
                { name: "iPhone 17 Pro Max", value: "iphone17promax" },
                { name: "iPhone 16", value: "iphone16" },
                { name: "iPhone 16e", value: "iphone16e" },
                { name: "iPhone 16 Plus", value: "iphone16plus" },
                { name: "iPhone 16 Pro", value: "iphone16pro" },
                { name: "iPhone 16 Pro Max", value: "iphone16promax" }
            ],
            samsung: [
                { name: "Galaxy S25", value: "samsungs25" },
                { name: "Galaxy S25+", value: "samsungs25plus" },
                { name: "Galaxy S25 Ultra", value: "samsungs25ultra" },
                { name: "Galaxy S24", value: "samsungs24" },
                { name: "Galaxy S24+", value: "samsungs24plus" },
                { name: "Galaxy S24 Ultra", value: "samsungs24ultra" }
            ]
        };
        this.selectedDevice = null;
    }

    initialize() {
        this.setupEventListeners();
        this.updateDeviceOptions();
    }

    setupEventListeners() {
        const brandRadios = document.querySelectorAll('input[name="brand"]');
        brandRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateDeviceOptions());
        });

        const deviceSelect = document.getElementById('deviceSelect');
        deviceSelect.addEventListener('change', (e) => this.onDeviceSelect(e.target.value));

        const acknowledgeCheckbox = document.getElementById('acknowledgeCheckbox');
        acknowledgeCheckbox.addEventListener('change', (e) => this.toggleUploadSection(e.target.checked));
    }

    updateDeviceOptions() {
        const selectedBrand = document.querySelector('input[name="brand"]:checked').value;
        const deviceSelect = document.getElementById('deviceSelect');
        deviceSelect.innerHTML = '<option value="">-- Choose Model --</option>';
        
        if (!selectedBrand || !this.devices[selectedBrand]) return;
        
        this.devices[selectedBrand].forEach(device => {
            const option = document.createElement('option');
            option.value = device.value;
            option.textContent = device.name;
            deviceSelect.appendChild(option);
        });
        
        this.hideAcknowledgeSection();
    }

    async onDeviceSelect(deviceValue) {
        if (!deviceValue) {
            this.hideAcknowledgeSection();
            return;
        }

        const deviceSelect = document.getElementById('deviceSelect');
        const selectedDeviceName = deviceSelect.options[deviceSelect.selectedIndex].text;
        
        this.selectedDevice = {
            value: deviceValue,
            name: selectedDeviceName
        };

        this.showAcknowledgeSection(selectedDeviceName);
        await this.updateCustomerDevice(deviceValue);
    }

    showAcknowledgeSection(deviceName) {
        const acknowledgeSection = document.getElementById('acknowledgeSection');
        document.getElementById('selectedDevice').textContent = deviceName;
        document.getElementById('deviceName').textContent = deviceName;
        acknowledgeSection.style.display = 'block';
    }

    hideAcknowledgeSection() {
        document.getElementById('acknowledgeSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('acknowledgeCheckbox').checked = false;
    }

    toggleUploadSection(show) {
        document.getElementById('uploadSection').style.display = show ? 'block' : 'none';
    }

    async updateCustomerDevice(deviceId) {
        const token = getSession()?.id_token;
        if (!token) {
            console.log('User not signed in, skipping device update');
            return;
        }
        
        try {
            const response = await fetch(CONFIG.API.BASE_URL + CONFIG.API.UPLOAD_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ 
                    device_id: deviceId,
                    action: 'updateDevice'
                })
            });
            
            if (response.ok) {
                console.log('✅ Device updated successfully');
            } else {
                console.error('❌ Failed to update device');
            }
        } catch (error) {
            console.error('💥 Error updating device:', error);
        }
    }

    getSelectedDevice() {
        return this.selectedDevice;
    }
}
