// Intelligent Health Alert System
class HealthAlertSystem {
    constructor(apiClient, healthAnalytics) {
        this.apiClient = apiClient;
        this.analytics = healthAnalytics;
        this.alertRules = new Map();
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.notificationSettings = {
            email: true,
            push: true,
            inApp: true,
            severity: {
                low: true,
                medium: true,
                high: true,
                critical: true
            }
        };
        
        this.initializeDefaultRules();
    }

    // Initialize default alert rules
    initializeDefaultRules() {
        // Weight-based alerts
        this.addAlertRule({
            id: 'rapid_weight_loss',
            name: 'Rapid Weight Loss',
            description: 'Alert when pet loses more than 10% body weight in 2 weeks',
            category: 'weight',
            severity: 'high',
            condition: (pet, healthData) => {
                const recentWeights = this.getRecentWeights(healthData.weightHistory, 14);
                if (recentWeights.length < 2) return false;
                
                const oldestWeight = recentWeights[0].weight;
                const newestWeight = recentWeights[recentWeights.length - 1].weight;
                const weightLoss = (oldestWeight - newestWeight) / oldestWeight;
                
                return weightLoss > 0.1; // 10% loss
            },
            message: (pet, data) => `${pet.name} has lost ${data.weightLoss.toFixed(1)}% body weight in ${data.days} days`,
            recommendations: [
                'Schedule immediate veterinary consultation',
                'Monitor food intake and appetite',
                'Check for underlying health conditions'
            ]
        });

        this.addAlertRule({
            id: 'rapid_weight_gain',
            name: 'Rapid Weight Gain',
            description: 'Alert when pet gains more than 15% body weight in 4 weeks',
            category: 'weight',
            severity: 'medium',
            condition: (pet, healthData) => {
                const recentWeights = this.getRecentWeights(healthData.weightHistory, 28);
                if (recentWeights.length < 2) return false;
                
                const oldestWeight = recentWeights[0].weight;
                const newestWeight = recentWeights[recentWeights.length - 1].weight;
                const weightGain = (newestWeight - oldestWeight) / oldestWeight;
                
                return weightGain > 0.15; // 15% gain
            },
            message: (pet, data) => `${pet.name} has gained ${data.weightGain.toFixed(1)}% body weight in ${data.days} days`,
            recommendations: [
                'Review and adjust diet plan',
                'Increase exercise and activity',
                'Consider veterinary consultation'
            ]
        });

        // Vital signs alerts
        this.addAlertRule({
            id: 'abnormal_temperature',
            name: 'Abnormal Temperature',
            description: 'Alert when temperature is outside normal range',
            category: 'vitals',
            severity: 'high',
            condition: (pet, healthData) => {
                const latestVitals = this.getLatestVitals(healthData.vitalsHistory);
                if (!latestVitals || !latestVitals.temperature) return false;
                
                const normalRange = this.getNormalVitalRange(pet.species, 'temperature');
                return latestVitals.temperature < normalRange.min || latestVitals.temperature > normalRange.max;
            },
            message: (pet, data) => `${pet.name}'s temperature is ${data.temperature}°C (normal: ${data.normalRange.min}-${data.normalRange.max}°C)`,
            recommendations: [
                'Monitor closely and recheck in 1 hour',
                'Contact veterinarian if temperature persists',
                'Ensure pet is comfortable and hydrated'
            ]
        });

        // Medication alerts
        this.addAlertRule({
            id: 'missed_medication',
            name: 'Missed Medication Doses',
            description: 'Alert when medication adherence drops below 80%',
            category: 'medication',
            severity: 'medium',
            condition: (pet, healthData) => {
                if (!healthData.medications) return false;
                
                return healthData.medications.some(med => 
                    med.adherence && med.adherence < 80 && med.status === 'active'
                );
            },
            message: (pet, data) => `${pet.name} has missed doses for ${data.medications.join(', ')}`,
            recommendations: [
                'Set up medication reminders',
                'Review dosing schedule with veterinarian',
                'Consider pill organizers or automated dispensers'
            ]
        });

        // Activity alerts
        this.addAlertRule({
            id: 'low_activity',
            name: 'Decreased Activity Level',
            description: 'Alert when activity drops significantly below normal',
            category: 'activity',
            severity: 'low',
            condition: (pet, healthData) => {
                if (!healthData.activityHistory) return false;
                
                const recentActivity = this.getRecentActivity(healthData.activityHistory, 7);
                const baselineActivity = this.getBaselineActivity(healthData.activityHistory);
                
                if (!recentActivity || !baselineActivity) return false;
                
                const activityDrop = (baselineActivity - recentActivity) / baselineActivity;
                return activityDrop > 0.3; // 30% decrease
            },
            message: (pet, data) => `${pet.name}'s activity has decreased by ${data.activityDrop.toFixed(0)}% from baseline`,
            recommendations: [
                'Encourage gentle exercise and play',
                'Check for signs of pain or discomfort',
                'Monitor for other behavioral changes'
            ]
        });

        // Health milestone alerts
        this.addAlertRule({
            id: 'vaccination_due',
            name: 'Vaccination Due',
            description: 'Alert when vaccinations are due or overdue',
            category: 'preventive',
            severity: 'medium',
            condition: (pet, healthData) => {
                const lastVaccination = this.getLastVaccination(healthData.healthRecords);
                if (!lastVaccination) return true; // No vaccination record
                
                const daysSinceVaccination = this.daysBetween(new Date(lastVaccination.date), new Date());
                return daysSinceVaccination > 365; // Annual vaccination
            },
            message: (pet, data) => `${pet.name}'s annual vaccination is ${data.daysOverdue > 0 ? `${data.daysOverdue} days overdue` : 'due soon'}`,
            recommendations: [
                'Schedule vaccination appointment',
                'Review vaccination history with veterinarian',
                'Update vaccination records'
            ]
        });

        // Age-related alerts
        this.addAlertRule({
            id: 'senior_health_check',
            name: 'Senior Pet Health Check',
            description: 'Alert for increased health monitoring in senior pets',
            category: 'preventive',
            severity: 'low',
            condition: (pet, healthData) => {
                const seniorAge = pet.species === 'dog' ? 7 : pet.species === 'cat' ? 8 : 5;
                if (pet.age < seniorAge) return false;
                
                const lastCheckup = this.getLastVetVisit(healthData.healthRecords);
                if (!lastCheckup) return true;
                
                const daysSinceCheckup = this.daysBetween(new Date(lastCheckup.date), new Date());
                return daysSinceCheckup > 180; // 6 months for senior pets
            },
            message: (pet, data) => `${pet.name} is a senior ${pet.species} and needs regular health monitoring`,
            recommendations: [
                'Schedule bi-annual health checkups',
                'Monitor for age-related conditions',
                'Consider senior-specific nutrition'
            ]
        });
    }

