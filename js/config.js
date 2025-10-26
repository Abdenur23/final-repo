// Central configuration
const CONFIG = {
    API: {
        BASE_URL: 'https://y4vn8tdr5g.execute-api.us-east-1.amazonaws.com/prod',
        UPLOAD_ENDPOINT: '/upload',
        WS_URL: 'wss://h5akjyhdj6.execute-api.us-east-1.amazonaws.com/production'
    },
    
    AUTH: {
        CLIENT_ID: 'your-cognito-client-id',
        REDIRECT_URI: window.location.origin + '/case.html'
    },
    
    PRODUCT: {
        BASE_PRICE: 34.00,
        MAX_IMAGES: 3,
        REQUIRED_DESIGNS: 3
    },
    
    STAGES: {
        UPLOADING: 'Uploading your images',
        PROCESSING: 'Processing your design',
        GENERATING: 'Generating phone case',
        FINALIZING: 'Finalizing details',
        COMPLETED: 'Design ready'
    }
};
