/**
 * Activity Feed Component
 * Manages the display and interaction of recent activities in the dashboard
 */
class ActivityFeed {
    constructor(apiClient = null, eventBus = null) {
        this.apiClient = apiClient || this.createDefaultApiClient();
        this.eventBus = eventBus || document;
        this.activities = [];
        this.currentFilter = null;
        this.isLoading = false;
        this.containerId = 'recent-activity';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadActivities();
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
        // Listen for events that should trigger activity refresh
        this.eventBus.addEventListener('petAdded', () => this.loadActivities());
        this.eventBus.addEventListener('petUpdated', () => this.loadActivities());
        this.eventBus.addEventListener('nutritionCalculated', () => this.loadActivities());
        this.eventBus.addEventListener('healthUpdated', () => this.loadActivities());
        this.eventBus.addEventListener('photoUploaded', () => this.loadActivities());
        
        // Listen for activity clicks
        this.eventBus.addEventListener('click', (e) => {
            const activityItem = e.target.closest('.activity-item');
            if (activityItem && activityItem.dataset.activityId) {
                this.handleActivityClick(activityItem.dataset.activityId, e);
            }
        });
        
        // Listen for filter changes
        this.eventBus.addEventListener('activityFilterChanged', (e) => {
            this.filterActivities(e.detail.filter);
        });
    }
    
    /**
     * Load activities from API with caching support
     */
    async loadActivities(limit = 10) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Try to get cached data first if offline
            if (!navigator.onLine && window.cacheManager) {
                const cachedActivities = await window.cacheManager.getCachedActivityFeed();
                if (cachedActivities && Array.isArray(cachedActivities)) {
                    this.activities = cachedActivities;
                    this.renderActivities();
                    this.showCachedDataIndicator();
                    return;
                }
            }
            
            // Create retry-enabled operation
            const operation = async () => {
                const url = `/api/dashboard.php?action=activities&limit=${limit}`;
                const response = await this.apiClient.get(url);
                
                if (!response.success || !Array.isArray(response.activities)) {
                    const error = new Error(response.error || 'Failed to load activities');
                    error.status = response.status || 500;
                    throw error;
                }
                
                return response;
            };
            
            // Execute with retry logic
            const response = await (window.retryManager ? 
                window.retryManager.execute(operation, 'activity-feed', {
                    maxRetries: 3,
                    baseDelay: 1000,
                    onRetry: (error, attempt, delay) => {
                        this.showRetryNotification(error, attempt, delay);
                    },
                    onFailure: (error, retryState) => {
                        console.error('All retry attempts failed for activity feed:', error);
                    }
                }) : 
                operation()
            );
            
            this.activities = response.activities;
            this.renderActivities();
            this.hideErrorState();
            