    // Add custom alert rule
    addAlertRule(rule) {
        this.alertRules.set(rule.id, {
            ...rule,
            created: new Date(),
            enabled: true
        });
    }

    // Process health data and generate alerts
    async processHealthData(pet, healthData) {
        const newAlerts = [];
        
        for (const [ruleId, rule] of this.alertRules) {
            if (!rule.enabled) continue;
            
            try {
                const shouldAlert = rule.condition(pet, healthData);
                
                if (shouldAlert) {
                    const alertData = this.extractAlertData(pet, healthData, rule);
                    const alert = this.createAlert(pet, rule, alertData);
                    
                    // Check if this alert already exists and is active
                    const existingAlert = this.findActiveAlert(pet.id, ruleId);
                    
                    if (!existingAlert) {
                        newAlerts.push(alert);
                        this.activeAlerts.set(alert.id, alert);
                        
                        // Send notifications
                        await this.sendNotification(alert);
                        
                        // Log alert
                        this.logAlert(alert);
                    } else {
                        // Update existing alert if data has changed
                        this.updateAlert(existingAlert, alertData);
                    }
                } else {
                    // Clear alert if condition is no longer met
                    const existingAlert = this.findActiveAlert(pet.id, ruleId);
                    if (existingAlert) {
                        this.resolveAlert(existingAlert.id, 'condition_resolved');
                    }
                }
            } catch (error) {
                console.error(`Error processing alert rule ${ruleId}:`, error);
            }
        }
        
        return newAlerts;
    }

    // Create alert object
    createAlert(pet, rule, data) {
        const alert = {
            id: this.generateAlertId(),
            pet_id: pet.id,
            pet_name: pet.name,
            rule_id: rule.id,
            rule_name: rule.name,
            category: rule.category,
            severity: rule.severity,
            message: rule.message(pet, data),
            recommendations: rule.recommendations,
            data: data,
            created_at: new Date(),
            status: 'active',
            acknowledged: false,
            resolved_at: null,
            resolution_reason: null
        };
        
        return alert;
    }

