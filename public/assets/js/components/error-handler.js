/**
 * Error Handler Component
 * Provides comprehensive error handling for dashboard components with graceful degradation
 */
class ErrorHandler {
    constructor(options = {}) {
        this.options = {
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 1000,
            maxRetryDelay: options.maxRetryDelay || 10000,
            enableOfflineMode: options.enableOfflineMode !== false,
            enableFallbackData: options.enableFallbackData !== false,
            logErrors: options.logErrors !== false,
            showUserNotifications: options.showUserNotifications !== false,
            ...options
        };
        
        this.errorCounts = new Map();
        this.offlineMode = false;
        this.retryQueue = new Map();
        
        this.init();
    }
    
    init() {
        this.setupGlobalErrorHandling();
        this.setupNetworkMonitoring();
        this.setupUnhandledRejectionHandling();
    }
    
    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event.error, event.filename, event.lineno, event.colno);
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event.reason);
            event.preventDefault(); // Prevent console error
        });
    }
    
    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkStatusChange(false);
        });
        
        // Initial network status check
        this.offlineMode = !navigator.onLine;
        if (this.offlineMode) {
            this.showOfflineMode();
        }
    }
    
    /**
     * Setup unhandled rejection handling
     */
    setupUnhandledRejectionHandling() {
        // This is already handled in setupGlobalErrorHandling
        // but we can add additional logic here if needed
    }
    
    /**
     * Main error handling method
     */
    async handleApiError(error, context = {}) {
        const errorInfo = this.analyzeError(error);
        const errorKey = this.getErrorKey(context);
        
        // Increment error count
        this.incrementErrorCount(errorKey);
        
        // Log error if enabled
        if (this.options.logErrors) {
            this.logError(error, context, errorInfo);
        }
        
        // Handle based on error type
        switch (errorInfo.type) {
            case 'network':
                return await this.handleNetworkError(error, context, errorInfo);
            case 'auth':
                return this.handleAuthError(error, context, errorInfo);
            case 'data':
                return this.handleDataError(error, context, errorInfo);
            case 'validation':
                return this.handleValidationError(error, context, errorInfo);
            case 'server':
                return this.handleServerError(error, context, errorInfo);
            default:
                return this.handleGenericError(error, context, errorInfo);
        }
    }
    
    /**
     * Analyze error to determine type and severity
     */
    analyzeError(error) {
        const errorInfo = {
            type: 'generic',
            severity: 'medium',
            retryable: false,
            userMessage: 'An unexpected error occurred',
            technicalMessage: error.message || 'Unknown error'
        };
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
            errorInfo.type = 'network';
            errorInfo.retryable = true;
            errorInfo.userMessage = 'Network connection problem';
        } else if (error.name === 'NetworkError' || error.message.includes('NetworkError')) {
            errorInfo.type = 'network';
            errorInfo.retryable = true;
            errorInfo.userMessage = 'Network connection problem';
        } else if (error.status === 401 || error.message.includes('unauthorized')) {
            errorInfo.type = 'auth';
            errorInfo.severity = 'high';
            errorInfo.userMessage = 'Authentication required';
        } else if (error.status === 403) {
            errorInfo.type = 'auth';
            errorInfo.severity = 'high';
            errorInfo.userMessage = 'Access denied';
        } else if (error.status === 404) {
            errorInfo.type = 'data';
            errorInfo.userMessage = 'Requested data not found';
        } else if (error.status === 400 || error.status === 422) {
            errorInfo.type = 'validation';
            errorInfo.userMessage = 'Invalid data provided';
        } else if (error.status >= 500) {
            errorInfo.type = 'server';
            errorInfo.severity = 'high';
            errorInfo.retryable = true;
            errorInfo.userMessage = 'Server error occurred';
        } else if (error.status >= 400 && error.status < 500) {
            errorInfo.type = 'data';
            errorInfo.userMessage = 'Request could not be processed';
        }
        
        return errorInfo;
    }
    
    /**
     * Handle network errors
     */
    async handleNetworkError(error, context, errorInfo) {
        if (!navigator.onLine) {
            return this.showOfflineMode(context);
        }
        
        // Try to retry the request
        if (errorInfo.retryable && this.shouldRetry(context)) {
            return await this.retryRequest(context);
        }
        
        // Show fallback data if available
        if (this.options.enableFallbackData) {
            const fallbackData = this.showFallbackData(context);
            if (fallbackData) {
                return fallbackData;
            }
        }
        
        // Show error message with retry option
        this.showErrorMessage(errorInfo.userMessage, 'network', context);
        return null;
    }
    
    /**
     * Handle authentication errors
     */
    handleAuthError(error, context, errorInfo) {
        if (error.status === 401) {
            // Redirect to login or show login modal
            this.redirectToLogin();
        } else {
            this.showErrorMessage(errorInfo.userMessage, 'auth', context);
        }
        return null;
    }
    
    /**
     * Handle data errors
     */
    handleDataError(error, context, errorInfo) {
        // Show fallback data if available
        if (this.options.enableFallbackData) {
            const fallbackData = this.showFallbackData(context);
            if (fallbackData) {
                return fallbackData;
            }
        }
        
        this.showErrorMessage(errorInfo.userMessage, 'data', context);
        return null;
    }
    
    /**
     * Handle validation errors
     */
    handleValidationError(error, context, errorInfo) {
        let message = errorInfo.userMessage;
        
        // Try to extract more specific validation messages
        if (error.response && error.response.errors) {
            const errors = Object.values(error.response.errors).flat();
            message = errors.join(', ');
        }
        
        this.showErrorMessage(message, 'validation', context);
        return null;
    }
    
    /**
     * Handle server errors
     */
    async handleServerError(error, context, errorInfo) {
        // Try to retry the request
        if (errorInfo.retryable && this.shouldRetry(context)) {
            return await this.retryRequest(context);
        }
        
        // Show fallback data if available
        if (this.options.enableFallbackData) {
            const fallbackData = this.showFallbackData(context);
            if (fallbackData) {
                return fallbackData;
            }
        }
        
        this.showErrorMessage(errorInfo.userMessage, 'server', context);
        return null;
    }
    
    /**
     * Handle generic errors
     */
    handleGenericError(error, context, errorInfo) {
        this.showErrorMessage(errorInfo.userMessage, 'generic', context);
        return null;
    }
    
    /**
     * Show offline mode
     */
    showOfflineMode(context = {}) {
        this.offlineMode = true;
        
        // Show offline indicator
        this.showOfflineIndicator();
        
        // Try to load cached data
        const cachedData = this.loadCachedData(context);
        if (cachedData) {
            this.showCachedDataIndicator(context);
            return cachedData;
        }
        
        // Show offline message
        this.showOfflineMessage(context);
        return null;
    }
    
    /**
     * Show fallback data
     */
    showFallbackData(context = {}) {
        // Try to load from cache first
        const cachedData = this.loadCachedData(context);
        if (cachedData) {
            this.showCachedDataIndicator(context);
            return cachedData;
        }
        
        // Generate default fallback data based on context
        const fallbackData = this.generateFallbackData(context);
        if (fallbackData) {
            this.showFallbackDataIndicator(context);
            return fallbackData;
        }
        
        return null;
    }
    
    /**
     * Retry request with exponential backoff
     */
    async retryRequest(context) {
        const errorKey = this.getErrorKey(context);
        const retryCount = this.errorCounts.get(errorKey) || 0;
        
        if (retryCount >= this.options.retryAttempts) {
            return null;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.options.retryDelay * Math.pow(2, retryCount),
            this.options.maxRetryDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        // Show retry indicator
        this.showRetryIndicator(context, retryCount + 1);
        
        // Wait before retrying
        await this.sleep(jitteredDelay);
        
        try {
            // Attempt to retry the original request
            if (context.retryFunction && typeof context.retryFunction === 'function') {
                const result = await context.retryFunction();
                
                // Reset error count on success
                this.errorCounts.delete(errorKey);
                this.hideRetryIndicator(context);
                
                return result;
            }
        } catch (retryError) {
            // Increment error count and try again
            this.incrementErrorCount(errorKey);
            return await this.retryRequest(context);
        }
        
        return null;
    }
    
    /**
     * Handle network status changes
     */
    handleNetworkStatusChange(isOnline) {
        if (isOnline && this.offlineMode) {
            this.offlineMode = false;
            this.hideOfflineIndicator();
            this.showNetworkRestoredMessage();
            
            // Retry queued requests
            this.retryQueuedRequests();
        } else if (!isOnline && !this.offlineMode) {
            this.offlineMode = true;
            this.showOfflineIndicator();
        }
    }
    
    /**
     * Handle JavaScript errors
     */
    handleJavaScriptError(error, filename, lineno, colno) {
        const errorInfo = {
            type: 'javascript',
            message: error.message,
            filename,
            lineno,
            colno,
            stack: error.stack
        };
        
        if (this.options.logErrors) {
            console.error('JavaScript Error:', errorInfo);
        }
        
        // Don't show user notifications for JavaScript errors by default
        // as they might be too technical
    }
    
    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(reason) {
        const errorInfo = {
            type: 'unhandled_rejection',
            reason: reason
        };
        
        if (this.options.logErrors) {
            console.error('Unhandled Promise Rejection:', errorInfo);
        }
        
        // Try to handle as API error if it looks like one
        if (reason && (reason.status || reason.message)) {
            this.handleApiError(reason, { source: 'unhandled_rejection' });
        }
    }
    
    /**
     * Utility methods
     */
    getErrorKey(context) {
        return `${context.component || 'unknown'}_${context.action || 'unknown'}`;
    }
    
    incrementErrorCount(errorKey) {
        const currentCount = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, currentCount + 1);
    }
    
    shouldRetry(context) {
        const errorKey = this.getErrorKey(context);
        const retryCount = this.errorCounts.get(errorKey) || 0;
        return retryCount < this.options.retryAttempts;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    loadCachedData(context) {
        try {
            const cacheKey = `${context.component}_${context.action}_cache`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                const now = Date.now();
                
                // Check if cache is still valid (default 1 hour)
                const maxAge = context.cacheMaxAge || 3600000;
                if (now - data.timestamp < maxAge) {
                    return data.value;
                }
            }
        } catch (error) {
            console.warn('Failed to load cached data:', error);
        }
        
        return null;
    }
    
    generateFallbackData(context) {
        // Generate appropriate fallback data based on context
        switch (context.component) {
            case 'dashboard-statistics':
                return {
                    total_pets: 0,
                    meals_today: 0,
                    health_score: 100,
                    next_checkup: 0
                };
            case 'activity-feed':
                return [];
            case 'pet-list':
                return [];
            default:
                return null;
        }
    }
    
    logError(error, context, errorInfo) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                status: error.status
            },
            context,
            errorInfo,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Error Handler Log:', logEntry);
        
        // Could send to logging service here
        // this.sendToLoggingService(logEntry);
    }
    
    /**
     * UI Methods
     */
    showErrorMessage(message, type, context) {
        if (!this.options.showUserNotifications) return;
        
        const errorContainer = this.getOrCreateErrorContainer(context);
        
        const errorElement = document.createElement('div');
        errorElement.className = `error-message error-${type}`;
        errorElement.innerHTML = `
            <div class="error-content">
                <div class="error-icon">
                    <i class="fas ${this.getErrorIcon(type)}"></i>
                </div>
                <div class="error-text">
                    <div class="error-title">${this.getErrorTitle(type)}</div>
                    <div class="error-description">${message}</div>
                </div>
                <div class="error-actions">
                    ${this.shouldShowRetryButton(type, context) ? `
                        <button class="btn btn-sm btn-outline error-retry-btn" onclick="errorHandler.retryLastAction('${this.getErrorKey(context)}')">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-ghost error-dismiss-btn" onclick="this.closest('.error-message').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        errorContainer.appendChild(errorElement);
        
        // Auto-dismiss after 10 seconds for non-critical errors
        if (type !== 'auth' && type !== 'server') {
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.remove();
                }
            }, 10000);
        }
    }
    
    showOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = `
                <div class="offline-content">
                    <i class="fas fa-wifi-slash"></i>
                    <span>You're offline</span>
                </div>
            `;
            
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = 'block';
    }
    
    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    showCachedDataIndicator(context) {
        const container = this.getComponentContainer(context);
        if (!container) return;
        
        let indicator = container.querySelector('.cached-data-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'cached-data-indicator';
            indicator.innerHTML = `
                <i class="fas fa-database"></i>
                <span>Showing cached data</span>
            `;
            container.insertBefore(indicator, container.firstChild);
        }
    }
    
    showFallbackDataIndicator(context) {
        const container = this.getComponentContainer(context);
        if (!container) return;
        
        let indicator = container.querySelector('.fallback-data-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'fallback-data-indicator';
            indicator.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Limited functionality - some data unavailable</span>
            `;
            container.insertBefore(indicator, container.firstChild);
        }
    }
    
    showRetryIndicator(context, attempt) {
        const container = this.getComponentContainer(context);
        if (!container) return;
        
        let indicator = container.querySelector('.retry-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'retry-indicator';
            container.appendChild(indicator);
        }
        
        indicator.innerHTML = `
            <div class="retry-content">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Retrying... (attempt ${attempt})</span>
            </div>
        `;
    }
    
    hideRetryIndicator(context) {
        const container = this.getComponentContainer(context);
        if (!container) return;
        
        const indicator = container.querySelector('.retry-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showOfflineMessage(context) {
        const container = this.getComponentContainer(context);
        if (!container) return;
        
        container.innerHTML = `
            <div class="offline-message">
                <div class="offline-icon">
                    <i class="fas fa-wifi-slash"></i>
                </div>
                <div class="offline-text">
                    <h4>You're offline</h4>
                    <p>Check your internet connection and try again</p>
                </div>
                <div class="offline-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            </div>
        `;
    }
    
    showNetworkRestoredMessage() {
        if (!this.options.showUserNotifications) return;
        
        const notification = document.createElement('div');
        notification.className = 'network-restored-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-wifi"></i>
                <span>Connection restored</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    redirectToLogin() {
        // Check if we're already on login page
        if (window.location.pathname.includes('login')) {
            return;
        }
        
        // Store current page for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        // Redirect to login
        window.location.href = '/login.php';
    }
    
    /**
     * Helper methods for UI
     */
    getOrCreateErrorContainer(context) {
        const componentContainer = this.getComponentContainer(context);
        
        if (componentContainer) {
            let errorContainer = componentContainer.querySelector('.error-container');
            if (!errorContainer) {
                errorContainer = document.createElement('div');
                errorContainer.className = 'error-container';
                componentContainer.insertBefore(errorContainer, componentContainer.firstChild);
            }
            return errorContainer;
        }
        
        // Fallback to body
        let globalErrorContainer = document.getElementById('global-error-container');
        if (!globalErrorContainer) {
            globalErrorContainer = document.createElement('div');
            globalErrorContainer.id = 'global-error-container';
            globalErrorContainer.className = 'global-error-container';
            document.body.appendChild(globalErrorContainer);
        }
        
        return globalErrorContainer;
    }
    
    getComponentContainer(context) {
        if (context.containerId) {
            return document.getElementById(context.containerId);
        }
        
        if (context.component) {
            return document.querySelector(`.${context.component}-container`) ||
                   document.getElementById(`${context.component}-container`) ||
                   document.querySelector(`[data-component="${context.component}"]`);
        }
        
        return null;
    }
    
    getErrorIcon(type) {
        const icons = {
            network: 'fa-wifi-slash',
            auth: 'fa-lock',
            data: 'fa-database',
            validation: 'fa-exclamation-triangle',
            server: 'fa-server',
            generic: 'fa-exclamation-circle'
        };
        
        return icons[type] || icons.generic;
    }
    
    getErrorTitle(type) {
        const titles = {
            network: 'Connection Problem',
            auth: 'Authentication Required',
            data: 'Data Not Available',
            validation: 'Invalid Input',
            server: 'Server Error',
            generic: 'Error Occurred'
        };
        
        return titles[type] || titles.generic;
    }
    
    shouldShowRetryButton(type, context) {
        return ['network', 'server'].includes(type) && this.shouldRetry(context);
    }
    
    /**
     * Public methods
     */
    retryLastAction(errorKey) {
        // This would retry the last failed action
        // Implementation depends on how actions are stored
        console.log('Retrying action for key:', errorKey);
    }
    
    retryQueuedRequests() {
        // Retry any queued requests when network is restored
        this.retryQueue.forEach((request, key) => {
            if (typeof request === 'function') {
                request().catch(error => {
                    console.warn('Failed to retry queued request:', error);
                });
            }
        });
        
        this.retryQueue.clear();
    }
    
    clearErrors(context) {
        const container = this.getComponentContainer(context);
        if (container) {
            const errorContainer = container.querySelector('.error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }
        }
    }
    
    destroy() {
        // Clean up event listeners and clear data
        this.errorCounts.clear();
        this.retryQueue.clear();
    }
}

// Initialize global error handler
let errorHandler = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        errorHandler = new ErrorHandler();
        window.errorHandler = errorHandler;
    });
} else {
    errorHandler = new ErrorHandler();
    window.errorHandler = errorHandler;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}