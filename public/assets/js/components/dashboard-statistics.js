/**
 * Dashboard Statistics Component
 * Manages dynamic loading and updating of dashboard statistics
 */
class DashboardStatistics {
    constructor(apiClient = null) {
        this.apiClient = apiClient || this.createDefaultApiClient();
        this.statistics = {};
        this.refreshInterval = null;
        this.refreshRate = 30000; // 30 seconds
        this.isLoading = false;
        this.subscribers = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadStatistics();
        this.startAutoRefresh();
    }
    
    /**
     * Create default API client
     */
    createDefaultApiClient() {
        return {
            get: async (url) => {
                const response = await fetch(url, {
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response.json();
            }
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for visibility changes to pause/resume refresh
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                this.loadStatistics(); // Refresh when page becomes visible
            }
        });
        
        // Listen for custom events that should trigger refresh
        document.addEventListener('petAdded', () => this.loadStatistics());
        document.addEventListener('petUpdated', () => this.loadStatistics());
        document.addEventListener('nutritionCalculated', () => this.loadStatistics());
        document.addEventListener('nutritionUpdated', () => this.loadStatistics());
        document.addEventListener('mealPlanCreated', () => this.loadStatistics());
        document.addEventListener('mealPlanUpdated', () => this.loadStatistics());
        document.addEventListener('mealScheduleUpdated', () => this.loadStatistics());
        document.addEventListener('mealLogged', () => this.loadStatistics());
        document.addEventListener('healthUpdated', () => this.loadStatistics());
        document.addEventListener('activityLogged', () => this.loadStatistics());
    }
    
    /**
     * Load statistics from API with caching support
     */
    async loadStatistics() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Try to get cached data first if offline
            if (!navigator.onLine && window.cacheManager) {
                const cachedStats = await window.cacheManager.getCachedDashboardStats();
                if (cachedStats) {
                    this.updateStatistics(cachedStats);
                    this.showCachedDataIndicator();
                    return;
                }
            }
            
            // Create retry-enabled operation
            const operation = async () => {
                const response = await this.apiClient.get('/api/dashboard.php?action=stats');
                
                if (!response.success) {
                    const error = new Error(response.error || 'Failed to load statistics');
                    error.status = response.status || 500;
                    throw error;
                }
                
                return response;
            };
            
            // Execute with retry logic
            const response = await (window.retryManager ? 
                window.retryManager.execute(operation, 'dashboard-statistics', {
                    maxRetries: 3,
                    baseDelay: 1000,
                    onRetry: (error, attempt, delay) => {
                        this.showRetryNotification(error, attempt, delay);
                    },
                    onFailure: (error, retryState) => {
                        console.error('All retry attempts failed for dashboard statistics:', error);
                    }
                }) : 
                operation()
            );
            
            this.updateStatistics(response.stats);
            this.hideErrorState();
            
