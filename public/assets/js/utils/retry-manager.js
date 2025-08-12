/**
 * Retry Manager Utility
 * Provides retry mechanisms with exponential backoff for failed operations
 */
class RetryManager {
    constructor(options = {}) {
        this.options = {
            maxRetries: options.maxRetries || 3,
            baseDelay: options.baseDelay || 1000,
            maxDelay: options.maxDelay || 10000,
            backoffFactor: options.backoffFactor || 2,
            jitter: options.jitter !== false,
            retryCondition: options.retryCondition || this.defaultRetryCondition,
            onRetry: options.onRetry || null,
            onFailure: options.onFailure || null,
            ...options
        };
        
        this.activeRetries = new Map();
    }
    
    /**
     * Execute operation with retry logic
     */
    async execute(operation, operationId = null, options = {}) {
        const config = { ...this.options, ...options };
        const id = operationId || this.generateOperationId();
        
        // Cancel existing retry for same operation
        if (this.activeRetries.has(id)) {
            this.cancel(id);
        }
        
        const retryState = {
            id,
            operation,
            config,
            attempt: 0,
            startTime: Date.now(),
            cancelled: false
        };
        
        this.activeRetries.set(id, retryState);
        
        try {
            const result = await this.executeWithRetry(retryState);
            this.activeRetries.delete(id);
            return result;
        } catch (error) {
            this.activeRetries.delete(id);
            throw error;
        }
    }
    
    /**
     * Execute operation with retry logic
     */
    async executeWithRetry(retryState) {
        const { operation, config } = retryState;
        
        while (retryState.attempt <= config.maxRetries && !retryState.cancelled) {
            try {
                const result = await operation();
                return result;
            } catch (error) {
                retryState.attempt++;
                
                // Check if we should retry
                if (retryState.attempt > config.maxRetries || 
                    !config.retryCondition(error, retryState.attempt)) {
                    
                    if (config.onFailure) {
                        config.onFailure(error, retryState);
                    }
                    throw error;
                }
                
                // Calculate delay with exponential backoff
                const delay = this.calculateDelay(retryState.attempt, config);
                
                // Notify about retry
                if (config.onRetry) {
                    config.onRetry(error, retryState.attempt, delay);
                }
                
                // Wait before retry
                await this.delay(delay);
                
                // Check if cancelled during delay
                if (retryState.cancelled) {
                    throw new Error('Operation cancelled');
                }
            }
        }
    }
    
    /**
     * Calculate delay with exponential backoff and jitter
     */
    calculateDelay(attempt, config) {
        let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
        
        // Apply maximum delay limit
        delay = Math.min(delay, config.maxDelay);
        
        // Add jitter to prevent thundering herd
        if (config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        return Math.floor(delay);
    }
    
    /**
     * Default retry condition
     */
    defaultRetryCondition(error, attempt) {
        // Retry on network errors, 5xx server errors, and timeouts
        if (error.name === 'NetworkError' || 
            error.name === 'TypeError' ||
            error.message.includes('fetch')) {
            return true;
        }
        
        if (error.status >= 500 && error.status < 600) {
            return true;
        }
        
        if (error.status === 408 || error.status === 429) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Cancel active retry operation
     */
    cancel(operationId) {
        const retryState = this.activeRetries.get(operationId);
        if (retryState) {
            retryState.cancelled = true;
            this.activeRetries.delete(operationId);
        }
    }
    
    /**
     * Cancel all active retry operations
     */
    cancelAll() {
        this.activeRetries.forEach((retryState) => {
            retryState.cancelled = true;
        });
        this.activeRetries.clear();
    }
    
    /**
     * Get active retry operations
     */
    getActiveRetries() {
        return Array.from(this.activeRetries.keys());
    }
    
    /**
     * Check if operation is being retried
     */
    isRetrying(operationId) {
        return this.activeRetries.has(operationId);
    }
    
    /**
     * Create retry-enabled fetch wrapper
     */
    createFetch(options = {}) {
        return async (url, fetchOptions = {}) => {
            const operation = () => fetch(url, fetchOptions);
            const operationId = `fetch_${url}_${Date.now()}`;
            
            return this.execute(operation, operationId, {
                ...options,
                retryCondition: (error, attempt) => {
                    // Custom retry condition for fetch operations
                    if (!navigator.onLine) {
                        return false; // Don't retry when offline
                    }
                    
                    return this.defaultRetryCondition(error, attempt);
                }
            });
        };
    }
    
    /**
     * Create retry-enabled API call wrapper
     */
    createApiCall(baseUrl = '', options = {}) {
        const retryFetch = this.createFetch(options);
        
        return async (endpoint, requestOptions = {}) => {
            const url = baseUrl + endpoint;
            const response = await retryFetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...requestOptions.headers
                },
                ...requestOptions
            });
            
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = response;
                throw error;
            }
            
            return response.json();
        };
    }
    
    /**
     * Utility methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Create user-friendly retry button
     */
    createRetryButton(operation, options = {}) {
        const button = document.createElement('button');
        button.className = options.className || 'btn btn-outline-primary btn-sm';
        button.innerHTML = `<i class="fas fa-refresh"></i> ${options.label || 'Try Again'}`;
        
        button.addEventListener('click', async () => {
            if (window.loadingManager) {
                window.loadingManager.showInlineLoading(button, {
                    message: options.loadingMessage || 'Retrying...'
                });
            }
            
            try {
                await this.execute(operation, options.operationId, options);
                if (options.onSuccess) {
                    options.onSuccess();
                }
            } catch (error) {
                if (options.onError) {
                    options.onError(error);
                }
            } finally {
                if (window.loadingManager) {
                    window.loadingManager.hideInlineLoading(button);
                }
            }
        });
        
        return button;
    }
    
    /**
     * Show retry notification
     */
    showRetryNotification(error, attempt, delay, options = {}) {
        const notification = document.createElement('div');
        notification.className = 'retry-notification alert alert-warning';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div class="flex-grow-1">
                    <strong>Connection Issue</strong><br>
                    <small>Retrying in ${Math.ceil(delay / 1000)} seconds... (Attempt ${attempt})</small>
                </div>
                <button class="btn btn-sm btn-outline-secondary cancel-retry">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="retry-progress">
                <div class="retry-progress-bar" style="animation-duration: ${delay}ms;"></div>
            </div>
        `;
        
        // Add to notification container or body
        const container = document.getElementById('notification-container') || document.body;
        container.appendChild(notification);
        
        // Auto-remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, delay + 500);
        
        // Cancel button handler
        const cancelButton = notification.querySelector('.cancel-retry');
        cancelButton.addEventListener('click', () => {
            if (options.onCancel) {
                options.onCancel();
            }
            notification.remove();
        });
        
        return notification;
    }
    
    /**
     * Destroy retry manager
     */
    destroy() {
        this.cancelAll();
    }
}

// Global retry manager instance
let retryManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        retryManager = new RetryManager();
        window.retryManager = retryManager;
    });
} else {
    retryManager = new RetryManager();
    window.retryManager = retryManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RetryManager;
}