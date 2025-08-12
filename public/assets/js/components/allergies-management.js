/**
 * Allergies Management Component
 * Comprehensive allergy tracking with severity indicators and alerts
 */
class AllergiesManagementComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.petId = options.petId || null;
        this.allergies = [];
        this.commonAllergens = [];
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadCommonAllergens();
        if (this.petId) {
            this.loadAllergies();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="allergies-container">
                <!-- Header -->
                <div class="allergies-header">
                    <div class="header-title">
                        <h3><i class="fas fa-exclamation-triangle"></i> Allergies & Sensitivities</h3>
                        <span class="allergies-count" id="allergies-count">0 allergies</span>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-outline btn-sm" onclick="allergiesManager.exportAllergies()">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="btn btn-primary" onclick="allergiesManager.showAddAllergyModal()">
                            <i class="fas fa-plus"></i> Add Allergy
                        </button>
                    </div>
                </div>

                <!-- Allergy Alerts -->
                <div class="allergy-alerts" id="allergy-alerts" style="display: none;">
                    <div class="alert alert-warning">
                        <div class="alert-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="alert-content">
                            <h4>Severe Allergies Detected</h4>
                            <p>This pet has severe allergies. Please inform all caregivers and veterinarians.</p>
                        </div>
                    </div>
                </div>

                <!-- Allergies by Category -->
                <div class="allergies-content">
                    <!-- Food Allergies -->
                    <div class="allergy-category">
                        <div class="category-header">
                            <h4><i class="fas fa-utensils"></i> Food Allergies</h4>
                            <span class="category-count" id="food-count">0</span>
                        </div>
                        <div class="allergies-list" id="food-allergies">
                            <!-- Food allergies will be rendered here -->
                        </div>
                    </div>

                    <!-- Environmental Allergies -->
                    <div class="allergy-category">
                        <div class="category-header">
                            <h4><i class="fas fa-leaf"></i> Environmental Allergies</h4>
                            <span class="category-count" id="environmental-count">0</span>
                        </div>
                        <div class="allergies-list" id="environmental-allergies">
                            <!-- Environmental allergies will be rendered here -->
                        </div>
                    </div>

                    <!-- Medication Allergies -->
                    <div class="allergy-category">
                        <div class="category-header">
                            <h4><i class="fas fa-pills"></i> Medication Allergies</h4>
                            <span class="category-count" id="medication-count">0</span>
                        </div>
                        <div class="allergies-list" id="medication-allergies">
                            <!-- Medication allergies will be rendered here -->
                        </div>
                    </div>

                    <!-- Other Allergies -->
                    <div class="allergy-category">
                        <div class="category-header">
                            <h4><i class="fas fa-question-circle"></i> Other Allergies</h4>
                            <span class="category-count" id="other-count">0</span>
                        </div>
                        <div class="allergies-list" id="other-allergies">
                            <!-- Other allergies will be rendered here -->
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div class="loading-state" id="allergies-loading" style="display: none;">
                    <div class="spinner"></div>
                    <p>Loading allergies...</p>
                </div>

                <!-- Empty State -->
                <div class="empty-state" id="allergies-empty" style="display: none;">
                    <div class="empty-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h4>No Known Allergies</h4>
                    <p>Great! This pet has no recorded allergies or sensitivities.</p>
                    <button class="btn btn-primary" onclick="allergiesManager.showAddAllergyModal()">
                        <i class="fas fa-plus"></i> Add Allergy (if needed)
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Event listeners will be attached to dynamically created elements
    }

    async loadCommonAllergens() {
        this.commonAllergens = {
            food: [
                'Chicken', 'Beef', 'Pork', 'Lamb', 'Fish', 'Salmon', 'Tuna',
                'Dairy', 'Milk', 'Cheese', 'Eggs', 'Wheat', 'Corn', 'Soy',
                'Rice', 'Potatoes', 'Carrots', 'Peas', 'Tomatoes', 'Onions',
                'Garlic', 'Chocolate', 'Grapes', 'Raisins', 'Nuts', 'Peanuts'
            ],
            environmental: [
                'Pollen', 'Grass', 'Trees', 'Weeds', 'Dust Mites', 'Mold',
                'Cigarette Smoke', 'Perfumes', 'Cleaning Products', 'Fabrics',
                'Wool', 'Cotton', 'Synthetic Materials', 'Flea Saliva',
                'Other Insects', 'Seasonal Allergens'
            ],
            medication: [
                'Penicillin', 'Antibiotics', 'Vaccines', 'Flea Treatments',
                'Heartworm Prevention', 'Pain Medications', 'Steroids',
                'Anesthetics', 'Topical Treatments', 'Shampoos'
            ],
            other: [
                'Latex', 'Metals', 'Plastics', 'Rubber', 'Dyes', 'Preservatives',
                'Contact Allergens', 'Unknown Allergens'
            ]
        };
    }

    async loadAllergies() {
        if (!this.petId) return;
        
        try {
            this.showLoading();
            
            const response = await fetch(`/api/allergies.php?pet_id=${this.petId}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.allergies = data.allergies || [];
                this.displayAllergies();
            } else {
                throw new Error(data.error || 'Failed to load allergies');
            }
        } catch (error) {
            console.error('Error loading allergies:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayAllergies() {
        // Group allergies by category
        const categorized = {
            food: this.allergies.filter(a => a.category === 'food'),
            environmental: this.allergies.filter(a => a.category === 'environmental'),
            medication: this.allergies.filter(a => a.category === 'medication'),
            other: this.allergies.filter(a => a.category === 'other')
        };
        
        // Render each category
        Object.keys(categorized).forEach(category => {
            this.renderAllergyCategory(category, categorized[category]);
        });
        
        this.updateAllergyCounts(categorized);
        this.checkForSevereAllergies();
        
        // Show appropriate state
        if (this.allergies.length === 0) {
            this.showEmptyState();
        } else {
            this.showAllergiesContent();
        }
    }

    renderAllergyCategory(category, allergies) {
        const container = document.getElementById(`${category}-allergies`);
        
        if (allergies.length === 0) {
            container.innerHTML = `
                <div class="no-allergies">
                    <p>No ${category} allergies recorded</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = allergies.map(allergy => this.renderAllergyCard(allergy)).join('');
    }

    renderAllergyCard(allergy) {
        const severityClass = `severity-${allergy.severity}`;
        
        return `
            <div class="allergy-card ${severityClass}" data-allergy-id="${allergy.id}">
                <div class="allergy-header">
                    <div class="allergy-title">
                        <h5>${allergy.allergen}</h5>
                        <span class="severity-badge ${severityClass}">${allergy.severity}</span>
                    </div>
                    <div class="allergy-actions">
                        <button class="action-btn" onclick="allergiesManager.editAllergy(${allergy.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn danger" onclick="allergiesManager.deleteAllergy(${allergy.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="allergy-details">
                    ${allergy.reaction_type ? `
                        <div class="detail-item">
                            <i class="fas fa-exclamation"></i>
                            <span><strong>Reaction:</strong> ${allergy.reaction_type}</span>
                        </div>
                    ` : ''}
                    
                    ${allergy.symptoms ? `
                        <div class="detail-item">
                            <i class="fas fa-list"></i>
                            <span><strong>Symptoms:</strong> ${allergy.symptoms}</span>
                        </div>
                    ` : ''}
                    
                    ${allergy.treatment ? `
                        <div class="detail-item">
                            <i class="fas fa-medkit"></i>
                            <span><strong>Treatment:</strong> ${allergy.treatment}</span>
                        </div>
                    ` : ''}
                    
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>Added: ${this.formatDate(allergy.created_at)}</span>
                    </div>
                </div>
                
                ${allergy.severity === 'severe' ? `
                    <div class="severe-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>SEVERE ALLERGY - Avoid at all costs!</strong>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateAllergyCounts(categorized) {
        document.getElementById('allergies-count').textContent = 
            `${this.allergies.length} allerg${this.allergies.length !== 1 ? 'ies' : 'y'}`;
        
        Object.keys(categorized).forEach(category => {
            const count = categorized[category].length;
            document.getElementById(`${category}-count`).textContent = count;
        });
    }

    checkForSevereAllergies() {
        const severeAllergies = this.allergies.filter(a => a.severity === 'severe');
        const alertsContainer = document.getElementById('allergy-alerts');
        
        if (severeAllergies.length > 0) {
            alertsContainer.style.display = 'block';
        } else {
            alertsContainer.style.display = 'none';
        }
    }

    showAddAllergyModal() {
        const modal = this.createModal('Add New Allergy', this.renderAddAllergyForm());
        document.body.appendChild(modal);
    }

    renderAddAllergyForm() {
        return `
            <form id="add-allergy-form" class="allergy-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Category</label>
                        <select name="category" class="form-select" required onchange="allergiesManager.updateAllergenSuggestions(this.value)">
                            <option value="">Select category</option>
                            <option value="food">Food Allergy</option>
                            <option value="environmental">Environmental Allergy</option>
                            <option value="medication">Medication Allergy</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required">Severity</label>
                        <select name="severity" class="form-select" required>
                            <option value="">Select severity</option>
                            <option value="mild">Mild - Minor discomfort</option>
                            <option value="moderate">Moderate - Noticeable symptoms</option>
                            <option value="severe">Severe - Dangerous reaction</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Allergen</label>
                    <input type="text" name="allergen" class="form-input" required 
                           placeholder="Enter allergen name..." 
                           list="allergen-suggestions" autocomplete="off">
                    <datalist id="allergen-suggestions"></datalist>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Reaction Type</label>
                    <select name="reaction_type" class="form-select">
                        <option value="">Select reaction type</option>
                        <option value="skin">Skin Reaction (itching, rash, hives)</option>
                        <option value="digestive">Digestive Issues (vomiting, diarrhea)</option>
                        <option value="respiratory">Respiratory (coughing, wheezing)</option>
                        <option value="behavioral">Behavioral Changes</option>
                        <option value="systemic">Systemic/Anaphylactic</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Symptoms</label>
                    <textarea name="symptoms" class="form-textarea" rows="2" 
                              placeholder="Describe specific symptoms observed..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Treatment/Management</label>
                    <textarea name="treatment" class="form-textarea" rows="2" 
                              placeholder="How is this allergy managed or treated?"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="allergiesManager.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Allergy
                    </button>
                </div>
            </form>
        `;
    }

    updateAllergenSuggestions(category) {
        const datalist = document.getElementById('allergen-suggestions');
        const allergens = this.commonAllergens[category] || [];
        
        datalist.innerHTML = allergens.map(allergen => `<option value="${allergen}">`).join('');
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h4>${title}</h4>
                    <button class="modal-close" onclick="allergiesManager.closeModal()">
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
        
        const addForm = modal.querySelector('#add-allergy-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddAllergy(e);
            });
        }
        
        const editForm = modal.querySelector('#edit-allergy-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditAllergy(e);
            });
            
            // Initialize allergen suggestions for the selected category
            const categorySelect = editForm.querySelector('[name="category"]');
            if (categorySelect && categorySelect.value) {
                this.updateAllergenSuggestions(categorySelect.value);
            }
        }
        
        return modal;
    }

    async handleAddAllergy(event) {
        const formData = new FormData(event.target);
        const allergyData = {
            pet_id: this.petId,
            category: formData.get('category'),
            allergen: formData.get('allergen'),
            severity: formData.get('severity'),
            reaction_type: formData.get('reaction_type') || null,
            symptoms: formData.get('symptoms') || null,
            treatment: formData.get('treatment') || null
        };
        
        try {
            const response = await fetch('/api/allergies.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(allergyData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadAllergies();
                this.showMessage('Allergy added successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to add allergy');
            }
        } catch (error) {
            console.error('Error adding allergy:', error);
            this.showMessage('Failed to add allergy: ' + error.message, 'error');
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

    showLoading() {
        document.getElementById('allergies-loading').style.display = 'block';
        document.querySelector('.allergies-content').style.display = 'none';
        document.getElementById('allergies-empty').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('allergies-loading').style.display = 'none';
    }

    showAllergiesContent() {
        document.querySelector('.allergies-content').style.display = 'block';
        document.getElementById('allergies-empty').style.display = 'none';
    }

    showEmptyState() {
        document.querySelector('.allergies-content').style.display = 'none';
        document.getElementById('allergies-empty').style.display = 'block';
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

    async editAllergy(allergyId) {
        const allergy = this.allergies.find(a => a.id === allergyId);
        if (!allergy) {
            this.showMessage('Allergy not found', 'error');
            return;
        }
        
        const modal = this.createModal('Edit Allergy', this.renderEditAllergyForm(allergy));
        document.body.appendChild(modal);
    }

    renderEditAllergyForm(allergy) {
        return `
            <form id="edit-allergy-form" class="allergy-form">
                <input type="hidden" name="allergy_id" value="${allergy.id}">
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label required">Category</label>
                        <select name="category" class="form-select" required onchange="allergiesManager.updateAllergenSuggestions(this.value)">
                            <option value="">Select category</option>
                            <option value="food" ${allergy.category === 'food' ? 'selected' : ''}>Food Allergy</option>
                            <option value="environmental" ${allergy.category === 'environmental' ? 'selected' : ''}>Environmental Allergy</option>
                            <option value="medication" ${allergy.category === 'medication' ? 'selected' : ''}>Medication Allergy</option>
                            <option value="other" ${allergy.category === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label required">Severity</label>
                        <select name="severity" class="form-select" required>
                            <option value="">Select severity</option>
                            <option value="mild" ${allergy.severity === 'mild' ? 'selected' : ''}>Mild - Minor discomfort</option>
                            <option value="moderate" ${allergy.severity === 'moderate' ? 'selected' : ''}>Moderate - Noticeable symptoms</option>
                            <option value="severe" ${allergy.severity === 'severe' ? 'selected' : ''}>Severe - Dangerous reaction</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Allergen</label>
                    <input type="text" name="allergen" class="form-input" required 
                           value="${allergy.allergen}" placeholder="Enter allergen name..." 
                           list="allergen-suggestions" autocomplete="off">
                    <datalist id="allergen-suggestions"></datalist>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Reaction Type</label>
                    <select name="reaction_type" class="form-select">
                        <option value="">Select reaction type</option>
                        <option value="skin" ${allergy.reaction_type === 'skin' ? 'selected' : ''}>Skin Reaction (itching, rash, hives)</option>
                        <option value="digestive" ${allergy.reaction_type === 'digestive' ? 'selected' : ''}>Digestive Issues (vomiting, diarrhea)</option>
                        <option value="respiratory" ${allergy.reaction_type === 'respiratory' ? 'selected' : ''}>Respiratory (coughing, wheezing)</option>
                        <option value="behavioral" ${allergy.reaction_type === 'behavioral' ? 'selected' : ''}>Behavioral Changes</option>
                        <option value="systemic" ${allergy.reaction_type === 'systemic' ? 'selected' : ''}>Systemic/Anaphylactic</option>
                        <option value="other" ${allergy.reaction_type === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Symptoms</label>
                    <textarea name="symptoms" class="form-textarea" rows="2" 
                              placeholder="Describe specific symptoms observed...">${allergy.symptoms || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Treatment/Management</label>
                    <textarea name="treatment" class="form-textarea" rows="2" 
                              placeholder="How is this allergy managed or treated?">${allergy.treatment || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="allergiesManager.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Update Allergy
                    </button>
                </div>
            </form>
        `;
    }

    async handleEditAllergy(event) {
        const formData = new FormData(event.target);
        const allergyId = formData.get('allergy_id');
        const allergyData = {
            category: formData.get('category'),
            allergen: formData.get('allergen'),
            severity: formData.get('severity'),
            reaction_type: formData.get('reaction_type') || null,
            symptoms: formData.get('symptoms') || null,
            treatment: formData.get('treatment') || null
        };
        
        try {
            const response = await fetch(`/api/allergies.php?id=${allergyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(allergyData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeModal();
                await this.loadAllergies();
                this.showMessage('Allergy updated successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to update allergy');
            }
        } catch (error) {
            console.error('Error updating allergy:', error);
            this.showMessage('Failed to update allergy: ' + error.message, 'error');
        }
    }

    async deleteAllergy(allergyId) {
        const allergy = this.allergies.find(a => a.id === allergyId);
        if (!allergy) {
            this.showMessage('Allergy not found', 'error');
            return;
        }
        
        const confirmMessage = `Are you sure you want to delete the ${allergy.allergen} allergy?\\n\\nThis action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/allergies.php?id=${allergyId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadAllergies();
                this.showMessage('Allergy deleted successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to delete allergy');
            }
        } catch (error) {
            console.error('Error deleting allergy:', error);
            this.showMessage('Failed to delete allergy: ' + error.message, 'error');
        }
    }

    exportAllergies() {
        if (this.allergies.length === 0) {
            alert('No allergies to export');
            return;
        }

        // Create CSV content
        const headers = ['Category', 'Allergen', 'Severity', 'Reaction Type', 'Symptoms', 'Treatment', 'Date Added'];
        const csvContent = [
            headers.join(','),
            ...this.allergies.map(allergy => [
                allergy.category,
                allergy.allergen,
                allergy.severity,
                allergy.reaction_type || '',
                allergy.symptoms || '',
                allergy.treatment || '',
                this.formatDate(allergy.created_at)
            ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pet-allergies-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Public methods for external use
    setPetId(petId) {
        this.petId = petId;
        this.loadAllergies();
    }

    refresh() {
        return this.loadAllergies();
    }
}

// Initialize global allergies manager instance
let allergiesManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('allergies-container')) {
        allergiesManager = new AllergiesManagementComponent('allergies-container');
    }
});