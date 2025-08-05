// Health Tracking Components
class HealthTrackingComponents {
    
    // Health Analytics Dashboard
    renderHealthAnalyticsDashboard(pet, healthData = {}) {
        return `
            <div class="health-analytics-dashboard">
                <div class="dashboard-header">
                    <h3>Health Analytics for ${pet.name}</h3>
                    <div class="dashboard-controls">
                        <select class="time-range-selector" id="time-range">
                            <option value="1_month">Last Month</option>
                            <option value="3_months" selected>Last 3 Months</option>
                            <option value="6_months">Last 6 Months</option>
                            <option value="1_year">Last Year</option>
                            <option value="all_time">All Time</option>
                        </select>
                        <button class="btn btn--small btn--secondary" data-action="export-health-data">
                            📊 Export Data
                        </button>
                    </div>
                </div>

                <div class="health-metrics-grid">
                    <div class="metric-card metric-card--primary">
                        <div class="metric-icon">⚖️</div>
                        <div class="metric-content">
                            <div class="metric-value">${pet.current_weight || 'N/A'} kg</div>
                            <div class="metric-label">Current Weight</div>
                            <div class="metric-change ${this.getWeightTrend(healthData.weightHistory)}">
                                ${this.getWeightChangeText(healthData.weightHistory)}
                            </div>
                        </div>
                    </div>

                    <div class="metric-card metric-card--success">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-content">
                            <div class="metric-value">${pet.ideal_weight || 'Not set'} kg</div>
                            <div class="metric-label">Target Weight</div>
                            <div class="metric-progress">
                                ${this.renderWeightProgress(pet.current_weight, pet.ideal_weight)}
                            </div>
                        </div>
                    </div>

                    <div class="metric-card metric-card--info">
                        <div class="metric-icon">📈</div>
                        <div class="metric-content">
                            <div class="metric-value">${pet.body_condition_score || 'N/A'}/9</div>
                            <div class="metric-label">Body Condition</div>
                            <div class="metric-status">
                                ${this.getBodyConditionStatus(pet.body_condition_score)}
                            </div>
                        </div>
                    </div>

                    <div class="metric-card metric-card--warning">
                        <div class="metric-icon">🏃</div>
                        <div class="metric-content">
                            <div class="metric-value">${pet.activity_level || 'Moderate'}</div>
                            <div class="metric-label">Activity Level</div>
                            <div class="metric-recommendation">
                                ${this.getActivityRecommendation(pet.activity_level)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="charts-section">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Weight Trend</h4>
                            <div class="chart-controls">
                                <button class="btn btn--small btn--secondary" data-action="add-weight-goal">
                                    Set Goal
                                </button>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="weight-chart" class="health-chart"></canvas>
                            ${!healthData.weightHistory || healthData.weightHistory.length === 0 ? `
                                <div class="chart-empty-state">
                                    <div class="empty-icon">📊</div>
                                    <h4>No Weight Data Yet</h4>
                                    <p>Start logging ${pet.name}'s weight to see trends and progress</p>
                                    <button class="btn btn--primary" data-action="log-weight" data-pet-id="${pet.id}">
                                        Log First Weight
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Health Timeline</h4>
                            <div class="chart-controls">
                                <button class="btn btn--small btn--secondary" data-action="add-health-note">
                                    Add Note
                                </button>
                            </div>
                        </div>
                        <div class="chart-content">
                            <div class="health-timeline">
                                ${this.renderHealthTimeline(healthData.healthRecords || [])}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="health-insights">
                    <h4>Health Insights</h4>
                    <div class="insights-grid">
                        ${this.renderHealthInsights(pet, healthData)}
                    </div>
                </div>

                <div class="quick-actions">
                    <h4>Quick Actions</h4>
                    <div class="action-buttons">
                        <button class="btn btn--primary" data-action="log-weight" data-pet-id="${pet.id}">
                            📊 Log Weight
                        </button>
                        <button class="btn btn--secondary" data-action="health-checkup" data-pet-id="${pet.id}">
                            🏥 Health Checkup
                        </button>
                        <button class="btn btn--secondary" data-action="add-medication" data-pet-id="${pet.id}">
                            💊 Add Medication
                        </button>
                        <button class="btn btn--secondary" data-action="schedule-vet-visit" data-pet-id="${pet.id}">
                            👨‍⚕️ Schedule Vet Visit
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Advanced Weight Logging Form
    renderAdvancedWeightForm(petId) {
        const today = new Date().toISOString().split('T')[0];
        return `
            <form class="form advanced-weight-form" data-action="log-weight" data-pet-id="${petId}">
                <div class="form-section">
                    <h4>Weight Measurement</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="weight" class="form-label">Weight (kg) <span class="required">*</span></label>
                            <input type="number" id="weight" name="weight" class="form-input" 
                                   step="0.1" min="0" max="200" required>
                            <div class="form-help">Enter weight in kilograms</div>
                        </div>
                        <div class="form-group">
                            <label for="measurement_method" class="form-label">Measurement Method</label>
                            <select id="measurement_method" name="measurement_method" class="form-select">
                                <option value="home_scale">Home Scale</option>
                                <option value="vet_scale">Veterinary Scale</option>
                                <option value="estimated">Estimated</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="recorded_date" class="form-label">Date <span class="required">*</span></label>
                            <input type="date" id="recorded_date" name="recorded_date" class="form-input" 
                                   value="${today}" required>
                        </div>
                        <div class="form-group">
                            <label for="recorded_time" class="form-label">Time</label>
                            <input type="time" id="recorded_time" name="recorded_time" class="form-input">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Body Condition Assessment</h4>
                    
                    <div class="form-group">
                        <label for="body_condition_score" class="form-label">Body Condition Score (1-9)</label>
                        <div class="bcs-selector">
                            ${[1,2,3,4,5,6,7,8,9].map(score => `
                                <label class="bcs-option">
                                    <input type="radio" name="body_condition_score" value="${score}">
                                    <span class="bcs-number">${score}</span>
                                    <span class="bcs-label">${this.getBCSLabel(score)}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="bcs-guide">
                            <p><strong>Guide:</strong> 1-3 = Underweight, 4-5 = Ideal, 6-7 = Overweight, 8-9 = Obese</p>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Additional Information</h4>
                    
                    <div class="form-group">
                        <label for="activity_before_weighing" class="form-label">Activity Before Weighing</label>
                        <select id="activity_before_weighing" name="activity_before_weighing" class="form-select">
                            <option value="">Select activity level</option>
                            <option value="resting">Resting/Calm</option>
                            <option value="light_activity">Light Activity</option>
                            <option value="moderate_activity">Moderate Activity</option>
                            <option value="high_activity">High Activity/Exercise</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="feeding_status" class="form-label">Feeding Status</label>
                        <select id="feeding_status" name="feeding_status" class="form-select">
                            <option value="">Select feeding status</option>
                            <option value="before_meal">Before Meal</option>
                            <option value="after_meal">After Meal (within 2 hours)</option>
                            <option value="fasted">Fasted (8+ hours)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="health_notes" class="form-label">Health Notes</label>
                        <textarea id="health_notes" name="health_notes" class="form-textarea" rows="3" 
                                  placeholder="Any observations about your pet's condition, behavior, or health..."></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="set_reminder" value="1">
                            <span class="form-checkbox-label">Set reminder for next weigh-in (1 week)</span>
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Log Weight & Assessment</button>
                </div>
            </form>
        `;
    }

    // Medication Tracking Form
    renderMedicationTrackingForm(petId) {
        return `
            <form class="form medication-form" data-action="add-medication" data-pet-id="${petId}">
                <div class="form-section">
                    <h4>Medication Information</h4>
                    
                    <div class="form-group">
                        <label for="medication_name" class="form-label">Medication Name <span class="required">*</span></label>
                        <input type="text" id="medication_name" name="medication_name" class="form-input" 
                               placeholder="e.g., Rimadyl, Metacam" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="dosage" class="form-label">Dosage <span class="required">*</span></label>
                            <input type="text" id="dosage" name="dosage" class="form-input" 
                                   placeholder="e.g., 25mg, 1 tablet" required>
                        </div>
                        <div class="form-group">
                            <label for="frequency" class="form-label">Frequency <span class="required">*</span></label>
                            <select id="frequency" name="frequency" class="form-select" required>
                                <option value="">Select frequency</option>
                                <option value="once_daily">Once Daily</option>
                                <option value="twice_daily">Twice Daily</option>
                                <option value="three_times_daily">Three Times Daily</option>
                                <option value="every_other_day">Every Other Day</option>
                                <option value="weekly">Weekly</option>
                                <option value="as_needed">As Needed</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="start_date" class="form-label">Start Date <span class="required">*</span></label>
                            <input type="date" id="start_date" name="start_date" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="end_date" class="form-label">End Date</label>
                            <input type="date" id="end_date" name="end_date" class="form-input">
                            <div class="form-help">Leave blank for ongoing medication</div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Administration Details</h4>
                    
                    <div class="form-group">
                        <label for="administration_method" class="form-label">Administration Method</label>
                        <select id="administration_method" name="administration_method" class="form-select">
                            <option value="oral">Oral (by mouth)</option>
                            <option value="topical">Topical (on skin)</option>
                            <option value="injection">Injection</option>
                            <option value="eye_drops">Eye Drops</option>
                            <option value="ear_drops">Ear Drops</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="administration_times" class="form-label">Administration Times</label>
                        <div class="time-inputs" id="administration-times">
                            <input type="time" name="admin_time_1" class="form-input time-input" placeholder="First dose">
                        </div>
                        <button type="button" class="btn btn--small btn--secondary" id="add-time-btn">
                            Add Another Time
                        </button>
                    </div>

                    <div class="form-group">
                        <label for="with_food" class="form-label">Food Requirements</label>
                        <select id="with_food" name="with_food" class="form-select">
                            <option value="">No specific requirement</option>
                            <option value="with_food">Give with food</option>
                            <option value="without_food">Give on empty stomach</option>
                            <option value="before_meal">Give before meal</option>
                            <option value="after_meal">Give after meal</option>
                        </select>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Prescriber & Purpose</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="prescribed_by" class="form-label">Prescribed By</label>
                            <input type="text" id="prescribed_by" name="prescribed_by" class="form-input" 
                                   placeholder="Dr. Smith, ABC Veterinary Clinic">
                        </div>
                        <div class="form-group">
                            <label for="prescription_date" class="form-label">Prescription Date</label>
                            <input type="date" id="prescription_date" name="prescription_date" class="form-input">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="purpose" class="form-label">Purpose/Condition</label>
                        <textarea id="purpose" name="purpose" class="form-textarea" rows="2" 
                                  placeholder="e.g., Pain management for arthritis, Antibiotic for infection"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="special_instructions" class="form-label">Special Instructions</label>
                        <textarea id="special_instructions" name="special_instructions" class="form-textarea" rows="2" 
                                  placeholder="Any special instructions from the veterinarian..."></textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Reminders & Monitoring</h4>
                    
                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="enable_reminders" value="1" checked>
                            <span class="form-checkbox-label">Enable medication reminders</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="track_side_effects" value="1">
                            <span class="form-checkbox-label">Monitor for side effects</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="refill_reminder" class="form-label">Refill Reminder</label>
                        <select id="refill_reminder" name="refill_reminder" class="form-select">
                            <option value="">No reminder</option>
                            <option value="3_days">3 days before running out</option>
                            <option value="1_week">1 week before running out</option>
                            <option value="2_weeks">2 weeks before running out</option>
                        </select>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" data-action="close-modal">Cancel</button>
                    <button type="submit" class="btn btn--primary">Add Medication</button>
                </div>
            </form>
        `;
    }

    // Health Timeline Component
    renderHealthTimeline(healthRecords) {
        if (!healthRecords || healthRecords.length === 0) {
            return `
                <div class="timeline-empty-state">
                    <div class="empty-icon">📋</div>
                    <h4>No Health Records Yet</h4>
                    <p>Start tracking health events to build a comprehensive timeline</p>
                    <button class="btn btn--primary" data-action="add-health-record">
                        Add First Record
                    </button>
                </div>
            `;
        }

        return `
            <div class="health-timeline-container">
                ${healthRecords.map(record => `
                    <div class="timeline-item timeline-item--${record.record_type}">
                        <div class="timeline-marker">
                            <div class="timeline-icon">${this.getHealthRecordIcon(record.record_type)}</div>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <h5 class="timeline-title">${this.getHealthRecordTitle(record)}</h5>
                                <span class="timeline-date">${this.formatDate(record.recorded_date)}</span>
                            </div>
                            <div class="timeline-body">
                                ${this.renderHealthRecordContent(record)}
                            </div>
                            <div class="timeline-actions">
                                <button class="btn btn--small btn--secondary" data-action="edit-record" data-record-id="${record.id}">
                                    Edit
                                </button>
                                <button class="btn btn--small btn--secondary" data-action="view-record" data-record-id="${record.id}">
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Helper methods
    getWeightTrend(weightHistory) {
        if (!weightHistory || weightHistory.length < 2) return 'neutral';
        const recent = weightHistory.slice(-2);
        const change = recent[1].weight - recent[0].weight;
        return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    }

    getWeightChangeText(weightHistory) {
        if (!weightHistory || weightHistory.length < 2) return 'No trend data';
        const recent = weightHistory.slice(-2);
        const change = (recent[1].weight - recent[0].weight).toFixed(1);
        const direction = change > 0 ? '↗' : change < 0 ? '↘' : '→';
        return `${direction} ${Math.abs(change)}kg from last measurement`;
    }

    renderWeightProgress(currentWeight, idealWeight) {
        if (!currentWeight || !idealWeight) return 'Target not set';
        const difference = Math.abs(currentWeight - idealWeight);
        const percentage = Math.max(0, Math.min(100, (1 - difference / idealWeight) * 100));
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="progress-text">${percentage.toFixed(0)}% to goal</span>
        `;
    }

    getBodyConditionStatus(score) {
        if (!score) return 'Not assessed';
        if (score <= 3) return 'Underweight';
        if (score <= 5) return 'Ideal';
        if (score <= 7) return 'Overweight';
        return 'Obese';
    }

    getActivityRecommendation(level) {
        const recommendations = {
            low: 'Consider increasing activity',
            moderate: 'Good activity level',
            high: 'Excellent activity level'
        };
        return recommendations[level] || 'Monitor activity';
    }

    getBCSLabel(score) {
        const labels = {
            1: 'Very Thin', 2: 'Underweight', 3: 'Thin',
            4: 'Underweight', 5: 'Ideal', 6: 'Overweight',
            7: 'Heavy', 8: 'Obese', 9: 'Very Obese'
        };
        return labels[score] || '';
    }

    getHealthRecordIcon(type) {
        const icons = {
            weight: '⚖️',
            vet_visit: '🏥',
            medication: '💊',
            vaccination: '💉',
            health_note: '📝',
            body_condition: '📊',
            activity: '🏃'
        };
        return icons[type] || '📋';
    }

    getHealthRecordTitle(record) {
        const titles = {
            weight: 'Weight Measurement',
            vet_visit: 'Veterinary Visit',
            medication: 'Medication',
            vaccination: 'Vaccination',
            health_note: 'Health Note',
            body_condition: 'Body Condition Assessment',
            activity: 'Activity Log'
        };
        return titles[record.record_type] || 'Health Record';
    }

    renderHealthRecordContent(record) {
        switch (record.record_type) {
            case 'weight':
                return `<p><strong>${record.numeric_value}kg</strong> ${record.text_value ? `- ${record.text_value}` : ''}</p>`;
            case 'vet_visit':
                const visitData = record.json_data || {};
                return `<p><strong>Checkup:</strong> ${visitData.checkup_type || 'General'}<br>
                        <strong>Vet:</strong> ${visitData.veterinarian || 'Not specified'}</p>`;
            case 'medication':
                const medData = record.json_data || {};
                return `<p><strong>Medication:</strong> ${medData.medication_name || 'Not specified'}<br>
                        <strong>Dosage:</strong> ${medData.dosage || 'Not specified'}</p>`;
            default:
                return `<p>${record.text_value || 'No details available'}</p>`;
        }
    }

    renderHealthInsights(pet, healthData) {
        const insights = [];
        
        // Weight insights
        if (pet.current_weight && pet.ideal_weight) {
            const difference = pet.current_weight - pet.ideal_weight;
            if (Math.abs(difference) > 0.5) {
                insights.push({
                    type: difference > 0 ? 'warning' : 'info',
                    title: 'Weight Management',
                    message: `${pet.name} is ${Math.abs(difference).toFixed(1)}kg ${difference > 0 ? 'above' : 'below'} ideal weight`,
                    action: 'adjust-nutrition-plan'
                });
            }
        }

        // Activity insights
        if (pet.activity_level === 'low') {
            insights.push({
                type: 'warning',
                title: 'Activity Level',
                message: 'Low activity level may affect overall health and weight management',
                action: 'increase-activity'
            });
        }

        // Body condition insights
        if (pet.body_condition_score && (pet.body_condition_score <= 3 || pet.body_condition_score >= 7)) {
            insights.push({
                type: 'warning',
                title: 'Body Condition',
                message: `Body condition score of ${pet.body_condition_score}/9 indicates ${pet.body_condition_score <= 3 ? 'underweight' : 'overweight'} condition`,
                action: 'consult-veterinarian'
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'success',
                title: 'Health Status',
                message: `${pet.name} appears to be in good health based on available data`,
                action: 'continue-monitoring'
            });
        }

        return insights.map(insight => `
            <div class="insight-card insight-card--${insight.type}">
                <div class="insight-icon">${insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}</div>
                <div class="insight-content">
                    <h5 class="insight-title">${insight.title}</h5>
                    <p class="insight-message">${insight.message}</p>
                    <button class="btn btn--small btn--secondary" data-action="${insight.action}">
                        Take Action
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Export for module use
window.HealthTrackingComponents = HealthTrackingComponents;    //
 Health Dashboard Tab Management
    initializeHealthDashboard() {
        const healthTabs = document.querySelectorAll('.health-tab');
        const healthTabContents = document.querySelectorAll('.health-tab-content');

        healthTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Remove active class from all tabs and contents
                healthTabs.forEach(t => t.classList.remove('health-tab--active'));
                healthTabContents.forEach(content => {
                    content.classList.remove('health-tab-content--active');
                });
                
                // Add active class to clicked tab and corresponding content
                e.target.classList.add('health-tab--active');
                const targetContent = document.querySelector(`[data-tab-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('health-tab-content--active');
                }
                
                // Initialize tab-specific functionality
                this.initializeTabContent(targetTab);
            });
        });
    }

