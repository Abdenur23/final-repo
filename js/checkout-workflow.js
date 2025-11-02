class CheckoutWorkflow {
    constructor(stripe) {
        this.stripe = stripe;
        this.shippingAddress = null;
        this.billingAddress = null;
        this.isGift = false;
        this.giftMessage = '';
    }
    
    async initialize() {
        await initializeAuth();
        this.setupEventListeners();
        checkAuthAndUpdateUI();
    }
    
    setupEventListeners() {
        // Gift option toggle
        document.getElementById('is-gift').addEventListener('change', (e) => {
            this.isGift = e.target.checked;
            document.getElementById('gift-message').style.display = this.isGift ? 'block' : 'none';
        });
        
        // Billing address toggle
        document.getElementById('same-as-shipping').addEventListener('change', (e) => {
            document.getElementById('billing-address-fields').style.display = 
                e.target.checked ? 'none' : 'block';
        });
        
        // Form submission
        document.getElementById('shipping-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });
    }
    
    collectAddresses() {
        const formData = new FormData(document.getElementById('shipping-form'));
        
        this.shippingAddress = {
            name: formData.get('shipping_name'),
            line1: formData.get('shipping_line1'),
            line2: formData.get('shipping_line2'),
            city: formData.get('shipping_city'),
            state: formData.get('shipping_state'),
            postal_code: formData.get('shipping_postal_code')
        };
        
        const sameAsShipping = document.getElementById('same-as-shipping').checked;
        
        if (sameAsShipping) {
            this.billingAddress = {...this.shippingAddress};
        } else {
            this.billingAddress = {
                name: formData.get('billing_name'),
                line1: formData.get('billing_line1'),
                line2: formData.get('billing_line2'),
                city: formData.get('billing_city'),
                state: formData.get('billing_state'),
                postal_code: formData.get('billing_postal_code')
            };
        }
        
        this.giftMessage = document.getElementById('gift-message-text').value || '';
    }
    
    async handleFormSubmission() {
        this.collectAddresses();
        
        try {
            const session = getSession();
            if (!session || !session.id_token) {
                alert('Please sign in first');
                return;
            }

            const userInfo = getUserInfo();
            
            const response = await fetch('https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.id_token}`
                },
                body: JSON.stringify({
                    action: 'createCheckoutSession',
                    user_email: userInfo ? userInfo.email : null,
                    shipping_address: this.shippingAddress,
                    billing_address: this.billingAddress,
                    is_gift: this.isGift,
                    gift_message: this.giftMessage
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const checkoutSession = await response.json();
            
            const result = await this.stripe.redirectToCheckout({
                sessionId: checkoutSession.id
            });
            
            if (result.error) throw new Error(result.error.message);
            
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error starting checkout: ' + error.message);
        }
    }
}
