//navigation-manager.js
// Navigation and routing management
class NavigationManager {
    constructor() {
        this.currentPage = 'home';
    }

    renderNavigation(currentPage) {
        const navContainer = document.getElementById('nav-container');
        if (!navContainer) return;
        
        const links = [
            { id: 'home', label: 'Home', target: 'home' },
            { id: 'studio', label: 'Studio', target: 'studio' },
            { id: 'checkout', label: 'Checkout', target: 'checkout' }
        ];
        
        let navHTML = '<nav class="flex flex-wrap justify-center gap-4 sm:gap-6 py-2">';
        links.forEach(link => {
            const activeClass = currentPage === link.target ? 'active border-b-2 border-magenta font-bold' : '';
            navHTML += `<a href="#" onclick="window.app.navigateTo('${link.target}')" class="nav-link ${activeClass} px-3 py-2 text-sm sm:text-base transition-colors duration-200">${link.label}</a>`;
        });
        navHTML += '</nav>';
        navContainer.innerHTML = navHTML;
    }

    navigateTo(page) {
        if (page === 'cart') {
            if (window.app) {
                window.app.openCartModal();
            }
        } else {
            this.currentPage = page;
            if (window.app) {
                window.app.renderCurrentPage();
            }
        }
    }

    getCurrentPage() {
        return this.currentPage;
    }

    setCurrentPage(page) {
        this.currentPage = page;
    }
}
