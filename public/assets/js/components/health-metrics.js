/**
 * Health Metrics Component
 * Displays health scores, trends, and alerts on the dashboard
 */
class HealthMetrics {
    constructor(apiClient = null) {
        this.apiClient = apiClient || this.createDefaultApiClient();
        this.metrics = {};
        this.refreshInterval = null;
        this.refreshRate = 300000; // 5 minutes
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadHealthMetrics();
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
        // Listen for health-related events
        document.addEventListener('healthConditionAdded', () => this.loadHealthMetrics());
        document.addEventListener('healthConditionUpdated', () => this.loadHealthMetrics());
        document.addEventListener('healthConditionDeleted', () => this.loadHealthMetrics());
        document.addEventListener('weightLogged', () => this.loadHealthMetrics());
        document.addEventListener('petAdded', () => this.loadHealthMetrics());
        document.addEventListener('petUpdated', () => this.loadHealthMetrics());
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                this.startAutoRefresh();
                this.loadHealthMetrics();
            }
        });
    }
    
    /**
     * Load health metrics from API
     */
    async loadHealthMetrics() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            const response = await this.apiClient.get('/api/dashboard.php?action=health_metrics');
            
            if (response.success) {
                this.metrics = response.health_metrics;
                this.renderHealthMetrics();
                this.hideErrorState();
            } else {
                throw new Error(response.error || 'Failed to load health metrics');
            }
            
        } catch (error) {
            console.error('Error loading health metrics:', error);
            this.showErrorState(error.message);
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Render health metrics
     */
    renderHealthMetrics() {
        this.renderOverallHealthScore();
        this.renderHealthAlerts();
        this.renderPetHealthScores();
        this.renderHealthTrends();
    }
    
    /**
     * Render overall health score
     */
    renderOverallHealthScore() {
        const container = document.getElementById('overall-health-score');
        if (!container) return;
        
        const score = this.metrics.overall_health_score || 0;
        const scoreClass = this.getScoreClass(score);
        
        container.innerHTML = `
            <div class="health-score-display">
                <div class="score-circle ${scoreClass}">
                    <span class="score-value">${score}</span>
                    <span class="score-label">Health Score</span>
                </div>
                <div class="score-description">
                    <h4>Overall Pet Health</h4>
                    <p class="score-text">${this.getScoreDescription(score)}</p>
                    <div class="score-trend">
                        ${this.renderScoreTrend()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render health alerts
     */
    renderHealthAlerts() {
        const container = document.getElementById('health-alerts');
        if (!container) return;
        
        const alerts = this.metrics.health_alerts || [];
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alerts-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>No health alerts - great job!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="health-alerts-list">
                ${alerts.slice(0, 5).map(alert => `
                    <div class="alert-item priority-${alert.priority}">
                        <div class="alert-icon">
                            <i class="fas ${this.getAlertIcon(alert.type)}"></i>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">${alert.title}</div>
                            <div class="alert-description">${alert.description}</div>
                            <div class="alert-pet">For ${alert.pet_name}</div>
                        </div>
                        <div class="alert-actions">
                            <button class="btn-alert-action" onclick="healthMetrics.handleAlert('${alert.type}', ${alert.pet_id})" title="Take action">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
                ${alerts.length > 5 ? `
                    <div class="alerts-more">
                        <button class="btn-show-more" onclick="healthMetrics.showAllAlerts()">
                            View ${alerts.length - 5} more alerts
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render individual pet health scores
     */
    renderPetHealthScores() {
        const container = document.getElementById('pet-health-scores');
        if (!container) return;
        
        const petScores = this.metrics.pet_health_scores || [];
        
        if (petScores.length === 0) {
            container.innerHTML = `
                <div class="scores-empty">
                    <i class="fas fa-paw"></i>
                    <p>Add pets to see individual health scores</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="pet-scores-grid">
                ${petScores.map(pet => `
                    <div class="pet-score-card">
                        <div class="pet-score-header">
                            <div class="pet-name">${pet.pet_name}</div>
                            <div class="score-badge ${this.getScoreClass(pet.health_score)}">
                                ${pet.health_score}
                            </div>
                        </div>
                        <div class="score-factors">
                            ${pet.score_factors.slice(0, 3).map(factor => `
                                <div class="factor-item">
                                    <i class="fas fa-info-circle"></i>
                                    <span>${factor}</span>
                                </div>
                            `).join('')}
                        </div>
                        ${pet.recommendations.length > 0 ? `
                            <div class="pet-recommendations">
                                <div class="recommendation-item">
                                    <i class="fas fa-lightbulb"></i>
                                    <span>${pet.recommendations[0]}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render health trends
     */
    renderHealthTrends() {
        const container = document.getElementById('health-trends');
        if (!container) return;
        
        const trends = this.metrics.health_trends || {};
        const weightTrends = trends.weight_trends || [];
        
        if (weightTrends.length === 0) {
            container.innerHTML = `
                <div class="trends-empty">
                    <i class="fas fa-chart-line"></i>
                    <p>Log more data to see health trends</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="health-trends-content">
                <h4><i class="fas fa-chart-line"></i> Weight Trends</h4>
                <div class="trends-list">
                    ${weightTrends.map(trend => `
                        <div class="trend-item">
                            <div class="trend-pet">${trend.pet_name}</div>
                            <div class="trend-indicator ${trend.trend}">
                                <i class="fas ${this.getTrendIcon(trend.trend)}"></i>
                                <span>${trend.change_percent > 0 ? '+' : ''}${trend.change_percent}%</span>
                            </div>
                            <div class="trend-description">
                                ${this.getTrendDescription(trend.trend, Math.abs(trend.change_percent))}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Handle alert actions
     */
    handleAlert(alertType, petId) {
        switch (alertType) {
            case 'weight_critical':
            case 'weight_high':
            case 'weight_low':
                if (window.app) {
                    window.app.showLogWeight(petId);
                }
                break;
            case 'vet_visit_overdue':
            case 'senior_checkup':
                alert('Veterinary appointment scheduling coming soon!');
                break;
            case 'vaccination_overdue':
                alert('Vaccination tracking coming soon!');
                break;
            case 'bcs_low':
            case 'bcs_high':
                if (window.nutritionCalculator) {
                    window.nutritionCalculator.calculateForPet(petId);
                }
                break;
            default:
                console.warn('Unknown alert type:', alertType);
        }
    }
    
    /**
     * Show all alerts in a modal
     */
    showAllAlerts() {
        const alerts = this.metrics.health_alerts || [];
        
        if (window.app && window.app.showModal) {
            const modalBody = document.getElementById('modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="professional-modal-content">
                        <div class="modal-header">
                            <div class="modal-title">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h2>Health Alerts</h2>
                            </div>
                            <button class="modal-close-btn" onclick="app.closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body-scrollable">
                            <div class="all-alerts-list">
                                ${alerts.map(alert => `
                                    <div class="alert-item priority-${alert.priority}">
                                        <div class="alert-icon">
                                            <i class="fas ${this.getAlertIcon(alert.type)}"></i>
                                        </div>
                                        <div class="alert-content">
                                            <div class="alert-title">${alert.title}</div>
                                            <div class="alert-description">${alert.description}</div>
                                            <div class="alert-pet">For ${alert.pet_name}</div>
                                        </div>
                                        <div class="alert-actions">
                                            <button class="btn-alert-action" onclick="healthMetrics.handleAlert('${alert.type}', ${alert.pet_id}); app.closeModal();">
                                                <i class="fas fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
                window.app.showModal();
            }
        }
    }
    
    /**
     * Helper methods
     */
    getScoreClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }
    
    getScoreDescription(score) {
        if (score >= 80) return 'Excellent health status across all pets';
        if (score >= 60) return 'Good health with minor areas for improvement';
        if (score >= 40) return 'Fair health - some attention needed';
        return 'Health concerns require immediate attention';
    }
    
    renderScoreTrend() {
        // This would show trend arrows based on historical data
        // For now, return empty string
        return '';
    }
    
    getAlertIcon(type) {
        const icons = {
            'weight_critical': 'fa-exclamation-triangle',
            'weight_high': 'fa-weight',
            'weight_low': 'fa-weight',
            'vet_visit_overdue': 'fa-user-md',
            'senior_checkup': 'fa-heart',
            'vaccination_overdue': 'fa-syringe',
            'bcs_low': 'fa-chart-line',
            'bcs_high': 'fa-chart-line'
        };
        return icons[type] || 'fa-info-circle';
    }
    
    getTrendIcon(trend) {
        const icons = {
            'increasing': 'fa-arrow-up',
            'decreasing': 'fa-arrow-down',
            'stable': 'fa-minus'
        };
        return icons[trend] || 'fa-minus';
    }
    
    getTrendDescription(trend, changePercent) {
        if (trend === 'increasing') {
            return `Weight increased by ${changePercent}%`;
        } else if (trend === 'decreasing') {
            return `Weight decreased by ${changePercent}%`;
        } else {
            return 'Weight remains stable';
        }
    }
    
    showLoadingState() {
        const containers = [
            'overall-health-score',
            'health-alerts',
            'pet-health-scores',
            'health-trends'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="health-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading health metrics...</p>
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
            'overall-health-score',
            'health-alerts',
            'pet-health-scores',
            'health-trends'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="health-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load health metrics</p>
                        <button class="btn btn-sm" onclick="healthMetrics.loadHealthMetrics()">
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
            const cached = localStorage.getItem('health_metrics_cache');
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < 3600000) { // 1 hour
                    this.metrics = data.metrics;
                    this.renderHealthMetrics();
                }
            }
        } catch (error) {
            console.warn('Failed to load cached health metrics:', error);
        }
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) return;
        
        this.refreshInterval = setInterval(() => {
            if (!document.hidden) {
                this.loadHealthMetrics();
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
        this.loadHealthMetrics();
    }
    
    destroy() {
        this.stopAutoRefresh();
        this.metrics = {};
    }
}

// Initialize health metrics when DOM is ready
let healthMetrics = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.dashboard-container')) {
            healthMetrics = new HealthMetrics();
            window.healthMetrics = healthMetrics;
        }
    });
} else {
    if (document.querySelector('.dashboard-container')) {
        healthMetrics = new HealthMetrics();
        window.healthMetrics = healthMetrics;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthMetrics;
}