            // Cache the successful response
            if (window.cacheManager) {
                await window.cacheManager.cacheActivityFeed(response.activities);
            }
            
        } catch (error) {
            console.error('Error loading activities:', error);
            
            // Use error handler if available
            if (window.errorHandler) {
                const result = await window.errorHandler.handleApiError(error, {
                    component: 'activity-feed',
                    action: 'loadActivities',
                    retryFunction: () => this.loadActivities(limit)
                });
                
                if (result && Array.isArray(result)) {
                    this.activities = result;
                    this.renderActivities();
                    return;
                }
            }
            
            this.showErrorState(error.message);
            this.loadFallbackActivities();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Add a new activity to the feed
     */
    addActivity(activity) {
        // Add to the beginning of the array
        this.activities.unshift(this.formatActivity(activity));
        
        // Limit to reasonable number of activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(0, 50);
        }
        
        this.renderActivities();
    }
    
    /**
     * Filter activities by type
     */
    filterActivities(type) {
        this.currentFilter = type;
        this.renderActivities();
    }
    
    /**
     * Format activity data
     */
    formatActivity(activity) {
        // Ensure activity has required properties
        const formatted = {
            id: activity.id || Date.now(),
            type: activity.type || 'unknown',
            description: activity.description || 'Unknown activity',
            timestamp: activity.timestamp || new Date().toISOString(),
            time_ago: activity.time_ago || this.getTimeAgo(activity.timestamp),
            pet_id: activity.pet_id || null,
            pet_name: activity.pet_name || null,
            icon: activity.icon || this.getIconForType(activity.type),
            color: activity.color || this.getColorForType(activity.type),
            metadata: activity.metadata || {}
        };
        
        return formatted;
    }
    
    /**
     * Get icon for activity type
     */
    getIconForType(type) {
        const icons = {
            'pet_added': 'fas fa-plus',
            'pet_updated': 'fas fa-edit',
            'pet_deleted': 'fas fa-trash',
            'weight_logged': 'fas fa-weight',
            'health_updated': 'fas fa-heartbeat',
            'nutrition_calculated': 'fas fa-calculator',
            'meal_planned': 'fas fa-calendar-alt',
            'photo_uploaded': 'fas fa-camera',
            'checkup_scheduled': 'fas fa-calendar-check',
            'medication_added': 'fas fa-pills',
            'allergy_added': 'fas fa-exclamation-triangle',
            'profile_updated': 'fas fa-user-edit',
            'report_generated': 'fas fa-chart-bar'
        };
        
        return icons[type] || 'fas fa-info-circle';
    }
    
    /**
     * Get color for activity type
     */
    getColorForType(type) {
        const colors = {
            'pet_added': 'success',
            'pet_updated': 'info',
            'pet_deleted': 'danger',
            'weight_logged': 'primary',
            'health_updated': 'warning',
            'nutrition_calculated': 'info',
            'meal_planned': 'success',
            'photo_uploaded': 'info',
            'checkup_scheduled': 'warning',
            'medication_added': 'danger',
            'allergy_added': 'warning',
            'profile_updated': 'info',
            'report_generated': 'primary'
        };
        
        return colors[type] || 'secondary';
    }
    
    /**
     * Render activities in the container
     */
    renderActivities() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Activity feed container not found');
            return;
        }
        
        let activitiesToRender = this.activities;
        
        // Apply filter if set
        if (this.currentFilter) {
            activitiesToRender = this.activities.filter(activity => 
                activity.type === this.currentFilter
            );
        }
        
        if (activitiesToRender.length === 0) {
            this.renderEmptyState(container);
            return;
        }
        
        const html = activitiesToRender.map(activity => 
            this.renderActivityItem(activity)
        ).join('');
        
        container.innerHTML = html;
    }
    
    /**
     * Render a single activity item
     */
    renderActivityItem(activity) {
        const clickable = this.isActivityClickable(activity);
        const clickHandler = clickable ? `data-activity-id="${activity.id}" style="cursor: pointer;"` : '';
        
        // Check if this is a photo-related activity
        const isPhotoActivity = activity.type.includes('photo');
        const photoThumbnail = this.getPhotoThumbnail(activity);
        
        return `
            <div class="activity-item ${activity.color} ${isPhotoActivity ? 'photo-activity' : ''}" ${clickHandler}>
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${this.escapeHtml(activity.description)}</div>
                    <div class="activity-time">${this.escapeHtml(activity.time_ago)}</div>
                    ${activity.pet_name ? `<div class="activity-pet">${this.escapeHtml(activity.pet_name)}</div>` : ''}
                    ${photoThumbnail ? `<div class="activity-photo">${photoThumbnail}</div>` : ''}
                </div>
                ${clickable ? '<div class="activity-arrow"><i class="fas fa-chevron-right"></i></div>' : ''}
            </div>
        `;
    }
    
    /**
     * Get photo thumbnail for photo activities
     */
    getPhotoThumbnail(activity) {
        if (!activity.type.includes('photo') || !activity.metadata) {
            return null;
        }
        
        let metadata;
        try {
            metadata = typeof activity.metadata === 'string' ? 
                JSON.parse(activity.metadata) : activity.metadata;
        } catch (e) {
            return null;
        }
        
        if (!metadata.filename) {
            return null;
        }
        
        // Generate thumbnail URL
        const thumbnailUrl = `/uploads/pets/thumbnails/${metadata.filename}`;
        const fullUrl = `/uploads/pets/${metadata.filename}`;
        
        return `
            <div class="photo-thumbnail" onclick="event.stopPropagation(); activityFeed.showPhotoModal('${fullUrl}', '${activity.pet_name || 'Pet'}')">
                <img src="${thumbnailUrl}" alt="Pet photo" onerror="this.src='${fullUrl}'" loading="lazy">
                <div class="photo-overlay">
                    <i class="fas fa-expand"></i>
                </div>
            </div>
        `;
    }
    
    /**
     * Check if activity is clickable
     */
    isActivityClickable(activity) {
        const clickableTypes = [
            'pet_added', 'pet_updated', 'nutrition_calculated', 
            'meal_planned', 'health_updated', 'photo_uploaded',
            'photo_primary_changed', 'checkup_scheduled', 'health_condition_added'
        ];
        
        return clickableTypes.includes(activity.type) && activity.pet_id;
    }
    
    /**
     * Render empty state
     */
    renderEmptyState(container) {
        const filterText = this.currentFilter ? ` for ${this.currentFilter.replace('_', ' ')}` : '';
        
        container.innerHTML = `
            <div class="activity-empty-state">
                <div class="empty-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="empty-title">No Recent Activity${filterText}</div>
                <div class="empty-description">
                    ${this.currentFilter ? 
                        'Try a different filter or perform some actions to see activity here.' :
                        'Start by adding a pet or logging some health information to see activity here.'
                    }
                </div>
                ${!this.currentFilter ? `
                    <div class="empty-actions">
                        <button class="btn btn-primary btn-sm" onclick="app.showAddPet()">
                            <i class="fas fa-plus"></i> Add Your First Pet
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Handle activity item click
     */
    handleActivityClick(activityId, event) {
        const activity = this.activities.find(a => a.id == activityId);
        if (!activity) return;
        
        event.preventDefault();
        
        // Navigate based on activity type
        switch (activity.type) {
            case 'pet_added':
            case 'pet_updated':
                if (activity.pet_id) {
                    this.navigateToPetProfile(activity.pet_id);
                }
                break;
                
            case 'nutrition_calculated':
            case 'meal_planned':
                app.switchToTab('nutrition');
                break;
                
            case 'health_updated':
                app.switchToTab('health');
                break;
                
            case 'photo_uploaded':
            case 'photo_primary_changed':
                if (activity.pet_id) {
                    this.navigateToPetProfile(activity.pet_id);
                }
                break;
                
            case 'checkup_scheduled':
                // Could open checkup details or calendar
                this.showActivityDetails(activity);
                break;
                
            case 'health_condition_added':
                if (activity.pet_id) {
                    this.navigateToPetProfile(activity.pet_id);
                }
                break;
                
            default:
                // Show activity details in a modal or tooltip
                this.showActivityDetails(activity);
                break;
        }
    }
    
    /**
     * Navigate to pet profile
     */
    navigateToPetProfile(petId) {
        // This would typically open a pet profile modal or navigate to pet details
        if (typeof openPetDashboard === 'function') {
            openPetDashboard(petId);
        } else {
            app.switchToTab('pets');
        }
    }
    
    /**
     * Show activity details
     */
    showActivityDetails(activity) {
        // Create a simple tooltip or modal with activity details
        const details = {
            type: activity.type.replace('_', ' ').toUpperCase(),
            description: activity.description,
            timestamp: new Date(activity.timestamp).toLocaleString(),
            pet: activity.pet_name || 'N/A'
        };
        
        const message = `
            Type: ${details.type}
            Description: ${details.description}
            Pet: ${details.pet}
            Time: ${details.timestamp}
        `;
        
        alert(message); // Simple implementation - could be enhanced with a proper modal
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="activity-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading recent activity...</div>
                </div>
            `;
        }
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Loading state is replaced by actual content in renderActivities
    }
    
    /**
     * Show retry notification
     */
    showRetryNotification(error, attempt, delay) {
        if (window.retryManager) {
            window.retryManager.showRetryNotification(error, attempt, delay, {
                onCancel: () => {
                    window.retryManager.cancel('activity-feed');
                }
            });
        }
    }
    
    /**
     * Show error state
     */
    showErrorState(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="activity-error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-title">Failed to Load Activities</div>
                    <div class="error-description">${this.escapeHtml(message)}</div>
                    <button class="btn btn-outline btn-sm" onclick="activityFeed.loadActivities()">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Hide error state
     */
    hideErrorState() {
        // Error state is replaced by actual content in renderActivities
    }
    
    /**
     * Load fallback activities
     */
    loadFallbackActivities() {
        // Only show fallback if we have no activities
        if (this.activities.length === 0) {
            this.activities = [
                {
                    id: 'fallback-1',
                    type: 'info',
                    description: 'Welcome to your pet dashboard!',
                    timestamp: new Date().toISOString(),
                    time_ago: 'just now',
                    icon: 'fas fa-info-circle',
                    color: 'info'
                }
            ];
            this.renderActivities();
        }
    }
    
    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const time = Date.now() - new Date(timestamp).getTime();
        const seconds = Math.floor(time / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
        return `${Math.floor(seconds / 31536000)} years ago`;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get current activities
     */
    getActivities() {
        return [...this.activities];
    }
    
    /**
     * Show photo modal
     */
    showPhotoModal(photoUrl, petName) {
        const modal = document.createElement('div');
        modal.className = 'photo-modal-overlay';
        modal.innerHTML = `
            <div class="photo-modal-content">
                <div class="photo-modal-header">
                    <h4><i class="fas fa-camera"></i> ${this.escapeHtml(petName)} Photo</h4>
                    <button class="photo-modal-close" onclick="this.closest('.photo-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-modal-body">
                    <img src="${photoUrl}" alt="${this.escapeHtml(petName)} photo" class="photo-modal-image">
                </div>
                <div class="photo-modal-actions">
                    <button class="btn btn-outline" onclick="window.open('${photoUrl}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Open Full Size
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.photo-modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
    }
    
    /**
     * Show cached data indicator
     */
    showCachedDataIndicator() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        let indicator = container.querySelector('.cached-data-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'cached-data-indicator';
            indicator.innerHTML = `
                <i class="fas fa-database"></i>
                <span>Showing cached activities - you're offline</span>
            `;
            container.insertBefore(indicator, container.firstChild);
        }
    }
    
    /**
     * Refresh activities
     */
    refresh() {
        return this.loadActivities();
    }
    
    /**
     * Destroy component
     */
    destroy() {
        // Remove event listeners if needed
        this.activities = [];
    }
}

// Initialize activity feed when DOM is ready
let activityFeed = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.dashboard-container')) {
            activityFeed = new ActivityFeed();
            window.activityFeed = activityFeed;
        }
    });
} else {
    if (document.querySelector('.dashboard-container')) {
        activityFeed = new ActivityFeed();
        window.activityFeed = activityFeed;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityFeed;
}