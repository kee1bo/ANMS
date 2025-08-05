// Enhanced Health Dashboard with Goal Setting and Progress Tracking
class HealthDashboardEnhanced {
    constructor(apiClient, healthAnalytics) {
        this.apiClient = apiClient;
        this.analytics = healthAnalytics;
        this.currentPet = null;
        this.healthData = null;
        this.goals = new Map();
        this.filters = {
            dateRange: '3_months',
            showTrend: true,
            showMovingAverage: true,
            showConfidenceInterval: true,
            showStatistics: true
        };
    }

    // Render comprehensive health dashboard
    renderHealthDashboard(pet, healthData) {
        this.currentPet = pet;
        this.healthData = healthData;
        
        return `
            <div class="health-dashboard-enhanced">
                ${this.renderDashboardHeader(pet)}
                ${this.renderHealthMetricsOverview(pet, healthData)}
                ${this.renderGoalsAndProgress(pet)}
                ${this.renderChartsSection(healthData)}
                ${this.renderHealthInsights(pet, healthData)}
                ${this.renderQuickActions(pet)}
            </div>
        `;
    }

    renderDashboardHeader(pet) {
        return `
            <div class="dashboard-header">
                <div class="header-content">
                    <div class="pet-info">
                        <h2>${pet.name}'s Health Dashboard</h2>
                        <div class="pet-details">
                            <span class="pet-species">${pet.species}</span>
                            <span class="pet-age">${pet.age} years old</span>
                            <span class="pet-weight">${pet.current_weight || 'N/A'}kg</span>
                        </div>
                    </div>
                    <div class="dashboard-controls">
                        <select class="time-range-selector" id="time-range" data-current="${this.filters.dateRange}">
                            <option value="1_month">Last Month</option>
                            <option value="3_months" ${this.filters.dateRange === '3_months' ? 'selected' : ''}>Last 3 Months</option>
                            <option value="6_months" ${this.filters.dateRange === '6_months' ? 'selected' : ''}>Last 6 Months</option>
                            <option value="1_year" ${this.filters.dateRange === '1_year' ? 'selected' : ''}>Last Year</option>
                            <option value="all_time">All Time</option>
                        </select>
                        <button class="btn btn--small btn--secondary" data-action="customize-dashboard">
                            ⚙️ Customize
                        </button>
                        <button class="btn btn--small btn--secondary" data-action="export-health-report">
                            📊 Export Report
                        </button>
                    </div>
                </div>
                <div class="health-score-container">
                    ${this.renderHealthScore(pet, this.healthData)}
                </div>
            </div>
        `;
    }

    renderHealthScore(pet, healthData) {
        const healthScore = this.analytics.calculateHealthScore(pet, healthData);
        const scoreColor = healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'error';
        
        return `
            <div class="health-score-card">
                <div class="score-gauge" id="health-score-gauge"></div>
                <div class="score-details">
                    <div class="score-value score-value--${scoreColor}">${healthScore}</div>
                    <div class="score-label">Health Score</div>
                    <div class="score-trend">
                        ${this.getHealthScoreTrend(healthScore)}
                    </div>
                </div>
            </div>
        `;
    }

