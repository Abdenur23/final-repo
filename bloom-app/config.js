//config.js
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
    PRODUCT_DESIGNS: 'currentProductDesigns'
};

const MOCK_DESIGNS = [
    { designId: 'design_a', name: 'Coral Bloom Case', price: 49.99, images: ['mockup_a_1.jpg', 'mockup_a_2.jpg', 'mockup_a_3.jpg', 'mockup_a_4.jpg'] },
    { designId: 'design_b', name: 'Midnight Petal Case', price: 54.99, images: ['mockup_b_1.jpg', 'mockup_b_2.jpg', 'mockup_b_3.jpg', 'mockup_b_4.jpg'] }
];

const VALID_PROMO_CODES = {
    "BLOOM20": 0.20,
    "FREESHIP": 0
};
