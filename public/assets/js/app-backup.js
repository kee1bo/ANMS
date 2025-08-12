// Clean backup of essential modal functions
class ANMSApp {
    constructor() {
        this.currentUser = null;
        this.pets = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (document.querySelector('.dashboard-container')) {
            this.loadDashboardData();
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.closest('.nav-link').dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-overlay');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    // Modal Management
    showModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = '';
        }
    }

    // Clean Add Pet Modal
    showAddPet() {
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) {
            console.error('Modal body not found');
            return;
        }
        
        modalBody.innerHTML = `
            <div class="professional-modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-paw"></i>
                        <h2>Add New Pet</h2>
                    </div>
                    <button class="modal-close-btn" onclick="app.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body-scrollable">
                    <form id="add-pet-form" class="professional-pet-form" onsubmit="app.handleAddPet(event)">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label required">Pet Name</label>
                                <input type="text" name="name" class="form-input" required 
                                       placeholder="Enter your pet's name">
                                <div class="field-help">Choose a name you'll use regularly</div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label required">Species</label>
                                    <select name="species" class="form-select" required>
                                        <option value="">Select species</option>
                                        <option value="dog">🐕 Dog</option>
                                        <option value="cat">🐱 Cat</option>
                                        <option value="bird">🐦 Bird</option>
                                        <option value="rabbit">🐰 Rabbit</option>
                                        <option value="other">🐾 Other</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Breed</label>
                                    <input type="text" name="breed" class="form-input" 
                                           placeholder="e.g., Golden Retriever">
                                    <div class="field-help">Leave blank if mixed breed</div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Gender</label>
                                    <select name="gender" class="form-select">
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Age (years)</label>
                                    <input type="number" name="age" class="form-input" 
                                           step="0.1" min="0" placeholder="0.0">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label required">Weight (kg)</label>
                                    <input type="number" name="weight" class="form-input" required
                                           step="0.1" min="0.1" placeholder="0.0">
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Activity Level</label>
                                    <select name="activity_level" class="form-select">
                                        <option value="low">Low - Minimal exercise</option>
                                        <option value="medium" selected>Medium - Regular activity</option>
                                        <option value="high">High - Very active</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Notes</label>
                                <textarea name="notes" class="form-textarea" rows="3" 
                                          placeholder="Any additional information about your pet..."></textarea>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Add Pet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal();
    }

    async handleAddPet(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const petData = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim() !== '') {
                petData[key] = value;
            }
        }
        
        if (petData.age) petData.age = parseFloat(petData.age);
        if (petData.weight) petData.weight = parseFloat(petData.weight);

        try {
            const response = await fetch('/api/pets.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(petData)
            });

            const result = await response.json();

            if (result.success) {
                this.closeModal();
                await this.loadPets();
                this.showNotification('Pet added successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to add pet');
            }
        } catch (error) {
            console.error('Error adding pet:', error);
            this.showNotification('Failed to add pet: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease;
        `;
        
        if (type === 'error') {
            notification.style.background = '#ef4444';
        } else if (type === 'success') {
            notification.style.background = '#10b981';
        } else {
            notification.style.background = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Placeholder functions
    switchTab(tabName) { console.log('Switch tab:', tabName); }
    loadDashboardData() { console.log('Load dashboard data'); }
    loadPets() { console.log('Load pets'); }
}

// Global functions
function showAddPet() { if (window.app) window.app.showAddPet(); }
function closeModal() { if (window.app) window.app.closeModal(); }

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ANMSApp();
});