            // Cache the successful response
            if (window.cacheManager) {
                await window.cacheManager.cacheDashboardStats(response.stats);
            }
            
        } catch (error) {
            console.error('Error loading dashboard statistics:', error);
            
            // Use error handler if available
            if (window.errorHandler) {
                const result = await window.errorHandler.handleApiError(error, {
                    component: 'dashboard-statistics',
                    action: 'loadStatistics',
                    retryFunction: () => this.loadStatistics()
                });
                
                if (result) {
                    this.updateStatistics(result);
                    return;
                }
            }
            
            this.showErrorState(error.message);
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Update statistics with new data
     */
    updateStatistics(newStats) {
        const oldStats = { ...this.statistics };
        this.statistics = { ...newStats };
        
        // Update each statistic with animation
        Object.keys(newStats).forEach(key => {
            this.updateStatistic(key, newStats[key], oldStats[key]);
        });
        
        // Notify subscribers
        this.notifySubscribers(this.statistics);
        
        // Update last updated timestamp
        this.updateLastUpdated();
    }
    
    /**
     * Update a single statistic with animation
     */
    updateStatistic(key, newValue, oldValue) {
        const element = document.getElementById(key);
        if (!element) return;
        
        // Handle different types of values
        if (typeof newValue === 'number' && typeof oldValue === 'number' && oldValue !== newValue) {
            this.animateNumberChange(element, oldValue, newValue);
        } else if (key === 'health_score') {
            // Special handling for health score percentage
            const displayValue = typeof newValue === 'number' ? `${newValue}%` : newValue;
            this.animateTextChange(element, displayValue);
        } else {
            // Simple text update
            this.animateTextChange(element, newValue);
        }
        
        // Update change indicators
        this.updateChangeIndicator(key, newValue, oldValue);
    }
    
    /**
     * Animate number changes
     */
    animateNumberChange(element, fromValue, toValue) {
        const duration = 1000; // 1 second
        const startTime = performance.now();
        const difference = toValue - fromValue;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(fromValue + (difference * easeOut));
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Animate text changes
     */
    animateTextChange(element, newText) {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0.5';
        
        setTimeout(() => {
            element.textContent = newText;
            element.style.opacity = '1';
        }, 150);
    }
    
    /**
     * Update change indicators
     */
    updateChangeIndicator(key, newValue, oldValue) {
        const changeElement = document.getElementById(`${key}-change`);
        if (!changeElement) return;
        
        // Special handling for specific statistics
        switch (key) {
            case 'total_pets':
                if (typeof newValue === 'number' && typeof oldValue === 'number') {
                    const change = newValue - oldValue;
                    if (change > 0) {
                        changeElement.innerHTML = `<i class="fas fa-arrow-up"></i> +${change} this month`;
                        changeElement.className = 'stat-change positive';
                    }
                }
                break;
                
            case 'health_score':
                const healthChangeElement = document.getElementById('health-change');
                if (healthChangeElement && this.statistics.health_change !== undefined) {
                    const change = this.statistics.health_change;
                    if (change > 0) {
                        healthChangeElement.innerHTML = `<i class="fas fa-arrow-up"></i> +${change}% this week`;
                        healthChangeElement.className = 'stat-change positive';
                    } else if (change < 0) {
                        healthChangeElement.innerHTML = `<i class="fas fa-arrow-down"></i> ${change}% this week`;
                        healthChangeElement.className = 'stat-change negative';
                    } else {
                        healthChangeElement.innerHTML = `<i class="fas fa-minus"></i> No change`;
                        healthChangeElement.className = 'stat-change neutral';
                    }
                }
                break;
                
            case 'meals_today':
                const mealsChangeElement = document.getElementById('meals-change');
                if (mealsChangeElement && this.statistics.upcoming_meals !== undefined) {
                    const upcoming = this.statistics.upcoming_meals;
                    mealsChangeElement.innerHTML = `<i class="fas fa-clock"></i> ${upcoming} upcoming`;
                    mealsChangeElement.className = 'stat-change neutral';
                }
                break;
                
            case 'next_checkup':
                const checkupChangeElement = document.getElementById('checkup-change');
                if (checkupChangeElement) {
                    if (newValue <= 0) {
                        checkupChangeElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Overdue`;
                        checkupChangeElement.className = 'stat-change negative';
                    } else if (newValue <= 30) {
                        checkupChangeElement.innerHTML = `<i class="fas fa-calendar"></i> Due soon`;
                        checkupChangeElement.className = 'stat-change warning';
                    } else {
                        checkupChangeElement.innerHTML = `<i class="fas fa-calendar"></i> Schedule now`;
                        checkupChangeElement.className = 'stat-change neutral';
                    }
                }
                break;
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        const loadingElements = document.querySelectorAll('.stat-value');
        loadingElements.forEach(element => {
            element.classList.add('loading');
        });
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.stat-value');
        loadingElements.forEach(element => {
            element.classList.remove('loading');
        });
    }
    
    /**
     * Show retry notification
     */
    showRetryNotification(error, attempt, delay) {
        if (window.retryManager) {
            window.retryManager.showRetryNotification(error, attempt, delay, {
                onCancel: () => {
                    window.retryManager.cancel('dashboard-statistics');
                }
            });
        }
    }
    
    /**
     * Show error state
     */
    showErrorState(message) {
        const errorContainer = document.getElementById('dashboard-error');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Failed to load statistics: ${message}</span>
                    <button class="retry-btn" onclick="dashboardStats.loadStatistics()">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }
    
    /**
     * Hide error state
     */
    hideErrorState() {
        const errorContainer = document.getElementById('dashboard-error');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }
    
    /**
     * Show cached data indicator
     */
    showCachedDataIndicator() {
        const container = document.querySelector('.dashboard-stats');
        if (!container) return;
        
        let indicator = container.querySelector('.cached-data-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'cached-data-indicator';
            indicator.innerHTML = `
                <i class="fas fa-database"></i>
                <span>Showing cached data - you're offline</span>
            `;
            container.insertBefore(indicator, container.firstChild);
        }
    }
    
    /**
     * Load fallback data when API fails
     */
    loadFallbackData() {
        const fallbackStats = this.getFallbackStats();
        
        // Only update if we don't have any data
        if (Object.keys(this.statistics).length === 0) {
            this.updateStatistics(fallbackStats);
        }
        
        // Show offline indicator
        this.showOfflineIndicator();
    }
    
    /**
     * Get fallback statistics
     */
    getFallbackStats() {
        return {
            total_pets: 0,
            pets_this_month: 0,
            meals_today: 0,
            upcoming_meals: 0,
            health_score: 100,
            health_change: 0,
            next_checkup: 0
        };
    }
    
    /**
     * Show offline indicator
     */
    showOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <i class="fas fa-wifi"></i>
            <span>Using cached data - connection unavailable</span>
        `;
        
        const header = document.querySelector('.dashboard-header');
        if (header && !document.getElementById('offline-indicator')) {
            header.appendChild(indicator);
        }
    }
    
    /**
     * Hide offline indicator
     */
    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.loadStatistics();
        }, this.refreshRate);
    }
    
    /**
     * Stop auto refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    /**
     * Subscribe to statistics updates
     */
    subscribeToUpdates(callback) {
        this.subscribers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }
    
    /**
     * Notify subscribers of updates
     */
    notifySubscribers(stats) {
        this.subscribers.forEach(callback => {
            try {
                callback(stats);
            } catch (error) {
                console.error('Error in statistics subscriber:', error);
            }
        });
    }
    
    /**
     * Update last updated timestamp
     */
    updateLastUpdated() {
        const timestampElement = document.getElementById('last-updated');
        if (timestampElement) {
            const now = new Date();
            timestampElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }
    
    /**
     * Get current statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    
    /**
     * Force refresh
     */
    refresh() {
        return this.loadStatistics();
    }
    
    /**
     * Destroy component
     */
    destroy() {
        this.stopAutoRefresh();
        this.subscribers = [];
        this.hideOfflineIndicator();
    }
}

// Initialize dashboard statistics when DOM is ready
let dashboardStats = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.dashboard-container')) {
            dashboardStats = new DashboardStatistics();
            window.dashboardStats = dashboardStats;
        }
    });
} else {
    if (document.querySelector('.dashboard-container')) {
        dashboardStats = new DashboardStatistics();
        window.dashboardStats = dashboardStats;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardStatistics;
}