    renderHealthMetricsOverview(pet, healthData) {
        const metrics = this.calculateHealthMetrics(pet, healthData);
        
        return `
            <div class="health-metrics-overview">
                <div class="metrics-grid">
                    ${metrics.map(metric => `
                        <div class="metric-card metric-card--${metric.status}">
                            <div class="metric-header">
                                <div class="metric-icon">${metric.icon}</div>
                                <div class="metric-trend ${metric.trendDirection}">
                                    ${this.getTrendIcon(metric.trendDirection)}
                                </div>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value">${metric.value}</div>
                                <div class="metric-label">${metric.label}</div>
                                <div class="metric-change">
                                    ${metric.change}
                                </div>
                            </div>
                            <div class="metric-progress">
                                ${this.renderMetricProgress(metric)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderGoalsAndProgress(pet) {
        const goals = this.getHealthGoals(pet.id);
        
        return `
            <div class="goals-section">
                <div class="section-header">
                    <h3>Health Goals & Progress</h3>
                    <button class="btn btn--small btn--primary" data-action="add-health-goal" data-pet-id="${pet.id}">
                        🎯 Add Goal
                    </button>
                </div>
                <div class="goals-grid">
                    ${goals.length > 0 ? goals.map(goal => this.renderGoalCard(goal)).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">🎯</div>
                            <h4>No Health Goals Set</h4>
                            <p>Set health goals to track ${pet.name}'s progress and stay motivated</p>
                            <button class="btn btn--primary" data-action="add-health-goal" data-pet-id="${pet.id}">
                                Set First Goal
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderGoalCard(goal) {
        const progress = this.calculateGoalProgress(goal);
        const progressPercentage = Math.min(100, (progress.current / progress.target) * 100);
        const statusClass = progressPercentage >= 100 ? 'completed' : progressPercentage >= 75 ? 'on-track' : 'needs-attention';
        
        return `
            <div class="goal-card goal-card--${statusClass}">
                <div class="goal-header">
                    <div class="goal-icon">${this.getGoalIcon(goal.type)}</div>
                    <div class="goal-status">
                        ${progressPercentage >= 100 ? '✅' : progressPercentage >= 75 ? '🟢' : '🟡'}
                    </div>
                </div>
                <div class="goal-content">
                    <h4 class="goal-title">${goal.title}</h4>
                    <p class="goal-description">${goal.description}</p>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="progress-text">
                            ${progress.current}${progress.unit} / ${progress.target}${progress.unit}
                            (${progressPercentage.toFixed(0)}%)
                        </div>
                    </div>
                    <div class="goal-timeline">
                        <span class="goal-start">Started: ${new Date(goal.start_date).toLocaleDateString()}</span>
                        <span class="goal-target">Target: ${new Date(goal.target_date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="btn btn--small btn--secondary" data-action="edit-goal" data-goal-id="${goal.id}">
                        Edit
                    </button>
                    <button class="btn btn--small btn--outline" data-action="view-goal-details" data-goal-id="${goal.id}">
                        Details
                    </button>
                </div>
            </div>
        `;
    }

    renderChartsSection(healthData) {
        return `
            <div class="charts-section">
                <div class="section-header">
                    <h3>Health Analytics</h3>
                    <div class="chart-controls">
                        <button class="btn btn--small btn--secondary" data-action="toggle-chart-options">
                            📊 Options
                        </button>
                        <button class="btn btn--small btn--secondary" data-action="fullscreen-charts">
                            🔍 Fullscreen
                        </button>
                    </div>
                </div>
                
                <div class="chart-options" id="chart-options" style="display: none;">
                    <div class="options-grid">
                        <label class="option-item">
                            <input type="checkbox" ${this.filters.showTrend ? 'checked' : ''} data-filter="showTrend">
                            <span>Show Trend Line</span>
                        </label>
                        <label class="option-item">
                            <input type="checkbox" ${this.filters.showMovingAverage ? 'checked' : ''} data-filter="showMovingAverage">
                            <span>Moving Average</span>
                        </label>
                        <label class="option-item">
                            <input type="checkbox" ${this.filters.showConfidenceInterval ? 'checked' : ''} data-filter="showConfidenceInterval">
                            <span>Confidence Interval</span>
                        </label>
                        <label class="option-item">
                            <input type="checkbox" ${this.filters.showStatistics ? 'checked' : ''} data-filter="showStatistics">
                            <span>Statistical Annotations</span>
                        </label>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-container chart-container--primary">
                        <div class="chart-header">
                            <h4>Weight Trend Analysis</h4>
                            <div class="chart-info">
                                <span class="info-icon" title="Advanced weight tracking with statistical analysis">ℹ️</span>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="weight-trend-chart" class="health-chart"></canvas>
                            ${!healthData.weightHistory || healthData.weightHistory.length === 0 ? `
                                <div class="chart-empty-state">
                                    <div class="empty-icon">📊</div>
                                    <h4>No Weight Data Yet</h4>
                                    <p>Start logging ${this.currentPet?.name}'s weight to see trends and insights</p>
                                    <button class="btn btn--primary" data-action="log-weight" data-pet-id="${this.currentPet?.id}">
                                        Log First Weight
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Vital Signs Monitoring</h4>
                            <div class="chart-controls">
                                <select class="vitals-selector" id="vitals-metrics">
                                    <option value="temperature,heart_rate">Temperature & Heart Rate</option>
                                    <option value="heart_rate,respiratory_rate">Heart & Respiratory Rate</option>
                                    <option value="temperature,respiratory_rate">Temperature & Respiratory</option>
                                    <option value="temperature,heart_rate,respiratory_rate">All Vitals</option>
                                </select>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="vitals-chart" class="health-chart"></canvas>
                            ${!healthData.vitalsHistory || healthData.vitalsHistory.length === 0 ? `
                                <div class="chart-empty-state">
                                    <div class="empty-icon">🫀</div>
                                    <h4>No Vital Signs Data</h4>
                                    <p>Record vital signs during vet visits or health checkups</p>
                                    <button class="btn btn--primary" data-action="log-vitals" data-pet-id="${this.currentPet?.id}">
                                        Record Vitals
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Activity Levels</h4>
                            <div class="chart-controls">
                                <select class="activity-period" id="activity-period">
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">Last 3 Months</option>
                                </select>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="activity-chart" class="health-chart"></canvas>
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Medication Adherence</h4>
                            <div class="chart-info">
                                <span class="adherence-summary">
                                    ${this.getMedicationSummary(healthData.medications)}
                                </span>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="medication-chart" class="health-chart"></canvas>
                            ${!healthData.medications || healthData.medications.length === 0 ? `
                                <div class="chart-empty-state">
                                    <div class="empty-icon">💊</div>
                                    <h4>No Medications Tracked</h4>
                                    <p>Add medications to track adherence and schedules</p>
                                    <button class="btn btn--primary" data-action="add-medication" data-pet-id="${this.currentPet?.id}">
                                        Add Medication
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderHealthInsights(pet, healthData) {
        const insights = this.analytics.generateHealthInsights(pet, healthData);
        const recommendations = this.generateRecommendations(pet, healthData);
        
        return `
            <div class="insights-section">
                <div class="section-header">
                    <h3>Health Insights & Recommendations</h3>
                    <button class="btn btn--small btn--secondary" data-action="refresh-insights">
                        🔄 Refresh
                    </button>
                </div>
                
                <div class="insights-grid">
                    <div class="insights-column">
                        <h4>Current Insights</h4>
                        <div class="insights-list">
                            ${insights.length > 0 ? insights.map(insight => `
                                <div class="insight-card insight-card--${insight.type}">
                                    <div class="insight-icon">
                                        ${insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : insight.type === 'error' ? '❌' : 'ℹ️'}
                                    </div>
                                    <div class="insight-content">
                                        <h5 class="insight-title">${insight.title}</h5>
                                        <p class="insight-message">${insight.message}</p>
                                        <div class="insight-actions">
                                            <button class="btn btn--small btn--secondary" data-action="${insight.action}">
                                                Take Action
                                            </button>
                                            <button class="btn btn--small btn--outline" data-action="dismiss-insight" data-insight-id="${insight.id}">
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="empty-insights">
                                    <div class="empty-icon">🎉</div>
                                    <p>Great! No health concerns detected.</p>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="recommendations-column">
                        <h4>Recommendations</h4>
                        <div class="recommendations-list">
                            ${recommendations.map(rec => `
                                <div class="recommendation-card">
                                    <div class="recommendation-priority recommendation-priority--${rec.priority}">
                                        ${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}
                                    </div>
                                    <div class="recommendation-content">
                                        <h5 class="recommendation-title">${rec.title}</h5>
                                        <p class="recommendation-description">${rec.description}</p>
                                        <div class="recommendation-timeline">
                                            <span class="timeline-label">Recommended by:</span>
                                            <span class="timeline-date">${rec.timeline}</span>
                                        </div>
                                    </div>
                                    <div class="recommendation-actions">
                                        <button class="btn btn--small btn--primary" data-action="${rec.action}" data-rec-id="${rec.id}">
                                            ${rec.actionLabel}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickActions(pet) {
        return `
            <div class="quick-actions-section">
                <div class="section-header">
                    <h3>Quick Actions</h3>
                </div>
                <div class="actions-grid">
                    <button class="action-card" data-action="log-weight" data-pet-id="${pet.id}">
                        <div class="action-icon">⚖️</div>
                        <div class="action-label">Log Weight</div>
                        <div class="action-description">Record current weight</div>
                    </button>
                    
                    <button class="action-card" data-action="log-vitals" data-pet-id="${pet.id}">
                        <div class="action-icon">🫀</div>
                        <div class="action-label">Record Vitals</div>
                        <div class="action-description">Temperature, heart rate, etc.</div>
                    </button>
                    
                    <button class="action-card" data-action="add-medication" data-pet-id="${pet.id}">
                        <div class="action-icon">💊</div>
                        <div class="action-label">Add Medication</div>
                        <div class="action-description">Track new medication</div>
                    </button>
                    
                    <button class="action-card" data-action="schedule-vet-visit" data-pet-id="${pet.id}">
                        <div class="action-icon">👨‍⚕️</div>
                        <div class="action-label">Vet Visit</div>
                        <div class="action-description">Schedule or record visit</div>
                    </button>
                    
                    <button class="action-card" data-action="add-health-note" data-pet-id="${pet.id}">
                        <div class="action-icon">📝</div>
                        <div class="action-label">Health Note</div>
                        <div class="action-description">Add observation or note</div>
                    </button>
                    
                    <button class="action-card" data-action="view-health-timeline" data-pet-id="${pet.id}">
                        <div class="action-icon">📅</div>
                        <div class="action-label">Health Timeline</div>
                        <div class="action-description">View complete history</div>
                    </button>
                </div>
            </div>
        `;
    }

    // Initialize dashboard with charts and interactivity
    initializeDashboard(container) {
        this.initializeCharts(container);
        this.attachEventListeners(container);
        this.startRealTimeUpdates();
    }

    initializeCharts(container) {
        // Initialize weight chart with enhanced features
        const weightCanvas = container.querySelector('#weight-trend-chart');
        if (weightCanvas && this.healthData.weightHistory && this.healthData.weightHistory.length > 0) {
            const chartOptions = {
                ...this.filters,
                idealWeight: this.currentPet.ideal_weight,
                idealWeightTolerance: 0.5,
                movingAverageWindow: 7,
                showStatisticalZones: true,
                statistics: this.analytics.calculateStatistics(this.healthData.weightHistory.map(d => d.weight))
            };
            
            this.weightChart = this.analytics.createWeightChart(weightCanvas, this.healthData.weightHistory, chartOptions);
        }

        // Initialize vitals chart
        const vitalsCanvas = container.querySelector('#vitals-chart');
        if (vitalsCanvas && this.healthData.vitalsHistory && this.healthData.vitalsHistory.length > 0) {
            const selectedMetrics = container.querySelector('#vitals-metrics').value.split(',');
            this.vitalsChart = this.analytics.createVitalsChart(vitalsCanvas, this.healthData.vitalsHistory, selectedMetrics);
        }

        // Initialize activity chart
        const activityCanvas = container.querySelector('#activity-chart');
        if (activityCanvas && this.healthData.activityHistory && this.healthData.activityHistory.length > 0) {
            this.activityChart = this.analytics.createActivityChart(activityCanvas, this.healthData.activityHistory);
        }

        // Initialize medication chart
        const medicationCanvas = container.querySelector('#medication-chart');
        if (medicationCanvas && this.healthData.medications && this.healthData.medications.length > 0) {
            this.medicationChart = this.analytics.createMedicationChart(medicationCanvas, this.healthData.medications);
        }

        // Initialize health score gauge
        const healthScoreGauge = container.querySelector('#health-score-gauge');
        if (healthScoreGauge) {
            const healthScore = this.analytics.calculateHealthScore(this.currentPet, this.healthData);
            this.healthScoreChart = this.analytics.createHealthScoreGauge(healthScoreGauge, healthScore);
        }
    }

    attachEventListeners(container) {
        // Time range selector
        const timeRangeSelector = container.querySelector('#time-range');
        if (timeRangeSelector) {
            timeRangeSelector.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.refreshDashboard();
            });
        }

        // Chart options toggles
        const chartOptions = container.querySelectorAll('[data-filter]');
        chartOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.filters[e.target.dataset.filter] = e.target.checked;
                this.refreshCharts();
            });
        });

        // Chart controls
        container.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'toggle-chart-options':
                    this.toggleChartOptions(container);
                    break;
                case 'fullscreen-charts':
                    this.openFullscreenCharts();
                    break;
                case 'customize-dashboard':
                    this.openDashboardCustomization();
                    break;
                case 'export-health-report':
                    this.exportHealthReport();
                    break;
                case 'refresh-insights':
                    this.refreshInsights();
                    break;
                default:
                    // Handle other actions through event system
                    this.handleAction(action, e.target);
            }
        });

        // Chart data point interactions
        const charts = container.querySelectorAll('canvas');
        charts.forEach(canvas => {
            canvas.addEventListener('dataPointClick', (e) => {
                this.showDataPointDetails(e.detail);
            });
        });
    }

