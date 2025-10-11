class ProductManager {
    constructor() {
        this.currentProduct = this.getProductFromURL();
        this.products = {
            'phone-case': {
                name: 'Phone Case',
                description: 'Custom floral phone case with matching wallpaper',
                price: 29.99,
                features: ['Premium Quality', 'Matching Wallpaper', '3 Design Options'],
                image: 'assets/images/phone-case-preview.png'
            },
            'watch-band': {
                name: 'Watch Band',
                description: 'Personalized watch band with floral patterns',
                price: 24.99,
                features: ['Adjustable Fit', 'Premium Materials', '3 Design Options'],
                image: 'assets/images/watch-band-preview.png'
            },
            'bag-decoration': {
                name: 'Bag Decoration',
                description: 'Unique bag charms and decorations',
                price: 19.99,
                features: ['Lightweight', 'Durable', '3 Design Options'],
                image: 'assets/images/bag-decoration-preview.png'
            },
            'backpack-patches': {
                name: 'Backpack Patches',
                description: 'Custom embroidered patches for backpacks',
                price: 14.99,
                features: ['Embroidered', 'Iron-on', '3 Design Options'],
                image: 'assets/images/backpack-patches-preview.png'
            }
        };
    }

    getProductFromURL() {
        const path = window.location.pathname;
        const product = path.split('/').pop().replace('.html', '');
        return product in this.products ? product : 'phone-case';
    }

    getCurrentProduct() {
        return this.products[this.currentProduct];
    }

    updateProductUI() {
        const product = this.getCurrentProduct();
        
        // Update page title
        document.title = `${product.name} - The Weer`;
        
        // Update hero section
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const productBadge = document.querySelector('.product-badge');
        
        if (heroTitle) heroTitle.textContent = `Create Your Custom Floral ${product.name}`;
        if (heroSubtitle) heroSubtitle.textContent = product.description;
        if (productBadge) productBadge.textContent = product.name;
        
        // Update upload section
        const uploadHeader = document.querySelector('.upload-header h3');
        const uploadDescription = document.querySelector('.upload-header p');
        
        if (uploadHeader) uploadHeader.textContent = `Design Your ${product.name}`;
        if (uploadDescription) uploadDescription.textContent = `Select 3 distinct images to create your custom ${product.name.toLowerCase()} design`;
    }
}
