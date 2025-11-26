// consent-manager.js
class ConsentManager {
    constructor(studioManager) {
        this.studioManager = studioManager;
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
                            <input type="checkbox" id="email-consent" class="mt-1 accent-magenta" checked>
                            <span class="text-sm text-gray-600">
                                Yes, I'd love to receive my design via email if it takes longer, plus future exclusive blooms and promotions.
                            </span>
                        </label>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button onclick="window.app.consentManager.closeConsentModal(false)" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                            Skip
                        </button>
                        <button onclick="window.app.consentManager.closeConsentModal(true)" class="cta-magenta px-4 py-2 rounded-md font-semibold">
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
}