    // Utility methods
    calculateHealthMetrics(pet, healthData) {
        const metrics = [];

        // Weight metric
        if (pet.current_weight) {
            const weightStatus = this.getWeightStatus(pet);
            const weightTrend = this.getWeightTrend(healthData.weightHistory);
            
            metrics.push({
                icon: '⚖️',
                label: 'Current Weight',
                value: `${pet.current_weight}kg`,
                status: weightStatus.status,
                trendDirection: weightTrend.direction,
                change: weightTrend.change,
                target: pet.ideal_weight ? `${pet.ideal_weight}kg` : null,
                progress: pet.ideal_weight ? this.calculateWeightProgress(pet.current_weight, pet.ideal_weight) : null
            });
        }

        // Body condition metric
        if (pet.body_condition_score) {
            metrics.push({
                icon: '📊',
                label: 'Body Condition',
                value: `${pet.body_condition_score}/9`,
                status: this.getBodyConditionStatus(pet.body_condition_score),
                trendDirection: 'stable',
                change: 'Ideal range',
                target: '5/9',
                progress: (pet.body_condition_score / 9) * 100
            });
        }

        // Activity metric
        if (healthData.activity) {
            metrics.push({
                icon: '🏃',
                label: 'Activity Level',
                value: pet.activity_level || 'Moderate',
                status: this.getActivityStatus(pet.activity_level),
                trendDirection: 'stable',
                change: healthData.activity.progress ? `${healthData.activity.progress}% of goal` : 'No goal set',
                target: '100%',
                progress: healthData.activity.progress || 0
            });
        }

        // Health score metric
        const healthScore = this.analytics.calculateHealthScore(pet, healthData);
        metrics.push({
            icon: '❤️',
            label: 'Health Score',
            value: `${healthScore}/100`,
            status: healthScore >= 80 ? 'good' : healthScore >= 60 ? 'fair' : 'needs-attention',
            trendDirection: 'stable',
            change: 'Based on all factors',
            target: '80+',
            progress: healthScore
        });

        return metrics;
    }

