//device-manager.js
class DeviceManager {
    constructor() {
    }
    async updateCustomerDevice(deviceId,deviceDisplay) {
        const token = getSession()?.id_token; 
        if (!token) {
            console.log('User not signed in, skipping device update');
            return; 
        }
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ 
                    device_id: deviceId,
                    device_display: deviceDisplay,
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
}