    // Initialize content for specific tabs
    initializeTabContent(tabName) {
        switch(tabName) {
            case 'weight':
                this.initializeWeightChart();
                break;
            case 'vitals':
                this.initializeVitalsChart();
                break;
            case 'medications':
                this.initializeMedicationCalendar();
                break;
            case 'records':
                this.initializeRecordsFilters();
                break;
        }
    }

    // Weight Chart Initialization
    initializeWeightChart() {
        const canvas = document.getElementById('weight-chart-canvas');
        if (!canvas) return;

        // Mock weight data - in real app this would come from API
        const weightData = this.generateMockWeightData();
        this.renderWeightChart(canvas, weightData);
    }

    generateMockWeightData() {
        const data = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        
        let currentWeight = 25.5;
        for (let i = 0; i < 26; i++) { // 6 months of weekly data
            const date = new Date(startDate);
            date.setDate(date.getDate() + (i * 7));
            
            // Add some realistic weight variation
            currentWeight += (Math.random() - 0.5) * 0.5;
            currentWeight = Math.max(20, Math.min(30, currentWeight)); // Keep within reasonable bounds
            
            data.push({
                date: date.toISOString().split('T')[0],
                weight: Math.round(currentWeight * 10) / 10
            });
        }
        
        return data;
    }

    renderWeightChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Chart dimensions
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);

        // Data processing
        const weights = data.map(d => d.weight);
        const minWeight = Math.min(...weights) - 1;
        const maxWeight = Math.max(...weights) + 1;
        const weightRange = maxWeight - minWeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + chartHeight);
            ctx.stroke();
        }

        // Draw weight line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#3b82f6';
        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';

        // Y-axis labels (weight)
        for (let i = 0; i <= 5; i++) {
            const weight = minWeight + (weightRange / 5) * (5 - i);
            const y = padding + (chartHeight / 5) * i;
            ctx.textAlign = 'right';
            ctx.fillText(weight.toFixed(1) + ' kg', padding - 10, y + 4);
        }

        // X-axis labels (dates)
        ctx.textAlign = 'center';
        for (let i = 0; i < data.length; i += Math.ceil(data.length / 6)) {
            const x = padding + (chartWidth / (data.length - 1)) * i;
            const date = new Date(data[i].date);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            ctx.fillText(label, x, canvas.height - 10);
        }
    }

    // Vitals Chart Initialization
    initializeVitalsChart() {
        const canvas = document.getElementById('vitals-chart-canvas');
        const selector = document.getElementById('vitals-metric-selector');
        
        if (!canvas || !selector) return;

        const updateChart = () => {
            const metric = selector.value;
            const vitalsData = this.generateMockVitalsData(metric);
            this.renderVitalsChart(canvas, vitalsData, metric);
        };

        selector.addEventListener('change', updateChart);
        updateChart(); // Initial render
    }

    generateMockVitalsData(metric) {
        const data = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        
        let baseValue;
        let variation;
        
        switch(metric) {
            case 'temperature':
                baseValue = 38.5;
                variation = 0.5;
                break;
            case 'heart_rate':
                baseValue = 80;
                variation = 10;
                break;
            case 'respiratory_rate':
                baseValue = 20;
                variation = 3;
                break;
        }
        
        for (let i = 0; i < 12; i++) { // 3 months of weekly data
            const date = new Date(startDate);
            date.setDate(date.getDate() + (i * 7));
            
            const value = baseValue + (Math.random() - 0.5) * variation * 2;
            
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value * 10) / 10
            });
        }
        
        return data;
    }

    renderVitalsChart(canvas, data, metric) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Chart dimensions
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);

        // Data processing
        const values = data.map(d => d.value);
        const minValue = Math.min(...values) - (Math.max(...values) - Math.min(...values)) * 0.1;
        const maxValue = Math.max(...values) + (Math.max(...values) - Math.min(...values)) * 0.1;
        const valueRange = maxValue - minValue;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid and chart similar to weight chart
        // ... (similar implementation to renderWeightChart)
        
        // For brevity, using simplified version
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Draw weight line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#10b981';
        data.forEach((point, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    // Medication Calendar Initialization
    initializeMedicationCalendar() {
        const medDoses = document.querySelectorAll('.med-dose');
        
        medDoses.forEach(dose => {
            dose.addEventListener('click', (e) => {
                e.target.classList.toggle('med-dose--taken');
                // In real app, this would update the backend
                this.logMedicationAdministration(e.target);
            });
        });
    }

    logMedicationAdministration(doseElement) {
        const isTaken = doseElement.classList.contains('med-dose--taken');
        console.log(`Medication dose ${isTaken ? 'taken' : 'not taken'} at ${doseElement.textContent}`);
        
        // Show feedback
        this.showNotification(
            isTaken ? 'Medication dose logged' : 'Medication dose unmarked',
            'success'
        );
    }

    // Records Filters Initialization
    initializeRecordsFilters() {
        const filterButton = document.querySelector('[data-action="filter-records"]');
        if (!filterButton) return;

        filterButton.addEventListener('click', () => {
            const recordType = document.getElementById('record-type')?.value;
            const dateRange = document.getElementById('date-range')?.value;
            
            this.filterHealthRecords(recordType, dateRange);
        });
    }

    filterHealthRecords(type, dateRange) {
        const recordItems = document.querySelectorAll('.record-item');
        
        recordItems.forEach(item => {
            let show = true;
            
            // Filter by type
            if (type && type !== 'all') {
                const recordType = item.querySelector('.record-type');
                if (recordType && !recordType.classList.contains(`record-type--${type}`)) {
                    show = false;
                }
            }
            
            // Filter by date range would require actual date comparison
            // For now, just show all items
            
            item.style.display = show ? 'flex' : 'none';
        });
        
        this.showNotification('Records filtered successfully', 'info');
    }

    // Health Form Handlers
    handleHealthFormSubmission(form, action) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        switch(action) {
            case 'log-weight':
                return this.submitWeightLog(data);
            case 'log-vitals':
                return this.submitVitalsLog(data);
            case 'log-activity':
                return this.submitActivityLog(data);
            case 'add-medication':
                return this.submitMedicationAdd(data);
            case 'add-health-record':
                return this.submitHealthRecord(data);
        }
    }

    async submitWeightLog(data) {
        try {
            // Show loading state
            const submitButton = document.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // In real app, make actual API call
            console.log('Weight log submitted:', data);
            
            this.showNotification('Weight logged successfully!', 'success');
            this.closeModal();
            
            // Refresh weight data
            this.refreshHealthData();
            
        } catch (error) {
            console.error('Error logging weight:', error);
            this.showNotification('Failed to log weight. Please try again.', 'error');
        }
    }

    async submitVitalsLog(data) {
        try {
            const submitButton = document.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Vitals log submitted:', data);
            
            this.showNotification('Vital signs logged successfully!', 'success');
            this.closeModal();
            this.refreshHealthData();
            
        } catch (error) {
            console.error('Error logging vitals:', error);
            this.showNotification('Failed to log vital signs. Please try again.', 'error');
        }
    }

    async submitActivityLog(data) {
        try {
            const submitButton = document.querySelector('button[type="submit"]');
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Activity log submitted:', data);
            
            this.showNotification('Activity logged successfully!', 'success');
            this.closeModal();
            this.refreshHealthData();
            
        } catch (error) {
            console.error('Error logging activity:', error);
            this.showNotification('Failed to log activity. Please try again.', 'error');
        }
    }

    async submitMedicationAdd(data) {
        try {
            const submitButton = document.querySelector('button[type="submit"]');
            submitButton.textContent = 'Adding...';
            submitButton.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Medication added:', data);
            
            this.showNotification('Medication added successfully!', 'success');
            this.closeModal();
            this.refreshHealthData();
            
        } catch (error) {
            console.error('Error adding medication:', error);
            this.showNotification('Failed to add medication. Please try again.', 'error');
        }
    }

    async submitHealthRecord(data) {
        try {
            const submitButton = document.querySelector('button[type="submit"]');
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Health record added:', data);
            
            this.showNotification('Health record saved successfully!', 'success');
            this.closeModal();
            this.refreshHealthData();
            
        } catch (error) {
            console.error('Error saving health record:', error);
            this.showNotification('Failed to save health record. Please try again.', 'error');
        }
    }

    // Refresh health data after updates
    refreshHealthData() {
        // In real app, this would fetch fresh data from API
        console.log('Refreshing health data...');
        
        // Update charts if they're visible
        const activeTab = document.querySelector('.health-tab--active');
        if (activeTab) {
            const tabName = activeTab.dataset.tab;
            this.initializeTabContent(tabName);
        }
    }

    // Health Alert Management
    handleHealthAlert(alertElement, action) {
        const alertId = alertElement.dataset.alertId;
        
        switch(action) {
            case 'dismiss-alert':
                this.dismissHealthAlert(alertId, alertElement);
                break;
        }
    }

    dismissHealthAlert(alertId, alertElement) {
        // Animate out
        alertElement.style.opacity = '0';
        alertElement.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            alertElement.remove();
            
            // Check if no alerts remain
            const alertsList = document.querySelector('.alerts-list');
            if (alertsList && alertsList.children.length === 0) {
                alertsList.innerHTML = `
                    <div class="alert-empty">
                        <p>No current health alerts</p>
                    </div>
                `;
            }
        }, 300);
        
        // In real app, update backend
        console.log(`Alert ${alertId} dismissed`);
    }

    // Export health data functionality
    exportHealthData(petId, format = 'pdf') {
        console.log(`Exporting health data for pet ${petId} in ${format} format`);
        
        // In real app, this would generate and download the report
        this.showNotification(`Health data export started. You'll receive an email when ready.`, 'info');
    }

    // Utility method to show notifications
    showNotification(message, type = 'info') {
        // Use the existing notification system
        if (window.NotificationManager) {
            window.NotificationManager.show(message, type);
        } else {
            // Fallback to console
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Utility method to close modal
    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal && window.ModalManager) {
            window.ModalManager.close();
        }
    }
}