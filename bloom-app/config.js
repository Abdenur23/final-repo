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
    "apple": [
            { "name": "iPhone 17", "value": "iphone17" },
            { "name": "iPhone 17 Pro", "value": "iphone17pro" },
            { "name": "iPhone 17 Pro Max", "value": "iphone17promax" },
            { "name": "iPhone Air", "value": "iphoneair" },
            { "name": "iPhone 16", "value": "iphone16" },
            { "name": "iPhone 16e", "value": "iphone16e" },
            { "name": "iPhone 16 Plus", "value": "iphone16plus" },
            { "name": "iPhone 16 Pro", "value": "iphone16pro" },
            { "name": "iPhone 16 Pro Max", "value": "iphone16promax" },
            { "name": "iPhone 15", "value": "iphone15" },
            { "name": "iPhone 15 Plus", "value": "iphone15plus" },
            { "name": "iPhone 15 Pro", "value": "iphone15pro" },
            { "name": "iPhone 15 Pro Max", "value": "iphone15promax" },
            { "name": "iPhone 14", "value": "iphone14" },
            { "name": "iPhone 14 Plus", "value": "iphone14plus" },
            { "name": "iPhone 14 Pro", "value": "iphone14pro" },
            { "name": "iPhone 14 Pro Max", "value": "iphone14promax" }
        ],
        "samsung": [
            { "name": "Galaxy S25", "value": "samsungs25" },
            { "name": "Galaxy S25 Plus", "value": "samsungs25plus" },
            { "name": "Galaxy S25 Ultra", "value": "samsungs25ultra" },
            { "name": "Galaxy S24", "value": "samsungs24" },
            { "name": "Galaxy S24 Plus", "value": "samsungs24plus" },
            { "name": "Galaxy S24 Ultra", "value": "samsungs24ultra" },
            { "name": "Galaxy S23", "value": "samsungs23" },
            { "name": "Galaxy S23 Plus", "value": "samsungs23plus" },
            { "name": "Galaxy S23 Ultra", "value": "samsungs23ultra" },
            { "name": "Galaxy S22", "value": "samsungs22" },
            { "name": "Galaxy S22 Plus", "value": "samsungs22plus" },
            { "name": "Galaxy S22 Ultra", "value": "samsungs22ultra" }
        ]
};
