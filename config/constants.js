// Application constants and configuration
const CONFIG = {
    // WebSocket
    WS_URL: 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production',
    
    // API Endpoints
    API_BASE_URL: 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod',
    API_ENDPOINT: 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod/upload',
    

    // Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51SMYv7DBeWU7VJzLNGNEY9wllekcfhQZaMndBcGbvbK5zA7gROVkeWX5lAd8By9QCXVqAinfe5TkHlURcml7Eky700lHbTzbU1', // Replace with your actual key
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
    // Device data
    DEVICES: 
    {
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
