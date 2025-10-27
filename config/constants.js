// Application constants and configuration
const CONFIG = {
    // WebSocket
    WS_URL: 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production',
    
    // API Endpoints
    API_BASE_URL: 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod',
    
    // Product
    PRODUCT_PRICE: 34.00,
    TOTAL_EXPECTED_DESIGNS: 3,
    
    // Device data
    DEVICES: {
        apple: [
            { name: "iPhone 17", value: "iphone17" },
            { name: "iPhone Air", value: "iphoneair" },
            { name: "iPhone 17 Pro", value: "iphone17pro" },
            { name: "iPhone 17 Pro Max", value: "iphone17promax" },
            { name: "iPhone 16", value: "iphone16" },
            { name: "iPhone 16e", value: "iphone16e" },
            { name: "iPhone 16 Plus", value: "iphone16plus" },
            { name: "iPhone 16 Pro", value: "iphone16pro" },
            { name: "iPhone 16 Pro Max", value: "iphone16promax" },
            { name: "iPhone 14", value: "iphone14" },
            { name: "iPhone 14 Plus", value: "iphone14plus" },
            { name: "iPhone 14 Pro", value: "iphone14pro" },
            { name: "iPhone 14 Pro Max", value: "iphone14promax" }
        ],
        samsung: [
            { name: "Galaxy S25", value: "samsungs25" },
            { name: "Galaxy S25+", value: "samsungs25plus" },
            { name: "Galaxy S25 Ultra", value: "samsungs25ultra" },
            { name: "Galaxy S24", value: "samsungs24" },
            { name: "Galaxy S24+", value: "samsungs24plus" },
            { name: "Galaxy S24 Ultra", value: "samsungs24ultra" },
            { name: "Galaxy S23", value: "samsungs23" },
            { name: "Galaxy S23+", value: "samsungs23plus" },
            { name: "Galaxy S22", value: "samsungs22" },
            { name: "Galaxy S21", value: "samsungs21" }
        ]
    },
    
    // Stage mappings for user-friendly display
    STAGE_MAP: {
        'upload': '📤 Uploading your image',
        'processing': '🔄 Processing image',
        'analysis': '🔍 Analyzing design',
        'generation': '🎨 Generating phone case',
        'rendering': '📱 Creating 3D preview',
        'finalizing': '✨ Finalizing design'
    },
    
    // Stage colors for progress indicators
    STAGE_COLORS: {
        'upload': '#ffc107',
        'processing': '#17a2b8',
        'analysis': '#6610f2',
        'generation': '#fd7e14',
        'rendering': '#20c997',
        'finalizing': '#28a745'
    }
};