    // Extract relevant data for alert
    extractAlertData(pet, healthData, rule) {
        const data = {};
        
        switch (rule.category) {
            case 'weight':
                const recentWeights = this.getRecentWeights(healthData.weightHistory, 28);
                if (recentWeights.length >= 2) {
                    const oldestWeight = recentWeights[0].weight;
                    const newestWeight = recentWeights[recentWeights.length - 1].weight;
                    data.weightChange = newestWeight - oldestWeight;
                    data.weightLoss = (oldestWeight - newestWeight) / oldestWeight * 100;
                    data.weightGain = (newestWeight - oldestWeight) / oldestWeight * 100;
                    data.days = this.daysBetween(new Date(recentWeights[0].date), new Date(recentWeights[recentWeights.length - 1].date));
                }
                break;
                
            case 'vitals':
                const latestVitals = this.getLatestVitals(healthData.vitalsHistory);
                if (latestVitals) {
                    data.temperature = latestVitals.temperature;
                    data.heart_rate = latestVitals.heart_rate;
                    data.respiratory_rate = latestVitals.respiratory_rate;
                    data.normalRange = this.getNormalVitalRange(pet.species, 'temperature');
                }
                break;
                
            case 'medication':
                if (healthData.medications) {
                    data.medications = healthData.medications
                        .filter(med => med.adherence && med.adherence < 80 && med.status === 'active')
                        .map(med => med.name);
                }
                break;
                
            case 'activity':
                const recentActivity = this.getRecentActivity(healthData.activityHistory, 7);
                const baselineActivity = this.getBaselineActivity(healthData.activityHistory);
                if (recentActivity && baselineActivity) {
                    data.recentActivity = recentActivity;
                    data.baselineActivity = baselineActivity;
                    data.activityDrop = (baselineActivity - recentActivity) / baselineActivity * 100;
                }
                break;
                
            case 'preventive':
                const lastVaccination = this.getLastVaccination(healthData.healthRecords);
                if (lastVaccination) {
                    data.lastVaccinationDate = lastVaccination.date;
                    data.daysOverdue = Math.max(0, this.daysBetween(new Date(lastVaccination.date), new Date()) - 365);
                }
                
                const lastCheckup = this.getLastVetVisit(healthData.healthRecords);
                if (lastCheckup) {
                    data.lastCheckupDate = lastCheckup.date;
                    data.daysSinceCheckup = this.daysBetween(new Date(lastCheckup.date), new Date());
                }
                break;
        }
        
        return data;
    }

    // Send notification for alert
    async sendNotification(alert) {
        if (!this.shouldSendNotification(alert)) return;
        
        const notification = {
            type: 'health_alert',
            title: `Health Alert: ${alert.rule_name}`,
            message: alert.message,
            severity: alert.severity,
            pet_name: alert.pet_name,
            timestamp: alert.created_at,
            actions: [
                { label: 'View Details', action: 'view_alert', alert_id: alert.id },
                { label: 'Acknowledge', action: 'acknowledge_alert', alert_id: alert.id }
            ]
        };
        
        // Send in-app notification
        if (this.notificationSettings.inApp) {
            this.showInAppNotification(notification);
        }
        
        // Send push notification
        if (this.notificationSettings.push) {
            await this.sendPushNotification(notification);
        }
        
        // Send email notification
        if (this.notificationSettings.email) {
            await this.sendEmailNotification(notification);
        }
    }

