// js/address-verifier.js
class AddressVerifier {
    constructor() {
        this.uspsApiKey = CONFIG.USPS_API_KEY; // You'll need to add this to constants.js
        this.verificationTimeout = null;
    }

    async verifyAddress(address) {
        // Simple client-side validation first
        if (!this.validateAddressFormat(address)) {
            return { isValid: false, error: 'Invalid address format' };
        }

        try {
            // For production, you'd use USPS API or similar service
            // This is a simplified version - implement actual USPS API call
            const verifiedAddress = await this.callUSPSApi(address);
            return { isValid: true, address: verifiedAddress };
        } catch (error) {
            console.error('Address verification failed:', error);
            return { isValid: false, error: 'Address verification failed' };
        }
    }

    validateAddressFormat(address) {
        const { line1, city, state, zipCode } = address;
        
        if (!line1 || line1.trim().length < 5) return false;
        if (!city || city.trim().length < 2) return false;
        if (!state || state.length !== 2) return false;
        if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) return false;
        
        return true;
    }

    async callUSPSApi(address) {
        // Implement actual USPS API call here
        // For now, return a mock verified address
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    line1: address.line1.toUpperCase(),
                    line2: address.line2 ? address.line2.toUpperCase() : '',
                    city: address.city.toUpperCase(),
                    state: address.state.toUpperCase(),
                    zipCode: address.zipCode
                });
            }, 500);
        });
    }

    setupAddressAutocomplete(inputElement, suggestionsContainer) {
        let timeoutId;
        
        inputElement.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            const value = e.target.value.trim();
            
            if (value.length < 3) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            timeoutId = setTimeout(async () => {
                const suggestions = await this.getAddressSuggestions(value);
                this.displaySuggestions(suggestions, suggestionsContainer, inputElement);
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!suggestionsContainer.contains(e.target) && e.target !== inputElement) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    async getAddressSuggestions(query) {
        // Mock implementation - replace with actual address suggestion service
        return [
            `${query} ST, LOS ANGELES, CA 90001`,
            `${query} AVE, SAN FRANCISCO, CA 94102`,
            `${query} BLVD, SAN DIEGO, CA 92101`
        ];
    }

    displaySuggestions(suggestions, container, inputElement) {
        container.innerHTML = '';
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'address-suggestion';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                inputElement.value = suggestion;
                container.style.display = 'none';
                // Trigger address verification
                inputElement.dispatchEvent(new Event('change'));
            });
            container.appendChild(div);
        });
        container.style.display = 'block';
    }
}
