// Configuration and constants
const cognitoConfig = {
    clientId: '73lf1h32phkqeb9ahu6tqcl9av',
    domain: 'auth.theweer.com',
    redirectUri: window.location.origin + window.location.pathname,
    tokenEndpoint: `https://auth.theweer.com/oauth2/token`
};

const STORAGE_KEYS = {
    COGNITO_SESSION: 'cognitoSession',
    PKCE_VERIFIER: 'pkce_verifier',
    SHOPPING_CART: 'shoppingCart',
    DEVICE_SELECTION: 'deviceSelection',
    USER_UPLOADS: 'userUploads',
    ACTIVE_PROMO: 'activePromoDiscount',
    PRODUCT_DESIGNS: 'currentProductDesigns',
    USER_CONSENT: 'userConsent',
    CART_ITEMS: 'bloom_cart_items',
    GIFT_WRAPPING: 'bloom_gift_wrapping',
    ACTIVE_PROMO_CODE: 'bloom_active_promo_code',
    ACTIVE_PROMO_DISCOUNT: 'bloom_active_promo_discount',
    USER_SESSION: 'bloom_user_session'
};

const MOCK_DESIGNS = [
    { designId: 'design_a', name: 'Coral Bloom Case', price: 49.99, images: ['mockup_a_1.jpg', 'mockup_a_2.jpg', 'mockup_a_3.jpg', 'mockup_a_4.jpg'] },
    { designId: 'design_b', name: 'Midnight Petal Case', price: 54.99, images: ['mockup_b_1.jpg', 'mockup_b_2.jpg', 'mockup_b_3.jpg', 'mockup_b_4.jpg'] }
];

const VALID_PROMO_CODES = {
    "BLOOM20": 0.20,
    "FREESHIP": 0
};

const DEVICE_OPTIONS = {
    apple: [
        { value: 'iphone17', label: 'iPhone 17' },
        { value: 'iphone17pro', label: 'iPhone 17 Pro' },
        { value: 'iphone17promax', label: 'iPhone 17 Pro Max' },
        { value: 'iphoneair', label: 'iPhone Air' },
        { value: 'iphone16', label: 'iPhone 16' },
        { value: 'iphone16e', label: 'iPhone 16e' },
        { value: 'iphone16plus', label: 'iPhone 16 Plus' },
        { value: 'iphone16pro', label: 'iPhone 16 Pro' },
        { value: 'iphone16promax', label: 'iPhone 16 Pro Max' },
        { value: 'iphone15', label: 'iPhone 15' },
        { value: 'iphone15plus', label: 'iPhone 15 Plus' },
        { value: 'iphone15pro', label: 'iPhone 15 Pro' },
        { value: 'iphone15promax', label: 'iPhone 15 Pro Max' },
        { value: 'iphone14', label: 'iPhone 14' },
        { value: 'iphone14plus', label: 'iPhone 14 Plus' },
        { value: 'iphone14pro', label: 'iPhone 14 Pro' },
        { value: 'iphone14promax', label: 'iPhone 14 Pro Max' }
    ],
    
    samsung: [
        { value: 'samsungs25', label: 'Galaxy S25' },
        { value: 'samsungs25plus', label: 'Galaxy S25 Plus' },
        { value: 'samsungs25ultra', label: 'Galaxy S25 Ultra' },
        { value: 'samsungs24', label: 'Galaxy S24' },
        { value: 'samsungs24plus', label: 'Galaxy S24 Plus' },
        { value: 'samsungs24ultra', label: 'Galaxy S24 Ultra' },
        { value: 'samsungs23', label: 'Galaxy S23' },
        { value: 'samsungs23plus', label: 'Galaxy S23 Plus' },
        { value: 'samsungs23ultra', label: 'Galaxy S23 Ultra' },
        { value: 'samsungs22', label: 'Galaxy S22' },
        { value: 'samsungs22plus', label: 'Galaxy S22 Plus' },
        { value: 'samsungs22ultra', label: 'Galaxy S22 Ultra' }
    ]

};
// Application constants and configuration
const CONFIG = {
    // WebSocket
    WS_URL: 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production',
    
    // API Endpoints
    API_BASE_URL: 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod',
    API_ENDPOINT: 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod/upload',
    SHOPPING_CART_API_ENDPOINT: 'https://h35raa35sh.execute-api.us-east-1.amazonaws.com/prod/prod',
    

    // Stripe Configuration
    // STRIPE_PUBLISHABLE_KEY: 'pk_test_51SMYv7DBeWU7VJzLNGNEY9wllekcfhQZaMndBcGbvbK5zA7gROVkeWX5lAd8By9QCXVqAinfe5TkHlURcml7Eky700lHbTzbU1', // Replace with your actual key
    
    //STRIPE_PUBLISHABLE_KEY: 'pk_test_51SMby0Fb362b9JoXQyxZtvkpUWu6RZqKoF54NhYAmoII8gFIdwr26J4P0CwlGSwoNdIp33htkO8UDSePKp9JzxsM001lWVSAdF',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51Sp04zIAuiAAWxAukyH1Xq4AnuUQm8cjeJqLaWmly0ulA9R3DRJyYl6o8dH4DsEjV77AkezvFrGPq8unoR2yWNBm00LdagDQLO',
    CHECKOUT_API_ENDPOINT: 'https://qohagpc75m.execute-api.us-east-1.amazonaws.com/prod/prod',

    
    // Product
    PRODUCT_PRICE: 1.00,//make it $34
    TOTAL_EXPECTED_DESIGNS: 3,
    // Auth Configuration
    AUTH: {
        CLIENT_ID: '73lf1h32phkqeb9ahu6tqcl9av',
        REDIRECT_URI: window.location.origin + window.location.pathname,
        DOMAIN: 'auth.theweer.com'
    },    
    // Stage mappings for user-friendly display
    STAGE_MAP: {
        'enhancing image': '🧪 Enhancing your image',
        'preparing wallpaper and case': '🧩 Preparing wallpaper and case',
        'producing design': '🎨 Generating your phone case design',
        'mockup ready': '✅ Your design is ready'
    },
    
    // Stage colors for progress indicators
    STAGE_COLORS: {
        'enhancing image': '#17a2b8',     // Teal
        'preparing wallpaper and case': '#6610f2', // Purple
        'producing design': '#fd7e14',     // Orange
        'mockup ready': '#28a745'          // Green success
    }

};
