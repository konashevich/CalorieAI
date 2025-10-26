/**
 * Navigation Manager
 * Handles tab switching between Record, Cook, and Eat pages
 */

class NavigationManager {
    constructor() {
        this.currentPage = 'record';
        this.pages = ['record', 'cook', 'eat'];
        this.init();
    }

    init() {
        this.bindEvents();
        this.navigateToPage(this.currentPage);
    }

    bindEvents() {
        // Bottom navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = btn.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Keyboard navigation (optional)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToPage('record');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToPage('cook');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToPage('eat');
                        break;
                }
            }
        });
    }

    navigateToPage(pageName) {
        if (!this.pages.includes(pageName) || pageName === this.currentPage) {
            return;
        }

        // Hide current page
        const currentPageElement = document.getElementById(`${this.currentPage}-page`);
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
        }

        // Update navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === pageName) {
                btn.classList.add('active');
            }
        });

        // Show new page
        const newPageElement = document.getElementById(`${pageName}-page`);
        if (newPageElement) {
            newPageElement.classList.add('active');
        }

        // Update current page
        this.currentPage = pageName;

        // Trigger page-specific initialization
        this.onPageChange(pageName);
    }

    onPageChange(pageName) {
        // Trigger events based on which page is shown
        switch(pageName) {
            case 'record':
                // Refresh records list
                if (window.app && window.app.recordManager) {
                    window.app.recordManager.refreshRecordsList();
                }
                break;
            case 'cook':
                // Refresh meals list
                if (window.app && window.app.cookManager) {
                    window.app.cookManager.refreshMealsList();
                }
                break;
            case 'eat':
                // Refresh food list and update date
                if (window.app && window.app.eatManager) {
                    window.app.eatManager.refreshFoodList();
                    window.app.eatManager.updateDateDisplay();
                }
                break;
        }

        // Fire custom event
        document.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { page: pageName }
        }));
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

// Export for use in other modules
window.NavigationManager = NavigationManager;