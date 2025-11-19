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
    USER_CONSENT: 'userConsent'
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
        { value: 'iphone_15_pro_max', label: 'iPhone 15 Pro Max' },
        { value: 'iphone_15_pro', label: 'iPhone 15 Pro' },
        { value: 'iphone_15', label: 'iPhone 15' },
        { value: 'iphone_14_pro_max', label: 'iPhone 14 Pro Max' },
        { value: 'iphone_14', label: 'iPhone 14' }
    ],
    samsung: [
        { value: 'samsung_s24_ultra', label: 'Samsung S24 Ultra' },
        { value: 'samsung_s24_plus', label: 'Samsung S24 Plus' },
        { value: 'samsung_s24', label: 'Samsung S24' },
        { value: 'samsung_s23_ultra', label: 'Samsung S23 Ultra' },
        { value: 'samsung_z_fold5', label: 'Samsung Z Fold 5' }
    ]
};
