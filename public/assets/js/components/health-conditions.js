/**
 * Health Conditions Management Component
 * Comprehensive health condition tracking with autocomplete and timeline
 */
class HealthConditionsComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.petId = options.petId || null;
        this.conditions = [];
        this.commonConditions = [];
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadCommonConditions();
        if (this.petId) {
            this.loadHealthConditions();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="health-conditions-container">
                <!-- Header -->
                <div class="health-header">
                    <div class="header-title">
                        <h3><i class="fas fa-heartbeat"></i> Health Conditions</h3>
                        <span class="conditions-count" id="conditions-count">0 conditions</span>
                    </div>
                    <button class="btn btn-primary" onclick="healthConditions.showAddConditionModal()">
                        <i class="fas fa-plus"></i> Add Condition
                    </button>
                </div>

                <!-- Conditions List -->
                <div class="conditions-content">
                    <!-- Active Conditions -->
                    <div class="conditions-section">
                        <div class="section-header">
                            <h4><i class="fas fa-exclamation-triangle"></i> Active Conditions</h4>
                            <div class="section-actions">
                                <button class="btn btn-sm btn-outline" onclick="healthConditions.exportConditions()">
                                    <i class="fas fa-download"></i> Export
                                </button>
                            </div>
                        </div>
                        <div class="conditions-list" id="active-conditions">
                            <!-- Active conditions will be rendered here -->
                        </div>
                    </div>

                    <!-- Inactive/Resolved Conditions -->
                    <div class="conditions-section">
                        <div class="section-header">
                            <h4><i class="fas fa-check-circle"></i> Resolved Conditions</h4>
                            <button class="toggle-section-btn" onclick="healthConditions.toggleResolvedConditions()">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="conditions-list collapsed" id="resolved-conditions">
                            <!-- Resolved conditions will be rendered here -->
                        </div>
                    </div>

                    <!-- Health Timeline -->
                    <div class="conditions-section">
                        <div class="section-header">
                            <h4><i class="fas fa-history"></i> Health Timeline</h4>
                        </div>
                        <div class="health-timeline" id="health-timeline">
                            <!-- Timeline will be rendered here -->
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div class="loading-state" id="conditions-loading" style="display: none;">
                    <div class="spinner"></div>
                    <p>Loading health conditions...</p>
                </div>

                <!-- Empty State -->
                <div class="empty-state" id="conditions-empty" style="display: none;">
                    <div class="empty-icon">
                        <i class="fas fa-heartbeat"></i>
                    </div>
                    <h4>No Health Conditions</h4>
                    <p>Your pet has no recorded health conditions. Add one if needed.</p>
                    <button class="btn btn-primary" onclick="healthConditions.showAddConditionModal()">
                        <i class="fas fa-plus"></i> Add First Condition
                    </button>
                </div>
            </div>
        `;
    }    
attachEventListeners() {
        // Event listeners will be attached to dynamically created elements
    }

    async loadCommonConditions() {
        // Load common pet health conditions for autocomplete
        this.commonConditions = [
            // Dog conditions
            'Arthritis', 'Hip Dysplasia', 'Allergies', 'Diabetes', 'Heart Disease',
            'Kidney Disease', 'Liver Disease', 'Cancer', 'Epilepsy', 'Cataracts',
            'Dental Disease', 'Obesity', 'Skin Conditions', 'Ear Infections',
            'Urinary Tract Infection', 'Bloat', 'Pancreatitis', 'Hypothyroidism',
            
            // Cat conditions
            'Feline Lower Urinary Tract Disease', 'Chronic Kidney Disease',
            'Hyperthyroidism', 'Inflammatory Bowel Disease', 'Asthma',
            'Feline Immunodeficiency Virus', 'Feline Leukemia Virus',
            'Upper Respiratory Infection', 'Gingivitis', 'Hairballs',
            
            // General conditions
            'Parasites', 'Fleas', 'Ticks', 'Worms', 'Vaccination Reactions',
            'Food Allergies', 'Environmental Allergies', 'Anxiety', 'Stress',
            'Behavioral Issues', 'Vision Problems', 'Hearing Loss'
        ].sort();
    }

    async loadHealthConditions() {
        if (!this.petId) return;
        
        try {
            this.showLoading();
            
            const response = await fetch(`/api/health-conditions.php?pet_id=${this.petId}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.conditions = data.conditions || [];
                this.displayConditions();
            } else {
                throw new Error(data.error || 'Failed to load health conditions');
            }
        } catch (error) {
            console.error('Error loading health conditions:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayConditions() {
        const activeConditions = this.conditions.filter(c => c.status === 'active');
        const resolvedConditions = this.conditions.filter(c => c.status === 'resolved');
        
        this.renderActiveConditions(activeConditions);
        this.renderResolvedConditions(resolvedConditions);
        this.renderHealthTimeline();
        this.updateConditionsCount();
        
        // Show appropriate state
        if (this.conditions.length === 0) {
            this.showEmptyState();
        } else {
            this.showConditionsContent();
        }
    }

    renderActiveConditions(conditions) {
        const container = document.getElementById('active-conditions');
        
        if (conditions.length === 0) {
            container.innerHTML = `
                <div class="no-conditions">
                    <i class="fas fa-check-circle"></i>
                    <p>No active health conditions</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = conditions.map(condition => this.renderConditionCard(condition)).join('');
    }

    renderResolvedConditions(conditions) {
        const container = document.getElementById('resolved-conditions');
        
        if (conditions.length === 0) {
            container.innerHTML = `
                <div class="no-conditions">
                    <p>No resolved conditions</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = conditions.map(condition => this.renderConditionCard(condition)).join('');
    }

    renderConditionCard(condition) {
        const severityClass = `severity-${condition.severity}`;
        const statusClass = `status-${condition.status}`;
        
        return `
            <div class="condition-card ${statusClass}" data-condition-id="${condition.id}">
                <div class="condition-header">
                    <div class="condition-title">
                        <h5>${condition.condition_name}</h5>
                        <span class="severity-badge ${severityClass}">${condition.severity}</span>
                    </div>
                    <div class="condition-actions">
                        <button class="action-btn" onclick="healthConditions.editCondition(${condition.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="healthConditions.toggleConditionStatus(${condition.id})" 
                                title="${condition.status === 'active' ? 'Mark as Resolved' : 'Mark as Active'}">
                            <i class="fas fa-${condition.status === 'active' ? 'check' : 'undo'}"></i>
                        </button>
                        <button class="action-btn danger" onclick="healthConditions.deleteCondition(${condition.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="condition-details">
                    ${condition.diagnosis_date ? `
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>Diagnosed: ${this.formatDate(condition.diagnosis_date)}</span>
                        </div>
                    ` : ''}
                    
                    ${condition.notes ? `
                        <div class="detail-item">
                            <i class="fas fa-sticky-note"></i>
                            <span>${condition.notes}</span>
                        </div>
                    ` : ''}
                    
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>Last updated: ${this.formatDate(condition.updated_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderHealthTimeline() {
        const container = document.getElementById('health-timeline');
        
        // Sort conditions by date for timeline
        const timelineEvents = [...this.conditions]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10); // Show last 10 events
        
        if (timelineEvents.length === 0) {
            container.innerHTML = `
                <div class="timeline-empty">
                    <p>No health events recorded</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = timelineEvents.map(event => `
            <div class="timeline-item">
                <div class="timeline-marker ${event.status}">
                    <i class="fas fa-${event.status === 'active' ? 'plus' : 'check'}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h6>${event.condition_name}</h6>
                        <span class="timeline-date">${this.formatDate(event.created_at)}</span>
                    </div>
                    <p class="timeline-description">
                        ${event.status === 'active' ? 'Condition diagnosed' : 'Condition resolved'}
                        ${event.severity ? ` - ${event.severity} severity` : ''}
                    </p>
                </div>
            </div>
        `).join('');
    }

    showAddConditionModal() {
        const modal = this.createModal('Add Health Condition', this.renderAddConditionForm());
        document.body.appendChild(modal);
    }

    renderAddConditionForm() {
        return `
            <form id="add-condition-form" class="condition-form">
                <div class="form-group">
                    <label class="form-label required">Condition Name</label>
                    <input type="text" name="condition_name" class="form-input" required 
                           placeholder="Start typing condition name..." 
                           list="condition-suggestions" autocomplete="off">
                    <datalist id="condition-suggestions">
                        ${this.commonConditions.map(condition => 
                            `<option value="${condition}">`
                        ).join('')}
                    </datalist>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Severity</label>
                        <select name="severity" class="form-select" required>
                            <option value="">Select severity</option>
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Diagnosis Date</label>
                        <input type="date" name="diagnosis_date" class="form-input">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" rows="3" 
                              placeholder="Additional notes about the condition, treatment, or symptoms..."></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="healthConditions.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Condition
                    </button>
                </div>
            </form>
        `;
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h4>${title}</h4>
                    <button class="modal-close" onclick="healthConditions.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        const addForm = modal.querySelector('#add-condition-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddCondition(e);
            });
        }
        
        const editForm = modal.querySelector('#edit-condition-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditCondition(e);
            });
        }
        
        return modal;
    }

    async handleAddCondition(event) {
        const formData = new FormData(event.target);
        const conditionData = {
            pet_id: this.petId,
            condition_name: formData.get('condition_name'),
            severity: formData.get('severity'),
            diagnosis_date: formData.get('diagnosis_date') || null,
            notes: formData.get('notes') || null,
            status: 'active'
        };
        
        try {
            const response = await fetch('/api/health-conditions.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(conditionData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadHealthConditions();
                this.showMessage('Health condition added successfully!', 'success');
                
                // Trigger dashboard update if dashboard is available
                this.triggerDashboardUpdate();
            } else {
                throw new Error(data.error || 'Failed to add condition');
            }
        } catch (error) {
            console.error('Error adding condition:', error);
            this.showMessage('Failed to add condition: ' + error.message, 'error');
        }
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    updateConditionsCount() {
        const countEl = document.getElementById('conditions-count');
        const activeCount = this.conditions.filter(c => c.status === 'active').length;
        countEl.textContent = `${activeCount} active condition${activeCount !== 1 ? 's' : ''}`;
    }

    showLoading() {
        document.getElementById('conditions-loading').style.display = 'block';
        document.querySelector('.conditions-content').style.display = 'none';
        document.getElementById('conditions-empty').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('conditions-loading').style.display = 'none';
    }

    showConditionsContent() {
        document.querySelector('.conditions-content').style.display = 'block';
        document.getElementById('conditions-empty').style.display = 'none';
    }

    showEmptyState() {
        document.querySelector('.conditions-content').style.display = 'none';
        document.getElementById('conditions-empty').style.display = 'block';
    }

    showError(message) {
        this.showMessage('Error: ' + message, 'error');
    }

    showMessage(message, type = 'info') {
        // Simple message display - in a real app you might use a toast library
        alert(message);
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    toggleResolvedConditions() {
        const container = document.getElementById('resolved-conditions');
        const button = document.querySelector('.toggle-section-btn i');
        
        container.classList.toggle('collapsed');
        button.classList.toggle('fa-chevron-down');
        button.classList.toggle('fa-chevron-up');
    }

    async editCondition(conditionId) {
        const condition = this.conditions.find(c => c.id == conditionId);
        if (!condition) return;
        
        const modal = this.createModal('Edit Health Condition', this.renderEditConditionForm(condition));
        document.body.appendChild(modal);
    }

    renderEditConditionForm(condition) {
        return `
            <form id="edit-condition-form" class="condition-form">
                <input type="hidden" name="condition_id" value="${condition.id}">
                
                <div class="form-group">
                    <label class="form-label required">Condition Name</label>
                    <input type="text" name="condition_name" class="form-input" required 
                           value="${condition.condition_name}" 
                           list="condition-suggestions" autocomplete="off">
                    <datalist id="condition-suggestions">
                        ${this.commonConditions.map(cond => 
                            `<option value="${cond}">`
                        ).join('')}
                    </datalist>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Severity</label>
                        <select name="severity" class="form-select" required>
                            <option value="">Select severity</option>
                            <option value="mild" ${condition.severity === 'mild' ? 'selected' : ''}>Mild</option>
                            <option value="moderate" ${condition.severity === 'moderate' ? 'selected' : ''}>Moderate</option>
                            <option value="severe" ${condition.severity === 'severe' ? 'selected' : ''}>Severe</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Diagnosis Date</label>
                        <input type="date" name="diagnosis_date" class="form-input" 
                               value="${condition.diagnosis_date || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-select">
                        <option value="active" ${condition.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="resolved" ${condition.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea name="notes" class="form-textarea" rows="3" 
                              placeholder="Additional notes about the condition, treatment, or symptoms...">${condition.notes || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="healthConditions.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Condition
                    </button>
                </div>
            </form>
        `;
    }

    async handleEditCondition(event) {
        const formData = new FormData(event.target);
        const conditionData = {
            condition_id: formData.get('condition_id'),
            condition_name: formData.get('condition_name'),
            severity: formData.get('severity'),
            diagnosis_date: formData.get('diagnosis_date') || null,
            notes: formData.get('notes') || null,
            status: formData.get('status')
        };
        
        try {
            const response = await fetch('/api/health-conditions.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(conditionData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadHealthConditions();
                this.showMessage('Health condition updated successfully!', 'success');
                this.triggerDashboardUpdate();
            } else {
                throw new Error(data.error || 'Failed to update condition');
            }
        } catch (error) {
            console.error('Error updating condition:', error);
            this.showMessage('Failed to update condition: ' + error.message, 'error');
        }
    }

    async toggleConditionStatus(conditionId) {
        const condition = this.conditions.find(c => c.id == conditionId);
        if (!condition) return;
        
        const newStatus = condition.status === 'active' ? 'resolved' : 'active';
        const actionText = newStatus === 'resolved' ? 'resolve' : 'reactivate';
        
        if (!confirm(`Are you sure you want to ${actionText} this condition?`)) {
            return;
        }
        
        try {
            const response = await fetch('/api/health-conditions.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    condition_id: conditionId,
                    status: newStatus
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadHealthConditions();
                this.showMessage(`Condition ${actionText}d successfully!`, 'success');
                this.triggerDashboardUpdate();
            } else {
                throw new Error(data.error || `Failed to ${actionText} condition`);
            }
        } catch (error) {
            console.error(`Error ${actionText}ing condition:`, error);
            this.showMessage(`Failed to ${actionText} condition: ` + error.message, 'error');
        }
    }

    async deleteCondition(conditionId) {
        const condition = this.conditions.find(c => c.id == conditionId);
        if (!condition) return;
        
        if (!confirm(`Are you sure you want to delete the condition "${condition.condition_name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch('/api/health-conditions.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    condition_id: conditionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadHealthConditions();
                this.showMessage('Health condition deleted successfully!', 'success');
                this.triggerDashboardUpdate();
            } else {
                throw new Error(data.error || 'Failed to delete condition');
            }
        } catch (error) {
            console.error('Error deleting condition:', error);
            this.showMessage('Failed to delete condition: ' + error.message, 'error');
        }
    }

    exportConditions() {
        if (this.conditions.length === 0) {
            this.showMessage('No conditions to export', 'info');
            return;
        }
        
        const csvContent = this.generateConditionsCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-conditions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    generateConditionsCSV() {
        const headers = ['Condition Name', 'Severity', 'Status', 'Diagnosis Date', 'Notes', 'Created Date'];
        const rows = this.conditions.map(condition => [
            condition.condition_name,
            condition.severity,
            condition.status,
            condition.diagnosis_date || '',
            (condition.notes || '').replace(/"/g, '""'),
            condition.created_at
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    // Dashboard integration methods
    triggerDashboardUpdate() {
        try {
            // Trigger dashboard statistics update if dashboard is available
            if (window.dashboardStatistics && typeof window.dashboardStatistics.refreshStatistics === 'function') {
                window.dashboardStatistics.refreshStatistics();
            }
            
            // Trigger activity feed update if available
            if (window.activityFeed && typeof window.activityFeed.refreshActivities === 'function') {
                window.activityFeed.refreshActivities();
            }
            
            // Trigger health metrics update if available
            if (window.healthMetrics && typeof window.healthMetrics.refreshMetrics === 'function') {
                window.healthMetrics.refreshMetrics();
            }
            
            // Dispatch custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('healthRecordUpdated', {
                detail: {
                    petId: this.petId,
                    timestamp: new Date().toISOString()
                }
            }));
            
        } catch (error) {
            console.warn('Failed to trigger dashboard update:', error);
        }
    }

    // Public methods for external use
    setPetId(petId) {
        this.petId = petId;
        this.loadHealthConditions();
    }

    refresh() {
        return this.loadHealthConditions();
    }
}

// Initialize global health conditions instance
let healthConditions;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('health-conditions-container')) {
        healthConditions = new HealthConditionsComponent('health-conditions-container');
    }
});