    // Show in-app notification
    showInAppNotification(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `health-alert-notification health-alert-notification--${notification.severity}`;
        notificationElement.innerHTML = `
            <div class="alert-notification-header">
                <div class="alert-icon">${this.getAlertIcon(notification.severity)}</div>
                <div class="alert-title">${notification.title}</div>
                <button class="alert-close" data-action="close-notification">×</button>
            </div>
            <div class="alert-message">${notification.message}</div>
            <div class="alert-actions">
                ${notification.actions.map(action => `
                    <button class="btn btn--small btn--secondary" 
                            data-action="${action.action}" 
                            data-alert-id="${action.alert_id}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
            <div class="alert-timestamp">${this.formatTimestamp(notification.timestamp)}</div>
        `;
        
        // Add to notification container
        let container = document.getElementById('health-alert-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'health-alert-notifications';
            container.className = 'health-alert-notifications-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notificationElement);
        
        // Auto-remove after delay for low severity alerts
        if (notification.severity === 'low') {
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.remove();
                }
            }, 10000);
        }
        
        // Add event listeners
        notificationElement.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const alertId = e.target.dataset.alertId;
            
            switch (action) {
                case 'close-notification':
                    notificationElement.remove();
                    break;
                case 'view_alert':
                    this.showAlertDetails(alertId);
                    break;
                case 'acknowledge_alert':
                    this.acknowledgeAlert(alertId);
                    notificationElement.remove();
                    break;
            }
        });
    }

    // Get active alerts for a pet
    getActiveAlerts(petId) {
        return Array.from(this.activeAlerts.values())
            .filter(alert => alert.pet_id === petId && alert.status === 'active')
            .sort((a, b) => {
                // Sort by severity, then by creation time
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                if (severityDiff !== 0) return severityDiff;
                return new Date(b.created_at) - new Date(a.created_at);
            });
    }

    // Acknowledge alert
    acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledged_at = new Date();
            
            // Update in backend
            this.updateAlertInBackend(alert);
            
            // Emit event
            document.dispatchEvent(new CustomEvent('alertAcknowledged', {
                detail: { alert }
            }));
        }
    }

    // Resolve alert
    resolveAlert(alertId, reason = 'manual') {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'resolved';
            alert.resolved_at = new Date();
            alert.resolution_reason = reason;
            
            // Move to history
            this.alertHistory.push(alert);
            this.activeAlerts.delete(alertId);
            
            // Update in backend
            this.updateAlertInBackend(alert);
            
            // Emit event
            document.dispatchEvent(new CustomEvent('alertResolved', {
                detail: { alert }
            }));
        }
    }

    // Render alerts dashboard
    renderAlertsDashboard(petId) {
        const activeAlerts = this.getActiveAlerts(petId);
        const alertHistory = this.getAlertHistory(petId, 10);
        
        return `
            <div class="health-alerts-dashboard">
                <div class="alerts-header">
                    <h3>Health Alerts</h3>
                    <div class="alerts-summary">
                        ${this.renderAlertsSummary(activeAlerts)}
                    </div>
                    <div class="alerts-controls">
                        <button class="btn btn--small btn--secondary" data-action="configure-alerts">
                            ⚙️ Configure
                        </button>
                        <button class="btn btn--small btn--secondary" data-action="alert-history">
                            📋 History
                        </button>
                    </div>
                </div>
                
                <div class="active-alerts-section">
                    <h4>Active Alerts</h4>
                    <div class="alerts-list">
                        ${activeAlerts.length > 0 ? activeAlerts.map(alert => this.renderAlertCard(alert)).join('') : `
                            <div class="no-alerts">
                                <div class="no-alerts-icon">✅</div>
                                <p>No active health alerts</p>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="alert-history-section">
                    <h4>Recent Alert History</h4>
                    <div class="alert-history-list">
                        ${alertHistory.map(alert => this.renderHistoryAlertCard(alert)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderAlertCard(alert) {
        return `
            <div class="alert-card alert-card--${alert.severity} ${alert.acknowledged ? 'alert-card--acknowledged' : ''}">
                <div class="alert-card-header">
                    <div class="alert-icon">${this.getAlertIcon(alert.severity)}</div>
                    <div class="alert-title">${alert.rule_name}</div>
                    <div class="alert-timestamp">${this.formatTimestamp(alert.created_at)}</div>
                </div>
                
                <div class="alert-message">${alert.message}</div>
                
                <div class="alert-recommendations">
                    <h5>Recommendations:</h5>
                    <ul>
                        ${alert.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="alert-actions">
                    ${!alert.acknowledged ? `
                        <button class="btn btn--small btn--primary" data-action="acknowledge-alert" data-alert-id="${alert.id}">
                            ✓ Acknowledge
                        </button>
                    ` : ''}
                    <button class="btn btn--small btn--secondary" data-action="view-alert-details" data-alert-id="${alert.id}">
                        📋 Details
                    </button>
                    <button class="btn btn--small btn--outline" data-action="resolve-alert" data-alert-id="${alert.id}">
                        ✓ Resolve
                    </button>
                </div>
            </div>
        `;
    }

    // Utility methods
    getRecentWeights(weightHistory, days) {
        if (!weightHistory) return [];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return weightHistory
            .filter(entry => new Date(entry.date) >= cutoffDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getLatestVitals(vitalsHistory) {
        if (!vitalsHistory || vitalsHistory.length === 0) return null;
        return vitalsHistory[vitalsHistory.length - 1];
    }

    getNormalVitalRange(species, vital) {
        const ranges = {
            dog: {
                temperature: { min: 38.3, max: 39.2 },
                heart_rate: { min: 60, max: 140 },
                respiratory_rate: { min: 10, max: 30 }
            },
            cat: {
                temperature: { min: 38.0, max: 39.2 },
                heart_rate: { min: 140, max: 220 },
                respiratory_rate: { min: 20, max: 30 }
            }
        };
        
        return ranges[species]?.[vital] || ranges.dog[vital];
    }

    getRecentActivity(activityHistory, days) {
        if (!activityHistory) return null;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentActivities = activityHistory
            .filter(entry => new Date(entry.date) >= cutoffDate);
        
        if (recentActivities.length === 0) return null;
        
        return recentActivities.reduce((sum, entry) => sum + entry.duration, 0) / recentActivities.length;
    }

    getBaselineActivity(activityHistory) {
        if (!activityHistory || activityHistory.length < 7) return null;
        
        // Use data from 2-8 weeks ago as baseline
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 14);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 56);
        
        const baselineActivities = activityHistory
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= startDate && entryDate <= endDate;
            });
        
        if (baselineActivities.length === 0) return null;
        
        return baselineActivities.reduce((sum, entry) => sum + entry.duration, 0) / baselineActivities.length;
    }

    getLastVaccination(healthRecords) {
        if (!healthRecords) return null;
        
        const vaccinations = healthRecords
            .filter(record => record.type === 'vaccination')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return vaccinations.length > 0 ? vaccinations[0] : null;
    }

    getLastVetVisit(healthRecords) {
        if (!healthRecords) return null;
        
        const vetVisits = healthRecords
            .filter(record => record.type === 'vet_visit')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return vetVisits.length > 0 ? vetVisits[0] : null;
    }

    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date2 - date1) / oneDay));
    }

    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    findActiveAlert(petId, ruleId) {
        return Array.from(this.activeAlerts.values())
            .find(alert => alert.pet_id === petId && alert.rule_id === ruleId && alert.status === 'active');
    }

    getAlertIcon(severity) {
        const icons = {
            critical: '🚨',
            high: '⚠️',
            medium: '🟡',
            low: 'ℹ️'
        };
        return icons[severity] || 'ℹ️';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    shouldSendNotification(alert) {
        return this.notificationSettings.severity[alert.severity];
    }

    renderAlertsSummary(activeAlerts) {
        const counts = activeAlerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
        
        return `
            <div class="alerts-summary-counts">
                ${counts.critical ? `<span class="alert-count alert-count--critical">${counts.critical} Critical</span>` : ''}
                ${counts.high ? `<span class="alert-count alert-count--high">${counts.high} High</span>` : ''}
                ${counts.medium ? `<span class="alert-count alert-count--medium">${counts.medium} Medium</span>` : ''}
                ${counts.low ? `<span class="alert-count alert-count--low">${counts.low} Low</span>` : ''}
                ${activeAlerts.length === 0 ? '<span class="alert-count alert-count--none">No active alerts</span>' : ''}
            </div>
        `;
    }

    getAlertHistory(petId, limit = 10) {
        return this.alertHistory
            .filter(alert => alert.pet_id === petId)
            .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at))
            .slice(0, limit);
    }

    renderHistoryAlertCard(alert) {
        return `
            <div class="alert-history-card">
                <div class="alert-history-header">
                    <span class="alert-icon">${this.getAlertIcon(alert.severity)}</span>
                    <span class="alert-title">${alert.rule_name}</span>
                    <span class="alert-resolved">Resolved ${this.formatTimestamp(alert.resolved_at)}</span>
                </div>
                <div class="alert-history-message">${alert.message}</div>
            </div>
        `;
    }

    // Backend integration methods (to be implemented)
    async updateAlertInBackend(alert) {
        try {
            await this.apiClient.put(`/health/alerts/${alert.id}`, alert);
        } catch (error) {
            console.error('Failed to update alert in backend:', error);
        }
    }

    async sendPushNotification(notification) {
        // Implementation for push notifications
        console.log('Sending push notification:', notification);
    }

    async sendEmailNotification(notification) {
        // Implementation for email notifications
        console.log('Sending email notification:', notification);
    }

    logAlert(alert) {
        console.log('Health alert generated:', alert);
        // Additional logging implementation
    }

    updateAlert(existingAlert, newData) {
        existingAlert.data = { ...existingAlert.data, ...newData };
        existingAlert.updated_at = new Date();
        this.updateAlertInBackend(existingAlert);
    }

    showAlertDetails(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            // Emit event to show alert details modal
            document.dispatchEvent(new CustomEvent('showAlertDetails', {
                detail: { alert }
            }));
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthAlertSystem;
} else {
    window.HealthAlertSystem = HealthAlertSystem;
}