    getHealthGoals(petId) {
        // Mock goals - in real implementation, fetch from API
        return [
            {
                id: 1,
                pet_id: petId,
                type: 'weight_loss',
                title: 'Reach Ideal Weight',
                description: 'Lose 2kg to reach ideal weight of 24kg',
                target_value: 24,
                current_value: 26,
                unit: 'kg',
                start_date: '2024-01-01',
                target_date: '2024-06-01',
                status: 'active'
            },
            {
                id: 2,
                pet_id: petId,
                type: 'activity',
                title: 'Daily Exercise Goal',
                description: 'Achieve 60 minutes of daily exercise',
                target_value: 60,
                current_value: 45,
                unit: 'min',
                start_date: '2024-01-15',
                target_date: '2024-12-31',
                status: 'active'
            }
        ];
    }

    generateRecommendations(pet, healthData) {
        const recommendations = [];

        // Weight-based recommendations
        if (pet.current_weight && pet.ideal_weight) {
            const weightDiff = pet.current_weight - pet.ideal_weight;
            if (Math.abs(weightDiff) > 1) {
                recommendations.push({
                    id: 'weight-management',
                    title: weightDiff > 0 ? 'Weight Loss Plan' : 'Weight Gain Plan',
                    description: `Consider adjusting diet and exercise to ${weightDiff > 0 ? 'reduce' : 'increase'} weight by ${Math.abs(weightDiff).toFixed(1)}kg`,
                    priority: Math.abs(weightDiff) > 3 ? 'high' : 'medium',
                    timeline: 'Next 2-4 months',
                    action: 'create-weight-plan',
                    actionLabel: 'Create Plan'
                });
            }
        }

        // Activity recommendations
        if (pet.activity_level === 'low') {
            recommendations.push({
                id: 'increase-activity',
                title: 'Increase Activity Level',
                description: 'Low activity may affect overall health. Consider increasing daily exercise and playtime.',
                priority: 'medium',
                timeline: 'Start this week',
                action: 'plan-activities',
                actionLabel: 'Plan Activities'
            });
        }

        // Vaccination reminders
        recommendations.push({
            id: 'vaccination-reminder',
            title: 'Annual Vaccination Due',
            description: 'Schedule annual vaccination and health checkup with your veterinarian.',
            priority: 'high',
            timeline: 'Within 2 weeks',
            action: 'schedule-vet-visit',
            actionLabel: 'Schedule Visit'
        });

        return recommendations;
    }

