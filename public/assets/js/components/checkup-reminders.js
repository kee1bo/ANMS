/**
 * Checkup Reminders Component
 * Manages veterinary checkup reminders and scheduling
 */
class CheckupReminders {
    constructor(apiClient = null) {
        this.apiClient = apiClient || this.createDefaultApiClient();
        this.reminders = {};
        this.refreshInterval = null;
        this.refreshRate = 300000; // 5 minutes
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadReminders();
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
            },
            post: async (url, data) => {
                const response = await fetch(url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
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
        // Listen for checkup-related events
        document.addEventListener('checkupCompleted', () => this.loadReminders());
        document.addEventListener('checkupScheduled', () => this.loadReminders());
        document.addEventListener('petAdded', () => this.loadReminders());
        document.addEventListener('petUpdated', () => this.loadReminders());
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                this.loadReminders();
            }
        });
    }
    
    /**
     * Load checkup reminders from API
     */
    async loadReminders() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            const response = await this.apiClient.get('/api/checkup-reminders.php?action=reminders');
            
            if (response.success) {
                this.reminders = response.reminders;
                this.renderReminders();
                this.hideErrorState();
            } else {
                throw new Error(response.error || 'Failed to load reminders');
            }
            
        } catch (error) {
            console.error('Error loading checkup reminders:', error);
            this.showErrorState(error.message);
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Get checkup status for a specific pet
     */
    async getPetCheckupStatus(petId) {
        try {
            const response = await this.apiClient.get(`/api/checkup-reminders.php?action=pet_status&pet_id=${petId}`);
            
            if (response.success) {
                return response.pet_status;
            } else {
                throw new Error(response.error || 'Failed to get pet status');
            }
            
        } catch (error) {
            console.error('Error getting pet checkup status:', error);
            return null;
        }
    }
    
    /**
     * Render checkup reminders
     */
    renderReminders() {
        this.renderOverdueCheckups();
        this.renderUpcomingCheckups();
        this.renderSchedulingSuggestions();
        this.updateReminderCounts();
    }
    
    /**
     * Render overdue checkups
     */
    renderOverdueCheckups() {
        const container = document.getElementById('overdue-checkups');
        if (!container) return;
        
        const overdueCheckups = this.reminders.overdue_checkups || [];
        
        if (overdueCheckups.length === 0) {
            container.innerHTML = `
                <div class="no-reminders">
                    <i class="fas fa-check-circle"></i>
                    <p>No overdue checkups - great job!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="checkup-reminders-list">
                ${overdueCheckups.map(checkup => this.renderCheckupCard(checkup, 'overdue')).join('')}
            </div>
        `;
    }
    
    /**
     * Render upcoming checkups
     */
    renderUpcomingCheckups() {
        const container = document.getElementById('upcoming-checkups');
        if (!container) return;
        
        const upcomingCheckups = this.reminders.upcoming_checkups || [];
        
        if (upcomingCheckups.length === 0) {
            container.innerHTML = `
                <div class="no-reminders">
                    <i class="fas fa-calendar-check"></i>
                    <p>No upcoming checkups scheduled</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="checkup-reminders-list">
                ${upcomingCheckups.map(checkup => this.renderCheckupCard(checkup, 'upcoming')).join('')}
            </div>
        `;
    }
    
    /**
     * Render scheduling suggestions
     */
    renderSchedulingSuggestions() {
        const container = document.getElementById('scheduling-suggestions');
        if (!container) return;
        
        const suggestions = this.reminders.scheduling_suggestions || [];
        
        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="no-suggestions">
                    <i class="fas fa-lightbulb"></i>
                    <p>No scheduling suggestions at this time</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="suggestions-list">
                ${suggestions.map(suggestion => this.renderSuggestionCard(suggestion)).join('')}
            </div>
        `;
    }
    
    /**
     * Render a checkup card
     */
    renderCheckupCard(checkup, type) {
        const priorityClass = `priority-${checkup.priority}`;
        const statusClass = `status-${type}`;
        
        return `
            <div class="checkup-card ${statusClass} ${priorityClass}" data-pet-id="${checkup.pet_id}">
                <div class="checkup-header">
                    <div class="pet-info">
                        <h4>${checkup.pet_name}</h4>
                        <span class="pet-species">${checkup.species}</span>
                        <span class="pet-age">${checkup.age} years old</span>
                    </div>
                    <div class="checkup-status">
                        <span class="status-badge ${statusClass}">
                            ${type === 'overdue' ? 'Overdue' : 'Due Soon'}
                        </span>
                        <span class="priority-badge ${priorityClass}">
                            ${checkup.priority.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div class="checkup-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>
                            ${type === 'overdue' 
                                ? `${Math.abs(checkup.days_until_due)} days overdue`
                                : `Due in ${checkup.days_until_due} days`
                            }
                        </span>
                    </div>
                    
                    ${checkup.last_checkup_date ? `
                        <div class="detail-item">
                            <i class="fas fa-history"></i>
                            <span>Last checkup: ${this.formatDate(checkup.last_checkup_date)}</span>
                        </div>
                    ` : `
                        <div class="detail-item">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>No previous checkup recorded</span>
                        </div>
                    `}
                    
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>Recommended frequency: ${this.getFrequencyText(checkup.recommended_frequency)}</span>
                    </div>
                </div>
                
                <div class="checkup-actions">
                    <button class="btn btn-primary" onclick="checkupReminders.scheduleCheckup(${checkup.pet_id})">
                        <i class="fas fa-calendar-plus"></i> Schedule
                    </button>
                    <button class="btn btn-outline" onclick="checkupReminders.markCompleted(${checkup.pet_id})">
                        <i class="fas fa-check"></i> Mark Done
                    </button>
                    <button class="btn btn-ghost" onclick="checkupReminders.createReminder(${checkup.pet_id})">
                        <i class="fas fa-bell"></i> Remind Later
                    </button>
                </div>
                
                ${checkup.recommendations.length > 0 ? `
                    <div class="checkup-recommendations">
                        <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
                        ${checkup.recommendations.map(rec => `
                            <div class="recommendation-item">
                                <strong>${rec.title}</strong>
                                <p>${rec.description}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render a suggestion card
     */
    renderSuggestionCard(suggestion) {
        const priorityClass = `priority-${suggestion.priority}`;
        
        return `
            <div class="suggestion-card ${priorityClass}">
                <div class="suggestion-header">
                    <div class="suggestion-icon">
                        <i class="fas ${this.getSuggestionIcon(suggestion.type)}"></i>
                    </div>
                    <div class="suggestion-content">
                        <h4>${suggestion.title}</h4>
                        <p>${suggestion.description}</p>
                    </div>
                </div>
                
                <div class="suggestion-actions">
                    <button class="btn btn-primary" onclick="checkupReminders.handleSuggestion('${suggestion.action}', '${suggestion.type}')">
                        <i class="fas fa-arrow-right"></i> Take Action
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Schedule a checkup
     */
    async scheduleCheckup(petId) {
        const modal = this.createScheduleModal(petId);
        document.body.appendChild(modal);
    }
    
    /**
     * Mark checkup as completed
     */
    async markCompleted(petId) {
        const modal = this.createCompletedModal(petId);
        document.body.appendChild(modal);
    }
    
    /**
     * Create a reminder
     */
    async createReminder(petId, reminderType = 'checkup_due') {
        try {
            const response = await this.apiClient.post('/api/checkup-reminders.php?action=create_reminder', {
                pet_id: petId,
                reminder_type: reminderType
            });
            
            if (response.success) {
                this.showMessage('Reminder created successfully!', 'success');
                this.loadReminders();
                
                // Trigger dashboard update
                this.triggerDashboardUpdate();
            } else {
                throw new Error(response.error || 'Failed to create reminder');
            }
            
        } catch (error) {
            console.error('Error creating reminder:', error);
            this.showMessage('Failed to create reminder: ' + error.message, 'error');
        }
    }
    
    /**
     * Handle suggestion actions
     */
    handleSuggestion(action, type) {
        switch (action) {
            case 'schedule_multiple_checkups':
                this.showMultipleSchedulingModal();
                break;
            case 'schedule_preventive_checkups':
                this.showPreventiveSchedulingModal();
                break;
            case 'schedule_seasonal_checkup':
                this.showSeasonalSchedulingModal();
                break;
            default:
                console.warn('Unknown suggestion action:', action);
        }
    }
    
    /**
     * Create schedule modal
     */
    createScheduleModal(petId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h4><i class="fas fa-calendar-plus"></i> Schedule Checkup</h4>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="schedule-checkup-form">
                        <input type="hidden" name="pet_id" value="${petId}">
                        
                        <div class="form-group">
                            <label class="form-label required">Scheduled Date</label>
                            <input type="datetime-local" name="scheduled_date" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Veterinary Clinic</label>
                            <input type="text" name="vet_clinic" class="form-input" 
                                   placeholder="Enter clinic name or address">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" rows="3" 
                                      placeholder="Any special notes or concerns for the checkup..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-calendar-plus"></i> Schedule Checkup
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add form handler
        const form = modal.querySelector('#schedule-checkup-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleScheduleSubmit(e);
        });
        
        return modal;
    }
    
    /**
     * Create completed modal
     */
    createCompletedModal(petId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h4><i class="fas fa-check-circle"></i> Mark Checkup Completed</h4>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="completed-checkup-form">
                        <input type="hidden" name="pet_id" value="${petId}">
                        
                        <div class="form-group">
                            <label class="form-label">Checkup Date</label>
                            <input type="datetime-local" name="checkup_date" class="form-input" 
                                   value="${new Date().toISOString().slice(0, 16)}">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" rows="4" 
                                      placeholder="Any findings, recommendations, or notes from the checkup..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check"></i> Mark Completed
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add form handler
        const form = modal.querySelector('#completed-checkup-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCompletedSubmit(e);
        });
        
        return modal;
    }
    
    /**
     * Handle schedule form submission
     */
    async handleScheduleSubmit(event) {
        const formData = new FormData(event.target);
        const scheduleData = {
            pet_id: formData.get('pet_id'),
            scheduled_date: formData.get('scheduled_date'),
            vet_clinic: formData.get('vet_clinic'),
            notes: formData.get('notes')
        };
        
        try {
            const response = await this.apiClient.post('/api/checkup-reminders.php?action=schedule_checkup', scheduleData);
            
            if (response.success) {
                event.target.closest('.modal-overlay').remove();
                this.showMessage('Checkup scheduled successfully!', 'success');
                this.loadReminders();
                this.triggerDashboardUpdate();
            } else {
                throw new Error(response.error || 'Failed to schedule checkup');
            }
            
        } catch (error) {
            console.error('Error scheduling checkup:', error);
            this.showMessage('Failed to schedule checkup: ' + error.message, 'error');
        }
    }
    
    /**
     * Handle completed form submission
     */
    async handleCompletedSubmit(event) {
        const formData = new FormData(event.target);
        const completedData = {
            pet_id: formData.get('pet_id'),
            checkup_date: formData.get('checkup_date'),
            notes: formData.get('notes')
        };
        
        try {
            const response = await this.apiClient.post('/api/checkup-reminders.php?action=mark_completed', completedData);
            
            if (response.success) {
                event.target.closest('.modal-overlay').remove();
                this.showMessage('Checkup marked as completed!', 'success');
                this.loadReminders();
                this.triggerDashboardUpdate();
            } else {
                throw new Error(response.error || 'Failed to mark checkup completed');
            }
            
        } catch (error) {
            console.error('Error marking checkup completed:', error);
            this.showMessage('Failed to mark checkup completed: ' + error.message, 'error');
        }
    }
    
    /**
     * Helper methods
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    getFrequencyText(days) {
        if (days <= 120) return 'Every 4 months';
        if (days <= 180) return 'Every 6 months';
        return 'Annually';
    }
    
    getSuggestionIcon(type) {
        const icons = {
            'batch_scheduling': 'fa-calendar-alt',
            'preventive_scheduling': 'fa-shield-alt',
            'seasonal_checkup': 'fa-leaf'
        };
        return icons[type] || 'fa-lightbulb';
    }
    
    updateReminderCounts() {
        const overdueCount = (this.reminders.overdue_checkups || []).length;
        const upcomingCount = (this.reminders.upcoming_checkups || []).length;
        
        // Update badge counts if elements exist
        const overdueBadge = document.getElementById('overdue-count');
        if (overdueBadge) {
            overdueBadge.textContent = overdueCount;
            overdueBadge.style.display = overdueCount > 0 ? 'inline' : 'none';
        }
        
        const upcomingBadge = document.getElementById('upcoming-count');
        if (upcomingBadge) {
            upcomingBadge.textContent = upcomingCount;
            upcomingBadge.style.display = upcomingCount > 0 ? 'inline' : 'none';
        }
    }
    
    showLoadingState() {
        const containers = ['overdue-checkups', 'upcoming-checkups', 'scheduling-suggestions'];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="reminders-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading checkup reminders...</p>
                    </div>
                `;
            }
        });
    }
    
    hideLoadingState() {
        // Loading state is replaced by actual content
    }
    
    showErrorState(message) {
        const containers = ['overdue-checkups', 'upcoming-checkups', 'scheduling-suggestions'];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="reminders-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load reminders</p>
                        <button class="btn btn-sm" onclick="checkupReminders.loadReminders()">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </div>
                `;
            }
        });
    }
    
    hideErrorState() {
        // Error state is replaced by actual content
    }
    
    loadFallbackData() {
        // Load cached data if available
        try {
            const cached = localStorage.getItem('checkup_reminders_cache');
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour
                    this.reminders = data.reminders;
                    this.renderReminders();
                }
            }
        } catch (error) {
            console.warn('Failed to load cached reminders:', error);
        }
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) return;
        
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadReminders();
            }
        }, this.refreshRate);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    triggerDashboardUpdate() {
        try {
            // Trigger dashboard statistics update
            if (window.dashboardStats && typeof window.dashboardStats.refresh === 'function') {
                window.dashboardStats.refresh();
            }
            
            // Trigger activity feed update
            if (window.activityFeed && typeof window.activityFeed.refresh === 'function') {
                window.activityFeed.refresh();
            }
            
            // Trigger health metrics update
            if (window.healthMetrics && typeof window.healthMetrics.refresh === 'function') {
                window.healthMetrics.refresh();
            }
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('checkupUpdated', {
                detail: { timestamp: new Date().toISOString() }
            }));
            
        } catch (error) {
            console.warn('Failed to trigger dashboard update:', error);
        }
    }
    
    showMessage(message, type = 'info') {
        // Simple message display - in a real app you might use a toast library
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    refresh() {
        return this.loadReminders();
    }
    
    destroy() {
        this.stopAutoRefresh();
        this.reminders = {};
    }
}

// Initialize checkup reminders when DOM is ready
let checkupReminders = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.checkup-reminders-container')) {
            checkupReminders = new CheckupReminders();
            window.checkupReminders = checkupReminders;
        }
    });
} else {
    if (document.querySelector('.checkup-reminders-container')) {
        checkupReminders = new CheckupReminders();
        window.checkupReminders = checkupReminders;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckupReminders;
}