/**
 * PWA Manager
 * Handles Progressive Web App features: installation, push notifications, offline handling
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.registration = null;
        this.indexedDB = new IndexedDBManager();
        
        this.init();
    }

    async init() {
        await this.registerServiceWorker();
        await this.initIndexedDB();
        this.setupInstallPrompt();
        this.setupNotifications();
        this.setupOfflineHandling();
        this.checkInstallStatus();
    }

    // Service Worker Registration
    async registerServiceWorker() {
        // Check if we're running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('PWA: Service Worker not available on file:// protocol. Use http://localhost:8000 for full PWA features.');
            return;
        }

        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('./sw.js');
                console.log('PWA: Service Worker registered successfully');
                
                // Listen for service worker messages
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
                
                // Handle service worker updates
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateAvailable();
                            }
                        });
                    }
                });
                
            } catch (error) {
                console.warn('PWA: Service Worker registration failed:', error.message);
            }
        } else {
            console.warn('PWA: Service Worker not supported');
        }
    }

    async initIndexedDB() {
        try {
            await this.indexedDB.init();
            console.log('PWA: IndexedDB initialized');
        } catch (error) {
            console.error('PWA: IndexedDB initialization failed:', error);
        }
    }

    // App Installation
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Install prompt triggered');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA: App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccess();
        });
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('PWA: No install prompt available');
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('PWA: Install prompt result:', outcome);
            
            if (outcome === 'accepted') {
                this.hideInstallButton();
            }
            
            this.deferredPrompt = null;
        } catch (error) {
            console.error('PWA: Install prompt failed:', error);
        }
    }

    checkInstallStatus() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('PWA: App is running in standalone mode');
        }
    }

    // Push Notifications
    async setupNotifications() {
        // Skip push notifications setup for now - requires valid VAPID keys and backend
        console.log('PWA: Push notifications disabled - no backend server configured');
        return;
        
        // TODO: Enable when you have a backend server and valid VAPID keys
        /*
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await this.requestNotificationPermission();
            if (permission === 'granted') {
                await this.subscribeToPush();
            }
        }
        */
    }

    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('PWA: Notification permission:', permission);
            return permission;
        }
        return Notification.permission;
    }

    async subscribeToPush() {
        if (!this.registration) return;

        // Skip push notifications setup for now - requires valid VAPID keys and backend
        console.log('PWA: Push notifications disabled - no backend server configured');
        return;

        // TODO: Enable when you have a backend server and valid VAPID keys
        /*
        try {
            const vapidPublicKey = 'YOUR-REAL-VAPID-PUBLIC-KEY-HERE';
            
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });

            console.log('PWA: Push subscription created');
            await this.sendSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('PWA: Push subscription failed:', error);
        }
        */
    }

    async sendSubscriptionToServer(subscription) {
        // TODO: Send to your backend server
        console.log('PWA: Push subscription ready to send to server:', subscription);
        
        // Store locally for now
        await this.indexedDB.setMetadata('pushSubscription', subscription);
    }

    async scheduleReminder(title, body, delayMinutes = 60) {
        if (Notification.permission !== 'granted') return;

        // For now, use setTimeout (in production, use server-side scheduling)
        setTimeout(() => {
            this.showNotification(title, body);
        }, delayMinutes * 60 * 1000);
    }

    showNotification(title, body, options = {}) {
        if ('serviceWorker' in navigator && this.registration) {
            this.registration.showNotification(title, {
                body: body,
                icon: './assets/icon-192x192.png',
                badge: './assets/icon-72x72.png',
                vibrate: [200, 100, 200],
                actions: [
                    {
                        action: 'open',
                        title: 'Open CalorieAI'
                    },
                    {
                        action: 'dismiss',
                        title: 'Dismiss'
                    }
                ],
                ...options
            });
        } else {
            // Fallback to regular notification
            new Notification(title, {
                body: body,
                icon: './assets/icon-192x192.png',
                ...options
            });
        }
    }

    // Offline Handling
    setupOfflineHandling() {
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Check initial state
        if (!navigator.onLine) {
            this.handleOffline();
        }
    }

    handleOnline() {
        console.log('PWA: Back online');
        this.hideOfflineIndicator();
        this.syncOfflineData();
    }

    handleOffline() {
        console.log('PWA: Gone offline');
        this.showOfflineIndicator();
    }

    async syncOfflineData() {
        if ('serviceWorker' in navigator && this.registration) {
            try {
                await this.registration.sync.register('ai-request-sync');
                console.log('PWA: Background sync registered');
            } catch (error) {
                console.error('PWA: Background sync registration failed:', error);
            }
        }
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'SYNC_SUCCESS':
                console.log('PWA: Sync completed successfully');
                this.handleSyncSuccess(data);
                break;
            case 'CACHE_UPDATED':
                console.log('PWA: Cache updated');
                break;
            default:
                console.log('PWA: Unknown message from service worker:', event.data);
        }
    }

    handleSyncSuccess(data) {
        // Refresh the UI to show synced data
        if (window.app) {
            window.app.refreshAllPages();
        }
        
        // Show success notification
        this.showNotification(
            'CalorieAI Sync',
            'Your offline data has been synchronized!',
            { tag: 'sync-success' }
        );
    }

    // UI Helper Methods
    showInstallButton() {
        const installButton = document.getElementById('installBtn');
        
        if (installButton) {
            installButton.style.display = 'block';
            installButton.addEventListener('click', () => this.promptInstall(), { once: true });
        }
    }

    hideInstallButton() {
        const installButton = document.getElementById('installBtn');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    showInstallSuccess() {
        this.showNotification(
            'CalorieAI Installed!',
            'You can now use CalorieAI offline and receive meal reminders.',
            { tag: 'install-success' }
        );
    }

    showUpdateAvailable() {
        const updateButton = document.createElement('button');
        updateButton.className = 'update-btn';
        updateButton.innerHTML = '🔄 Update Available';
        updateButton.addEventListener('click', () => this.updateApp());
        
        const header = document.querySelector('.app-header');
        if (header) {
            header.appendChild(updateButton);
        }
    }

    async updateApp() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }

    showOfflineIndicator() {
        let indicator = document.getElementById('offlineIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offlineIndicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = '📡 Offline - Data will sync when online';
            
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = 'block';
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // Utility Methods
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Storage Usage Management
    async checkStorageUsage() {
        const usage = await this.indexedDB.getStorageUsage();
        if (usage && usage.percentage > 80) {
            this.showStorageWarning(usage);
        }
        return usage;
    }

    showStorageWarning(usage) {
        const message = `Storage is ${Math.round(usage.percentage)}% full. Consider clearing old recordings.`;
        
        this.showNotification(
            'Storage Warning',
            message,
            { 
                tag: 'storage-warning',
                actions: [
                    { action: 'cleanup', title: 'Clean Up' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            }
        );
    }

    async cleanupOldData() {
        try {
            const deletedCount = await this.indexedDB.cleanupOldFiles();
            
            this.showNotification(
                'Cleanup Complete',
                `Removed ${deletedCount} old audio files to free up space.`,
                { tag: 'cleanup-success' }
            );
            
            return deletedCount;
        } catch (error) {
            console.error('PWA: Cleanup failed:', error);
            return 0;
        }
    }

    // Meal Reminder Scheduling
    async scheduleMealReminder(mealType = 'meal', hours = 1) {
        const title = 'CalorieAI Reminder';
        const body = `Time to log your ${mealType}!`;
        
        await this.scheduleReminder(title, body, hours * 60);
        console.log(`PWA: ${mealType} reminder scheduled for ${hours} hour(s)`);
    }
}

// Export for use in other modules
window.PWAManager = PWAManager;