    // Event handlers and utility methods
    toggleChartOptions(container) {
        const optionsPanel = container.querySelector('#chart-options');
        optionsPanel.style.display = optionsPanel.style.display === 'none' ? 'block' : 'none';
    }

    refreshDashboard() {
        // Refresh dashboard data and charts
        console.log('Refreshing dashboard with new filters:', this.filters);
        // Implementation would reload data and update charts
    }

    refreshCharts() {
        // Update existing charts with new filter options
        if (this.weightChart) {
            // Destroy and recreate chart with new options
            this.weightChart.destroy();
            // Recreate with new filters...
        }
    }

    getWeightStatus(pet) {
        if (!pet.current_weight || !pet.ideal_weight) {
            return { status: 'unknown' };
        }
        
        const ratio = pet.current_weight / pet.ideal_weight;
        if (ratio < 0.9) return { status: 'underweight' };
        if (ratio > 1.1) return { status: 'overweight' };
        return { status: 'ideal' };
    }

    getWeightTrend(weightHistory) {
        if (!weightHistory || weightHistory.length < 2) {
            return { direction: 'stable', change: 'No trend data' };
        }
        
        const recent = weightHistory.slice(-2);
        const change = recent[1].weight - recent[0].weight;
        
        return {
            direction: change > 0.1 ? 'increasing' : change < -0.1 ? 'decreasing' : 'stable',
            change: `${change > 0 ? '+' : ''}${change.toFixed(1)}kg from last measurement`
        };
    }

