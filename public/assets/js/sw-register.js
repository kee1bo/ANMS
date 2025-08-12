/**
 * Service Worker Registration
 * Handles service worker registration and updates
 */

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
        
        this.init();
    }
    
    async init() {
        if ('serviceWorker' in navigator) {
            try {
                await this.registerServiceWorker();
                this.setupUpdateHandling();
                this.setupMessageHandling();
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        } else {
            console.log('Service Worker not supported');
        }
    }
    
    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered successfully');
            
            // Check for updates
            this.registration.addEventListener('updatefound', () => {
                this.handleUpdateFound();
            });
            
            // Handle controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service Worker controller changed');
                window.location.reload();
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }
    
    handleUpdateFound() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New update available
                    this.updateAvailable = true;
                    this.showUpdateNotification();
                } else {
                    // First install
                    console.log('Service Worker installed for the first time');
                    this.showInstallNotification();
                }
            }
        });
    }
    
    setupUpdateHandling() {
        // Check for updates periodically
        setInterval(() => {
            if (this.registration) {
                this.registration.update();
            }
        }, 60000); // Check every minute
        
        // Check for updates when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.registration) {
                this.registration.update();
            }
        });
    }
    
    setupMessageHandling() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, payload } = event.data;
            
            switch (type) {
                case 'BACKGROUND_SYNC':
                    this.handleBackgroundSync(payload);
                    break;
                    
                case 'CACHE_UPDATED':
                    this.handleCacheUpdated(payload);
                    break;
                    
                case 'OFFLINE_STATUS':
                    this.handleOfflineStatus(payload);
                    break;
            }
        });
    }
    
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'sw-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-download"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">Update Available</div>
                    <div class="notification-description">A new version of the app is available</div>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-primary btn-sm" onclick="swManager.applyUpdate()">
                        Update Now
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.sw-update-notification').remove()">
                        Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }
    
    showInstallNotification() {
        const notification = document.createElement('div');
        notification.className = 'sw-install-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">App Ready for Offline Use</div>
                    <div class="notification-description">You can now use this app even when offline</div>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-ghost btn-sm" onclick="this.closest('.sw-install-notification').remove()">
                        Got it
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    async applyUpdate() {
        if (this.registration && this.registration.waiting) {
            // Tell the waiting service worker to skip waiting
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }
    
    handleBackgroundSync(payload) {
        console.log('Background sync status:', payload.status);
        
        if (payload.status === 'processing') {
            this.showSyncNotification();
        }
    }
    
    handleCacheUpdated(payload) {
        console.log('Cache updated:', payload);
    }
    
    handleOfflineStatus(payload) {
        if (payload.offline) {
            this.showOfflineNotification();
        } else {
            this.hideOfflineNotification();
        }
    }
    
    showSyncNotification() {
        let notification = document.getElementById('sync-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'sync-notification';
            notification.className = 'sync-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-sync fa-spin"></i>
                    <span>Syncing data...</span>
                </div>
            `;
            document.body.appendChild(notification);
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showOfflineNotification() {
        let notification = document.getElementById('offline-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'offline-notification';
            notification.className = 'offline-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-wifi-slash"></i>
                    <span>You're offline - using cached data</span>
                </div>
            `;
            document.body.appendChild(notification);
        }
    }
    
    hideOfflineNotification() {
        const notification = document.getElementById('offline-notification');
        if (notification) {
            notification.remove();
        }
    }
    
    // Public API methods
    async getCacheSize() {
        if (!this.registration || !this.registration.active) {
            return 0;
        }
        
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.size);
            };
            
            this.registration.active.postMessage(
                { type: 'GET_CACHE_SIZE' },
                [messageChannel.port2]
            );
        });
    }
    
    async clearCache() {
        if (this.registration && this.registration.active) {
            this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
        }
    }
    
    async cacheUrls(urls) {
        if (this.registration && this.registration.active) {
            this.registration.active.postMessage({
                type: 'CACHE_URLS',
                payload: { urls }
            });
        }
    }
    
    isUpdateAvailable() {
        return this.updateAvailable;
    }
    
    isServiceWorkerSupported() {
        return 'serviceWorker' in navigator;
    }
    
    getRegistration() {
        return this.registration;
    }
}

// Initialize service worker manager
let swManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        swManager = new ServiceWorkerManager();
        window.swManager = swManager;
    });
} else {
    swManager = new ServiceWorkerManager();
    window.swManager = swManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerManager;
}