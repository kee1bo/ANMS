/**
 * Loading Manager Component
 * Manages loading states, skeleton screens, and retry mechanisms
 */
class LoadingManager {
    constructor(options = {}) {
        this.options = {
            defaultTimeout: options.defaultTimeout || 30000, // 30 seconds
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 1000,
            maxRetryDelay: options.maxRetryDelay || 10000,
            showSkeletons: options.showSkeletons !== false,
            showProgress: options.showProgress !== false,
            ...options
        };
        
        this.loadingStates = new Map();
        this.retryQueues = new Map();
        this.timeouts = new Map();
        
        this.init();
    }
    
    init() {
        this.setupGlobalLoadingHandlers();
        this.createGlobalLoadingOverlay();
    }
    
    /**
     * Setup global loading event handlers
     */
    setupGlobalLoadingHandlers() {
        // Listen for fetch events to show loading states
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const options = args[1] || {};
            
            // Don't show loading for background requests
            if (options.background) {
                return originalFetch(...args);
            }
            
            const loadingId = this.generateLoadingId(url);
            
            try {
                this.startLoading(loadingId, { url, type: 'api' });
                const response = await originalFetch(...args);
                this.stopLoading(loadingId);
                return response;
            } catch (error) {
                this.stopLoading(loadingId);
                throw error;
            }
        };
    }
    
    /**
     * Start loading state for a component or action
     */
    startLoading(id, options = {}) {
        const loadingState = {
            id,
            startTime: Date.now(),
            type: options.type || 'generic',
            component: options.component,
            message: options.message || 'Loading...',
            showSkeleton: options.showSkeleton !== false,
            showProgress: options.showProgress || false,
            timeout: options.timeout || this.options.defaultTimeout
        };
        
        this.loadingStates.set(id, loadingState);
        
        // Show loading UI
        this.showLoadingState(loadingState);
        
        // Set timeout
        if (loadingState.timeout > 0) {
            const timeoutId = setTimeout(() => {
                this.handleLoadingTimeout(id);
            }, loadingState.timeout);
            
            this.timeouts.set(id, timeoutId);
        }
        
        return id;
    }
    
    /**
     * Stop loading state
     */
    stopLoading(id) {
        const loadingState = this.loadingStates.get(id);
        if (!loadingState) return;
        
        // Clear timeout
        const timeoutId = this.timeouts.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(id);
        }
        
        // Hide loading UI
        this.hideLoadingState(loadingState);
        
        // Clean up
        this.loadingStates.delete(id);
        
        // Log performance
        const duration = Date.now() - loadingState.startTime;
        console.log(`Loading completed for ${id}: ${duration}ms`);
    }
    
    /**
     * Update loading progress
     */
    updateProgress(id, progress, message = null) {
        const loadingState = this.loadingStates.get(id);
        if (!loadingState) return;
        
        loadingState.progress = Math.max(0, Math.min(100, progress));
        if (message) {
            loadingState.message = message;
        }
        
        this.updateLoadingUI(loadingState);
    }
    
    /**
     * Show loading state UI
     */
    showLoadingState(loadingState) {
        const container = this.getLoadingContainer(loadingState);
        if (!container) return;
        
        // Remove existing loading elements
        this.hideLoadingState(loadingState);
        
        if (loadingState.showSkeleton && loadingState.type !== 'overlay') {
            this.showSkeletonScreen(container, loadingState);
        } else {
            this.showLoadingSpinner(container, loadingState);
        }
    }
    
    /**
     * Show skeleton screen
     */
    showSkeletonScreen(container, loadingState) {
        const skeletonType = this.getSkeletonType(loadingState);
        const skeletonHTML = this.generateSkeletonHTML(skeletonType);
        
        const skeletonElement = document.createElement('div');
        skeletonElement.className = `loading-skeleton-container skeleton-${loadingState.id}`;
        skeletonElement.innerHTML = skeletonHTML;
        
        // Hide original content
        const originalContent = container.children;
        Array.from(originalContent).forEach(child => {
            if (!child.classList.contains('loading-skeleton-container')) {
                child.style.display = 'none';
            }
        });
        
        container.appendChild(skeletonElement);
    }
    
    /**
     * Show loading spinner
     */
    showLoadingSpinner(container, loadingState) {
        const spinnerElement = document.createElement('div');
        spinnerElement.className = `loading-spinner-container spinner-${loadingState.id}`;
        spinnerElement.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-icon">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="spinner-message">${loadingState.message}</div>
                ${loadingState.showProgress ? `
                    <div class="spinner-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${loadingState.progress || 0}%"></div>
                        </div>
                        <div class="progress-text">${loadingState.progress || 0}%</div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Position spinner appropriately
        if (loadingState.type === 'overlay') {
            spinnerElement.classList.add('loading-overlay');
        }
        
        container.appendChild(spinnerElement);
    }
    
    /**
     * Hide loading state UI
     */
    hideLoadingState(loadingState) {
        const container = this.getLoadingContainer(loadingState);
        if (!container) return;
        
        // Remove skeleton screens
        const skeletonElements = container.querySelectorAll(`.skeleton-${loadingState.id}`);
        skeletonElements.forEach(element => element.remove());
        
        // Remove spinners
        const spinnerElements = container.querySelectorAll(`.spinner-${loadingState.id}`);
        spinnerElements.forEach(element => element.remove());
        
        // Show original content
        const originalContent = container.children;
        Array.from(originalContent).forEach(child => {
            if (!child.classList.contains('loading-skeleton-container') && 
                !child.classList.contains('loading-spinner-container')) {
                child.style.display = '';
            }
        });
    }
    
    /**
     * Update loading UI
     */
    updateLoadingUI(loadingState) {
        const container = this.getLoadingContainer(loadingState);
        if (!container) return;
        
        // Update message
        const messageElement = container.querySelector(`.spinner-${loadingState.id} .spinner-message`);
        if (messageElement) {
            messageElement.textContent = loadingState.message;
        }
        
        // Update progress
        if (loadingState.showProgress && loadingState.progress !== undefined) {
            const progressFill = container.querySelector(`.spinner-${loadingState.id} .progress-fill`);
            const progressText = container.querySelector(`.spinner-${loadingState.id} .progress-text`);
            
            if (progressFill) {
                progressFill.style.width = `${loadingState.progress}%`;
            }
            if (progressText) {
                progressText.textContent = `${loadingState.progress}%`;
            }
        }
    }
    
    /**
     * Handle loading timeout
     */
    handleLoadingTimeout(id) {
        const loadingState = this.loadingStates.get(id);
        if (!loadingState) return;
        
        console.warn(`Loading timeout for ${id}`);
        
        // Show timeout error with retry option
        this.showTimeoutError(loadingState);
        
        // Stop loading
        this.stopLoading(id);
    }
    
    /**
     * Show timeout error
     */
    showTimeoutError(loadingState) {
        const container = this.getLoadingContainer(loadingState);
        if (!container) return;
        
        const errorElement = document.createElement('div');
        errorElement.className = `timeout-error timeout-${loadingState.id}`;
        errorElement.innerHTML = `
            <div class="timeout-content">
                <div class="timeout-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="timeout-text">
                    <div class="timeout-title">Request Timed Out</div>
                    <div class="timeout-description">The request is taking longer than expected</div>
                </div>
                <div class="timeout-actions">
                    <button class="btn btn-primary btn-sm" onclick="loadingManager.retryLoading('${loadingState.id}')">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="loadingManager.cancelLoading('${loadingState.id}')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(errorElement);
    }
    
    /**
     * Retry loading with exponential backoff
     */
    async retryLoading(id, retryFunction = null) {
        const retryQueue = this.retryQueues.get(id) || { attempts: 0, lastAttempt: 0 };
        
        if (retryQueue.attempts >= this.options.retryAttempts) {
            this.showMaxRetriesError(id);
            return false;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.options.retryDelay * Math.pow(2, retryQueue.attempts),
            this.options.maxRetryDelay
        );
        
        // Add jitter
        const jitteredDelay = delay + Math.random() * 1000;
        
        // Update retry queue
        retryQueue.attempts++;
        retryQueue.lastAttempt = Date.now();
        this.retryQueues.set(id, retryQueue);
        
        // Show retry indicator
        this.showRetryIndicator(id, retryQueue.attempts, jitteredDelay);
        
        // Wait before retrying
        await this.sleep(jitteredDelay);
        
        // Hide retry indicator
        this.hideRetryIndicator(id);
        
        try {
            if (retryFunction && typeof retryFunction === 'function') {
                const result = await retryFunction();
                
                // Reset retry queue on success
                this.retryQueues.delete(id);
                return result;
            }
        } catch (error) {
            // Retry again if attempts remaining
            if (retryQueue.attempts < this.options.retryAttempts) {
                return await this.retryLoading(id, retryFunction);
            } else {
                this.showMaxRetriesError(id);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Show retry indicator
     */
    showRetryIndicator(id, attempt, delay) {
        const container = this.getLoadingContainer({ id });
        if (!container) return;
        
        const retryElement = document.createElement('div');
        retryElement.className = `retry-indicator retry-${id}`;
        retryElement.innerHTML = `
            <div class="retry-content">
                <div class="retry-icon">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="retry-text">
                    <div class="retry-title">Retrying... (${attempt}/${this.options.retryAttempts})</div>
                    <div class="retry-description">Waiting ${Math.round(delay / 1000)} seconds</div>
                </div>
            </div>
        `;
        
        container.appendChild(retryElement);
    }
    
    /**
     * Hide retry indicator
     */
    hideRetryIndicator(id) {
        const retryElements = document.querySelectorAll(`.retry-${id}`);
        retryElements.forEach(element => element.remove());
    }
    
    /**
     * Show max retries error
     */
    showMaxRetriesError(id) {
        const container = this.getLoadingContainer({ id });
        if (!container) return;
        
        const errorElement = document.createElement('div');
        errorElement.className = `max-retries-error error-${id}`;
        errorElement.innerHTML = `
            <div class="max-retries-content">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="error-text">
                    <div class="error-title">Unable to Load</div>
                    <div class="error-description">Maximum retry attempts reached. Please check your connection.</div>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary btn-sm" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Reload Page
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="loadingManager.cancelLoading('${id}')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(errorElement);
    }
    
    /**
     * Cancel loading
     */
    cancelLoading(id) {
        // Remove error elements
        const errorElements = document.querySelectorAll(`.error-${id}, .timeout-${id}, .retry-${id}`);
        errorElements.forEach(element => element.remove());
        
        // Stop loading
        this.stopLoading(id);
    }
    
    /**
     * Generate skeleton HTML based on type
     */
    generateSkeletonHTML(type) {
        switch (type) {
            case 'dashboard-stats':
                return `
                    <div class="skeleton-stats-grid">
                        <div class="skeleton-stat-card">
                            <div class="loading-skeleton skeleton-stat-icon"></div>
                            <div class="loading-skeleton skeleton-stat-value"></div>
                            <div class="loading-skeleton skeleton-stat-label"></div>
                        </div>
                        <div class="skeleton-stat-card">
                            <div class="loading-skeleton skeleton-stat-icon"></div>
                            <div class="loading-skeleton skeleton-stat-value"></div>
                            <div class="loading-skeleton skeleton-stat-label"></div>
                        </div>
                        <div class="skeleton-stat-card">
                            <div class="loading-skeleton skeleton-stat-icon"></div>
                            <div class="loading-skeleton skeleton-stat-value"></div>
                            <div class="loading-skeleton skeleton-stat-label"></div>
                        </div>
                        <div class="skeleton-stat-card">
                            <div class="loading-skeleton skeleton-stat-icon"></div>
                            <div class="loading-skeleton skeleton-stat-value"></div>
                            <div class="loading-skeleton skeleton-stat-label"></div>
                        </div>
                    </div>
                `;
                
            case 'activity-feed':
                return `
                    <div class="skeleton-activity-list">
                        ${Array(5).fill().map(() => `
                            <div class="skeleton-activity-item">
                                <div class="loading-skeleton skeleton-activity-icon"></div>
                                <div class="skeleton-activity-content">
                                    <div class="loading-skeleton skeleton-activity-text"></div>
                                    <div class="loading-skeleton skeleton-activity-time"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
            case 'pet-list':
                return `
                    <div class="skeleton-pet-grid">
                        ${Array(6).fill().map(() => `
                            <div class="skeleton-pet-card">
                                <div class="loading-skeleton skeleton-pet-image"></div>
                                <div class="skeleton-pet-info">
                                    <div class="loading-skeleton skeleton-pet-name"></div>
                                    <div class="loading-skeleton skeleton-pet-breed"></div>
                                    <div class="loading-skeleton skeleton-pet-details"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
            case 'health-metrics':
                return `
                    <div class="skeleton-health-grid">
                        <div class="skeleton-health-score">
                            <div class="loading-skeleton skeleton-score-circle"></div>
                            <div class="loading-skeleton skeleton-score-text"></div>
                        </div>
                        <div class="skeleton-health-alerts">
                            ${Array(3).fill().map(() => `
                                <div class="skeleton-alert-item">
                                    <div class="loading-skeleton skeleton-alert-icon"></div>
                                    <div class="loading-skeleton skeleton-alert-text"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
            default:
                return `
                    <div class="skeleton-generic">
                        <div class="loading-skeleton skeleton-text"></div>
                        <div class="loading-skeleton skeleton-text"></div>
                        <div class="loading-skeleton skeleton-text" style="width: 60%;"></div>
                    </div>
                `;
        }
    }
    
    /**
     * Get skeleton type based on loading state
     */
    getSkeletonType(loadingState) {
        if (loadingState.component) {
            return loadingState.component;
        }
        
        if (loadingState.type === 'api' && loadingState.url) {
            if (loadingState.url.includes('dashboard')) return 'dashboard-stats';
            if (loadingState.url.includes('activities')) return 'activity-feed';
            if (loadingState.url.includes('pets')) return 'pet-list';
            if (loadingState.url.includes('health')) return 'health-metrics';
        }
        
        return 'generic';
    }
    
    /**
     * Get loading container
     */
    getLoadingContainer(loadingState) {
        if (loadingState.containerId) {
            return document.getElementById(loadingState.containerId);
        }
        
        if (loadingState.component) {
            return document.querySelector(`.${loadingState.component}-container`) ||
                   document.getElementById(`${loadingState.component}-container`) ||
                   document.querySelector(`[data-component="${loadingState.component}"]`);
        }
        
        // Fallback to body for overlay loading
        if (loadingState.type === 'overlay') {
            return document.body;
        }
        
        return null;
    }
    
    /**
     * Create global loading overlay
     */
    createGlobalLoadingOverlay() {
        if (document.getElementById('global-loading-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'global-loading-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="global-loading-content">
                <div class="global-loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="global-loading-message">Loading...</div>
                <div class="global-loading-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">0%</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    /**
     * Show global loading overlay
     */
    showGlobalLoading(message = 'Loading...', showProgress = false) {
        const overlay = document.getElementById('global-loading-overlay');
        if (!overlay) return;
        
        const messageElement = overlay.querySelector('.global-loading-message');
        const progressElement = overlay.querySelector('.global-loading-progress');
        
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        if (progressElement) {
            progressElement.style.display = showProgress ? 'block' : 'none';
        }
        
        overlay.style.display = 'flex';
        document.body.classList.add('loading-active');
    }
    
    /**
     * Hide global loading overlay
     */
    hideGlobalLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        document.body.classList.remove('loading-active');
    }
    
    /**
     * Update global loading progress
     */
    updateGlobalProgress(progress, message = null) {
        const overlay = document.getElementById('global-loading-overlay');
        if (!overlay) return;
        
        const progressFill = overlay.querySelector('.progress-fill');
        const progressText = overlay.querySelector('.progress-text');
        const messageElement = overlay.querySelector('.global-loading-message');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
        if (message && messageElement) {
            messageElement.textContent = message;
        }
    }
    
    /**
     * Utility methods
     */
    generateLoadingId(identifier) {
        if (typeof identifier === 'string') {
            return identifier.replace(/[^a-zA-Z0-9]/g, '_');
        }
        return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Public API methods
     */
    isLoading(id) {
        return this.loadingStates.has(id);
    }
    
    getLoadingState(id) {
        return this.loadingStates.get(id);
    }
    
    getAllLoadingStates() {
        return Array.from(this.loadingStates.values());
    }
    
    hasActiveLoading() {
        return this.loadingStates.size > 0;
    }
    
    /**
     * Component-specific loading methods
     */
    startDashboardLoading() {
        return this.startLoading('dashboard-stats', {
            component: 'dashboard-statistics',
            message: 'Loading dashboard statistics...',
            showSkeleton: true
        });
    }
    
    startActivityLoading() {
        return this.startLoading('activity-feed', {
            component: 'activity-feed',
            message: 'Loading recent activities...',
            showSkeleton: true
        });
    }
    
    startPetListLoading() {
        return this.startLoading('pet-list', {
            component: 'pet-list',
            message: 'Loading pets...',
            showSkeleton: true
        });
    }
    
    startHealthMetricsLoading() {
        return this.startLoading('health-metrics', {
            component: 'health-metrics',
            message: 'Loading health metrics...',
            showSkeleton: true
        });
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Clear all timeouts
        this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.timeouts.clear();
        
        // Clear loading states
        this.loadingStates.clear();
        this.retryQueues.clear();
        
        // Remove global overlay
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        document.body.classList.remove('loading-active');
    }
}

// Initialize loading manager
let loadingManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadingManager = new LoadingManager();
        window.loadingManager = loadingManager;
    });
} else {
    loadingManager = new LoadingManager();
    window.loadingManager = loadingManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}