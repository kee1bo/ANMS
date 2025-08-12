/**
 * Network Status Monitor
 * Monitors network connectivity and provides visual feedback
 */
class NetworkMonitor {
    constructor(options = {}) {
        this.options = {
            showIndicator: options.showIndicator !== false,
            indicatorPosition: options.indicatorPosition || 'bottom-left',
            checkInterval: options.checkInterval || 30000, // 30 seconds
            checkUrl: options.checkUrl || '/api/health-check.php',
            onOnline: options.onOnline || null,
            onOffline: options.onOffline || null,
            onReconnecting: options.onReconnecting || null,
            ...options
        };
        
        this.isOnline = navigator.onLine;
        this.isChecking = false;
        this.checkTimer = null;
        this.indicator = null;
        this.lastCheckTime = null;
        this.consecutiveFailures = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createIndicator();
        this.startPeriodicCheck();
        this.updateIndicator();
    }
    
    /**
     * Setup event listeners for network changes
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Listen for visibility changes to check connection when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.checkConnection();
            }
        });
        
        // Listen for focus events to check connection
        window.addEventListener('focus', () => {
            if (this.isOnline) {
                this.checkConnection();
            }
        });
    }
    
    /**
     * Handle online event
     */
    handleOnline() {
        console.log('Network: Browser reports online');
        this.checkConnection().then(isActuallyOnline => {
            if (isActuallyOnline) {
                this.setOnlineStatus(true);
            }
        });
    }
    
    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('Network: Browser reports offline');
        this.setOnlineStatus(false);
    }
    
    /**
     * Set online status
     */
    setOnlineStatus(online) {
        const wasOnline = this.isOnline;
        this.isOnline = online;
        
        if (online && !wasOnline) {
            console.log('Network: Connection restored');
            this.consecutiveFailures = 0;
            this.updateIndicator();
            
            if (this.options.onOnline) {
                this.options.onOnline();
            }
            
            // Trigger reconnection event
            document.dispatchEvent(new CustomEvent('networkReconnected'));
            
        } else if (!online && wasOnline) {
            console.log('Network: Connection lost');
            this.updateIndicator();
            
            if (this.options.onOffline) {
                this.options.onOffline();
            }
            
            // Trigger disconnection event
            document.dispatchEvent(new CustomEvent('networkDisconnected'));
        }
    }
    
    /**
     * Check actual network connectivity
     */
    async checkConnection() {
        if (this.isChecking) return this.isOnline;
        
        this.isChecking = true;
        this.lastCheckTime = Date.now();
        
        try {
            // Show reconnecting status if we were offline
            if (!this.isOnline) {
                this.showReconnectingStatus();
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(this.options.checkUrl, {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const isOnline = response.ok;
            
            if (isOnline) {
                this.consecutiveFailures = 0;
            } else {
                this.consecutiveFailures++;
            }
            
            this.setOnlineStatus(isOnline);
            return isOnline;
            
        } catch (error) {
            console.log('Network check failed:', error.message);
            this.consecutiveFailures++;
            
            // Only set offline if we have multiple consecutive failures
            if (this.consecutiveFailures >= 2) {
                this.setOnlineStatus(false);
            }
            
            return false;
        } finally {
            this.isChecking = false;
        }
    }
    
    /**
     * Show reconnecting status
     */
    showReconnectingStatus() {
        if (this.indicator) {
            this.indicator.className = 'network-status reconnecting';
            this.indicator.innerHTML = `
                <i class="fas fa-wifi"></i>
                <span>Reconnecting...</span>
            `;
        }
        
        if (this.options.onReconnecting) {
            this.options.onReconnecting();
        }
    }
    
    /**
     * Create network status indicator
     */
    createIndicator() {
        if (!this.options.showIndicator) return;
        
        this.indicator = document.createElement('div');
        this.indicator.className = 'network-status';
        this.indicator.id = 'network-status-indicator';
        
        // Position the indicator
        const positions = {
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' }
        };
        
        const position = positions[this.options.indicatorPosition] || positions['bottom-left'];
        Object.assign(this.indicator.style, position);
        
        // Add click handler for manual check
        this.indicator.addEventListener('click', () => {
            if (!this.isChecking) {
                this.checkConnection();
            }
        });
        
        document.body.appendChild(this.indicator);
    }
    
    /**
     * Update indicator appearance
     */
    updateIndicator() {
        if (!this.indicator) return;
        
        if (this.isOnline) {
            this.indicator.className = 'network-status online';
            this.indicator.innerHTML = `
                <i class="fas fa-wifi"></i>
                <span>Online</span>
            `;
            
            // Auto-hide after a few seconds when online
            setTimeout(() => {
                if (this.indicator && this.isOnline) {
                    this.indicator.style.opacity = '0.3';
                }
            }, 3000);
            
        } else {
            this.indicator.className = 'network-status offline';
            this.indicator.innerHTML = `
                <i class="fas fa-wifi-slash"></i>
                <span>Offline</span>
            `;
            this.indicator.style.opacity = '1';
        }
    }
    
    /**
     * Start periodic connectivity checks
     */
    startPeriodicCheck() {
        this.stopPeriodicCheck();
        
        this.checkTimer = setInterval(() => {
            // Only check if we think we're online
            if (this.isOnline && !document.hidden) {
                this.checkConnection();
            }
        }, this.options.checkInterval);
    }
    
    /**
     * Stop periodic connectivity checks
     */
    stopPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
    }
    
    /**
     * Get current network status
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            isChecking: this.isChecking,
            lastCheckTime: this.lastCheckTime,
            consecutiveFailures: this.consecutiveFailures
        };
    }
    
    /**
     * Force a connection check
     */
    async forceCheck() {
        return this.checkConnection();
    }
    
    /**
     * Show/hide indicator
     */
    showIndicator() {
        if (this.indicator) {
            this.indicator.style.display = 'block';
        }
    }
    
    hideIndicator() {
        if (this.indicator) {
            this.indicator.style.display = 'none';
        }
    }
    
    /**
     * Create retry-enabled fetch wrapper
     */
    createNetworkAwareFetch() {
        return async (url, options = {}) => {
            // Check if we're online first
            if (!this.isOnline) {
                throw new Error('Network unavailable - you are offline');
            }
            
            try {
                const response = await fetch(url, options);
                
                // If request succeeds, we're definitely online
                if (response.ok && !this.isOnline) {
                    this.setOnlineStatus(true);
                }
                
                return response;
                
            } catch (error) {
                // If fetch fails, check if it's a network issue
                if (error.name === 'TypeError' || error.message.includes('fetch')) {
                    // Trigger a connectivity check
                    this.checkConnection();
                }
                
                throw error;
            }
        };
    }
    
    /**
     * Add network status to error messages
     */
    enhanceErrorMessage(originalMessage) {
        if (!this.isOnline) {
            return `${originalMessage} (You are currently offline)`;
        }
        
        if (this.consecutiveFailures > 0) {
            return `${originalMessage} (Connection may be unstable)`;
        }
        
        return originalMessage;
    }
    
    /**
     * Destroy network monitor
     */
    destroy() {
        this.stopPeriodicCheck();
        
        if (this.indicator && this.indicator.parentNode) {
            this.indicator.parentNode.removeChild(this.indicator);
        }
        
        // Remove event listeners would require keeping references
        // For now, they'll be cleaned up when the page unloads
    }
}

// Create global network monitor instance
let networkMonitor = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        networkMonitor = new NetworkMonitor();
        window.networkMonitor = networkMonitor;
    });
} else {
    networkMonitor = new NetworkMonitor();
    window.networkMonitor = networkMonitor;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkMonitor;
}