    getTrendIcon(direction) {
        switch (direction) {
            case 'increasing': return '↗️';
            case 'decreasing': return '↘️';
            default: return '→';
        }
    }

    renderMetricProgress(metric) {
        if (!metric.progress) return '';
        
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, metric.progress)}%"></div>
            </div>
        `;
    }

    calculateGoalProgress(goal) {
        return {
            current: goal.current_value,
            target: goal.target_value,
            unit: goal.unit
        };
    }

    getGoalIcon(type) {
        const icons = {
            weight_loss: '⚖️',
            weight_gain: '⚖️',
            activity: '🏃',
            medication: '💊',
            checkup: '👨‍⚕️'
        };
        return icons[type] || '🎯';
    }

    getMedicationSummary(medications) {
        if (!medications || medications.length === 0) {
            return 'No medications tracked';
        }
        
        const avgAdherence = medications.reduce((sum, med) => sum + (med.adherence || 100), 0) / medications.length;
        return `${medications.length} medication${medications.length > 1 ? 's' : ''} • ${avgAdherence.toFixed(0)}% adherence`;
    }

    getHealthScoreTrend(score) {
        // Mock trend - in real implementation, compare with previous scores
        return score >= 80 ? '↗️ Improving' : score >= 60 ? '→ Stable' : '↘️ Needs attention';
    }

    handleAction(action, element) {
        // Emit custom event for action handling
        document.dispatchEvent(new CustomEvent('healthDashboardAction', {
            detail: { action, element, pet: this.currentPet }
        }));
    }

    startRealTimeUpdates() {
        // Start periodic updates for real-time data
        this.updateInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000); // Check every 30 seconds
    }

    checkForUpdates() {
        // Check for new health data and update dashboard if needed
        console.log('Checking for health data updates...');
    }

    destroy() {
        // Clean up charts and intervals
        if (this.weightChart) this.weightChart.destroy();
        if (this.vitalsChart) this.vitalsChart.destroy();
        if (this.activityChart) this.activityChart.destroy();
        if (this.medicationChart) this.medicationChart.destroy();
        if (this.healthScoreChart) this.healthScoreChart.destroy();
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthDashboardEnhanced;
} else {
    window.HealthDashboardEnhanced = HealthDashboardEnhanced;
}