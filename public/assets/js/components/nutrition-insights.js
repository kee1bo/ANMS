/**
 * Nutrition Insights Component
 * Displays intelligent nutrition insights and recommendations on the dashboard
 */
class NutritionInsights {
    constructor(apiClient = null) {
        this.apiClient = apiClient || this.createDefaultApiClient();
        this.insights = {};
        this.refreshInterval = null;
        this.refreshRate = 300000; // 5 minutes
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInsights();
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
        // Listen for nutrition-related events
        document.addEventListener('nutritionUpdated', () => this.loadInsights());
        document.addEventListener('mealPlanUpdated', () => this.loadInsights());
        document.addEventListener('mealLogged', () => this.loadInsights());
        document.addEventListener('petAdded', () => this.loadInsights());
        document.addEventListener('petUpdated', () => this.loadInsights());
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                this.loadInsights();
            }
        });
    }
    
    /**
     * Load nutrition insights from API
     */
    async loadInsights() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            const response = await this.apiClient.get('/api/dashboard.php?action=nutrition_insights');
            
            if (response.success) {
                this.insights = response.insights;
                this.renderInsights();
                this.hideErrorState();
            } else {
                throw new Error(response.error || 'Failed to load nutrition insights');
            }
            
        } catch (error) {
            console.error('Error loading nutrition insights:', error);
            this.showErrorState(error.message);
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Render nutrition insights
     */
    renderInsights() {
        this.renderMealReminders();
        this.renderHealthScores();
        this.renderRecommendations();
        this.renderComplianceMetrics();
    }
    
    /**
     * Render meal reminders
     */
    renderMealReminders() {
        const container = document.getElementById('meal-reminders');
        if (!container) return;
        
        const reminders = this.insights.meal_reminders || [];
        
        if (reminders.length === 0) {
            container.innerHTML = `
                <div class="insights-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>No upcoming meals in the next 4 hours</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="meal-reminders-list">
                ${reminders.map(reminder => `
                    <div class="reminder-item ${reminder.urgency}">
                        <div class="reminder-icon">
                            <i class="fas ${this.getPetIcon(reminder.pet_species)}"></i>
                        </div>
                        <div class="reminder-content">
                            <div class="reminder-pet">${reminder.pet_name}</div>
                            <div class="reminder-time">
                                <i class="fas fa-clock"></i>
                                ${reminder.formatted_time} (${this.formatTimeUntil(reminder.minutes_until)})
                            </div>
                        </div>
                        <div class="reminder-actions">
                            <button class="btn-reminder" onclick="nutritionInsights.markMealFed(${reminder.pet_id}, '${reminder.meal_time}')" title="Mark as fed">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render health scores
     */
    renderHealthScores() {
        const container = document.getElementById('nutrition-health-scores');
        if (!container) return;
        
        const scores = this.insights.health_scores || [];
        
        if (scores.length === 0) {
            container.innerHTML = `
                <div class="insights-empty">
                    <i class="fas fa-paw"></i>
                    <p>Add pets to see health scores</p>
                </div>
            `;
            return;
        }
        
        // Calculate average score
        const avgScore = scores.reduce((sum, pet) => sum + pet.health_score, 0) / scores.length;
        
        container.innerHTML = `
            <div class="health-scores-summary">
                <div class="average-score">
                    <div class="score-circle ${this.getScoreClass(avgScore)}">
                        <span class="score-value">${Math.round(avgScore)}</span>
                        <span class="score-label">Avg Score</span>
                    </div>
                </div>
                <div class="scores-breakdown">
                    ${scores.map(pet => `
                        <div class="pet-score-item">
                            <div class="pet-info">
                                <span class="pet-name">${pet.pet_name}</span>
                                <div class="score-mini ${this.getScoreClass(pet.health_score)}">
                                    ${pet.health_score}
                                </div>
                            </div>
                            ${pet.recommendations.length > 0 ? `
                                <div class="score-recommendations">
                                    ${pet.recommendations.slice(0, 2).map(rec => `
                                        <div class="recommendation-mini">
                                            <i class="fas fa-lightbulb"></i>
                                            <span>${rec}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render recommendations
     */
    renderRecommendations() {
        const container = document.getElementById('nutrition-recommendations');
        if (!container) return;
        
        const recommendations = this.insights.recommendations || [];
        
        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="insights-empty">
                    <i class="fas fa-thumbs-up"></i>
                    <p>Great job! No urgent recommendations</p>
                </div>
            `;
            return;
        }
        
        // Flatten and prioritize recommendations
        const allRecommendations = [];
        recommendations.forEach(petRec => {
            petRec.recommendations.forEach(rec => {
                allRecommendations.push({
                    ...rec,
                    pet_name: petRec.pet_name,
                    pet_id: petRec.pet_id
                });
            });
        });
        
        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        container.innerHTML = `
            <div class="recommendations-list">
                ${allRecommendations.slice(0, 5).map(rec => `
                    <div class="recommendation-item priority-${rec.priority}">
                        <div class="recommendation-icon">
                            <i class="fas ${rec.icon}"></i>
                        </div>
                        <div class="recommendation-content">
                            <div class="recommendation-title">${rec.title}</div>
                            <div class="recommendation-description">${rec.description}</div>
                            <div class="recommendation-pet">For ${rec.pet_name}</div>
                        </div>
                        <div class="recommendation-actions">
                            <button class="btn-action" onclick="nutritionInsights.executeRecommendation('${rec.action}', ${rec.pet_id})">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render compliance metrics
     */
    renderComplianceMetrics() {
        const container = document.getElementById('nutrition-compliance');
        if (!container) return;
        
        const metrics = this.insights.compliance_metrics || {};
        
        container.innerHTML = `
            <div class="compliance-metrics">
                <div class="metric-item">
                    <div class="metric-value">${metrics.overall_compliance || 0}%</div>
                    <div class="metric-label">Plan Coverage</div>
                    <div class="metric-detail">${metrics.pets_with_plans || 0}/${metrics.total_pets || 0} pets</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${Math.round(metrics.recent_activity_score || 0)}</div>
                    <div class="metric-label">Activity Score</div>
                    <div class="metric-detail">Last 7 days</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${Math.round(metrics.plan_freshness_score || 0)}</div>
                    <div class="metric-label">Plan Freshness</div>
                    <div class="metric-detail">How up-to-date</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Mark meal as fed
     */
    async markMealFed(petId, mealTime) {
        try {
            const response = await fetch('/api-bridge.php?action=nutrition_calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    action: 'log_meal_fed',
                    pet_id: petId,
                    meal_time: mealTime,
                    fed_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Show success feedback
                    if (window.app && window.app.showNotification) {
                        window.app.showNotification('Meal logged successfully!', 'success');
                    }
                    
                    // Refresh insights
                    this.loadInsights();
                    
                    // Trigger dashboard update
                    document.dispatchEvent(new CustomEvent('mealLogged', {
                        detail: { pet_id: petId, meal_time: mealTime }
                    }));
                }
            }
        } catch (error) {
            console.error('Error marking meal as fed:', error);
            if (window.app && window.app.showNotification) {
                window.app.showNotification('Failed to log meal', 'error');
            }
        }
    }
    
    /**
     * Execute recommendation action
     */
    executeRecommendation(action, petId) {
        switch (action) {
            case 'calculate_nutrition':
                if (window.nutritionCalculator) {
                    window.nutritionCalculator.calculateForPet(petId);
                }
                break;
            case 'update_nutrition':
            case 'recalculate_nutrition':
                if (window.nutritionCalculator) {
                    window.nutritionCalculator.loadNutritionInterface();
                }
                break;
            case 'explore_senior_options':
                alert('Senior nutrition options coming soon!');
                break;
            default:
                console.warn('Unknown recommendation action:', action);
        }
    }
    
    /**
     * Helper methods
     */
    getPetIcon(species) {
        const icons = {
            dog: 'fa-dog',
            cat: 'fa-cat',
            bird: 'fa-dove',
            rabbit: 'fa-rabbit'
        };
        return icons[species] || 'fa-paw';
    }
    
    formatTimeUntil(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    }
    
    getScoreClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }
    
    showLoadingState() {
        const containers = [
            'meal-reminders',
            'nutrition-health-scores',
            'nutrition-recommendations',
            'nutrition-compliance'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="insights-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading insights...</p>
                    </div>
                `;
            }
        });
    }
    
    hideLoadingState() {
        // Loading state is replaced by actual content
    }
    
    showErrorState(message) {
        const containers = [
            'meal-reminders',
            'nutrition-health-scores',
            'nutrition-recommendations',
            'nutrition-compliance'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="insights-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load insights</p>
                        <button class="btn btn-sm" onclick="nutritionInsights.loadInsights()">
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
            const cached = localStorage.getItem('nutrition_insights_cache');
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour
                    this.insights = data.insights;
                    this.renderInsights();
                }
            }
        } catch (error) {
            console.warn('Failed to load cached insights:', error);
        }
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) return;
        
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadInsights();
            }
        }, this.refreshRate);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    refresh() {
        this.loadInsights();
    }
    
    destroy() {
        this.stopAutoRefresh();
        this.insights = {};
    }
}

// Initialize nutrition insights when DOM is ready
let nutritionInsights = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.dashboard-container')) {
            nutritionInsights = new NutritionInsights();
            window.nutritionInsights = nutritionInsights;
        }
    });
} else {
    if (document.querySelector('.dashboard-container')) {
        nutritionInsights = new NutritionInsights();
        window.nutritionInsights = nutritionInsights;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NutritionInsights;
}