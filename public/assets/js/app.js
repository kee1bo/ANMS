// Clean backup of essential modal functions
class ANMSApp {
    constructor() {
        this.currentUser = null;
        this.pets = [];
        this.currentPetsFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (document.querySelector('.dashboard-container')) {
            this.loadDashboardData();
        }
    }

    setupEventListeners() {
        // Modal click-outside listener
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-overlay');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Sidebar navigation links → switch tabs
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link, .dashboard-sidebar .nav-link');
        navLinks.forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const tabName = link.getAttribute('data-tab');
                if (tabName) {
                    this.switchToTab(tabName);
                }
            });
        });

        // Pets filters (if present)
        this.attachPetsTabListeners();
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
        
        // Notify quick actions that modal was closed
        document.dispatchEvent(new CustomEvent('modalClosed'));
    }

    // Clean Add Pet Modal
    showAddPet() {
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) {
            console.error('Modal body not found');
            return;
        }
        
        modalBody.innerHTML = `
            <div class="professional-modal-content professional-modal--wide">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-paw"></i>
                        <h2>Add New Pet</h2>
                    </div>
                    <button class="modal-close-btn" onclick="app.closeModal()"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="modal-body-scrollable">
                    <form id="add-pet-form" class="professional-pet-form" onsubmit="app.handleAddPet(event)">
                        <div class="sections-grid">
                        <!-- Basic Information -->
                        <div class="section-block">
                            <div class="section-title"><span class="section-accent"></span>Basic Information</div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label required">Pet Name</label>
                                    <input type="text" name="name" class="form-input" required placeholder="Enter your pet's name">
                                <div class="field-help">Choose a name you'll use regularly</div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Gender</label>
                                    <select name="gender" class="form-select">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Species</label>
                                    <select name="species" class="form-select" required>
                                        <option value="">Select Species</option>
                                        <option value="dog">Dog</option>
                                        <option value="cat">Cat</option>
                                        <option value="bird">Bird</option>
                                        <option value="rabbit">Rabbit</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Breed</label>
                                    <input type="text" name="breed" class="form-input" placeholder="e.g., Golden Retriever">
                                </div>
                            </div>
                                </div>
                                
                        <!-- Physical Information -->
                        <div class="section-block">
                            <div class="section-title"><span class="section-accent"></span>Physical Information</div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Age (years)</label>
                                    <input type="number" name="age" class="form-input" step="0.1" min="0" placeholder="0.0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Current Weight (kg)</label>
                                    <input type="number" name="weight" class="form-input" required step="0.1" min="0.1" placeholder="0.0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Ideal Weight (kg)</label>
                                    <input type="number" name="ideal_weight" class="form-input" step="0.1" min="0.1" placeholder="Optional">
                            </div>
                                <div class="form-group">
                                    <label class="form-label">Body Condition Score (1-9)</label>
                                    <select name="body_condition_score" class="form-select">
                                        <option value="">Select Score</option>
                                        ${Array.from({length:9}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                                </div>
                                
                        <!-- Activity & Health -->
                        <div class="section-block section--full">
                            <div class="section-title"><span class="section-accent"></span>Activity & Health</div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Activity Level</label>
                                    <select name="activity_level" class="form-select">
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Spay/Neuter Status</label>
                                    <select name="spay_neuter_status" class="form-select">
                                        <option value="">Select Status</option>
                                        <option value="spayed">Spayed</option>
                                        <option value="neutered">Neutered</option>
                                        <option value="intact">Intact</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                            </div>
                                <div class="form-group form-group--full">
                                <label class="form-label">Notes</label>
                                    <textarea name="personality" class="form-textarea" rows="3" placeholder="Any additional information about your pet..."></textarea>
                                </div>
                            </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Add Pet</button>
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
        
        if (petData.age) {
            petData.age = parseFloat(petData.age);
            // Convert provided age to a birth_date for backend persistence
            try {
                const now = new Date();
                const birth = new Date(now.getFullYear() - Math.floor(petData.age), now.getMonth(), now.getDate());
                const yyyy = birth.getFullYear();
                const mm = String(birth.getMonth() + 1).padStart(2, '0');
                const dd = String(birth.getDate()).padStart(2, '0');
                petData.birth_date = `${yyyy}-${mm}-${dd}`;
            } catch (_) {}
        }
        if (petData.weight) petData.weight = parseFloat(petData.weight);
        if (petData.ideal_weight) petData.ideal_weight = parseFloat(petData.ideal_weight);
        if (petData.body_condition_score) petData.body_condition_score = parseInt(petData.body_condition_score, 10);

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
                
                // Dispatch event for dashboard statistics to refresh
                document.dispatchEvent(new CustomEvent('petAdded', {
                    detail: { pet: result.pet }
                }));
                
                // Log activity for dashboard
                this.logActivity('pet_added', {
                    pet_id: result.pet.id,
                    pet_name: result.pet.name,
                    description: `Added new pet: ${result.pet.name}`
                });
                
                return result; // Return result for quick actions integration
            } else {
                throw new Error(result.error || 'Failed to add pet');
            }
        } catch (error) {
            console.error('Error adding pet:', error);
            this.showNotification('Failed to add pet: ' + error.message, 'error');
            throw error; // Re-throw for quick actions error handling
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
    
    /**
     * Log activity for dashboard activity feed
     */
    async logActivity(type, data) {
        try {
            const activityData = {
                type: type,
                description: data.description,
                pet_id: data.pet_id || null,
                metadata: data.metadata || {}
            };
            
            const response = await fetch('/api/dashboard.php?action=log_activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(activityData)
            });
            
            if (response.ok) {
                // Dispatch event for activity feed to refresh
                document.dispatchEvent(new CustomEvent('activityLogged', {
                    detail: { activity: activityData }
                }));
            }
        } catch (error) {
            console.warn('Failed to log activity:', error);
            // Don't throw - activity logging is not critical
        }
    }

    // Tab Management
    switchToTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Update page title
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Here\'s what\'s happening with your pets.' },
            pets: { title: 'My Pets', subtitle: 'Manage your pet profiles and information.' },
            nutrition: { title: 'Nutrition Plans', subtitle: 'Create and manage custom nutrition plans for your pets.' },
            health: { title: 'Health Records', subtitle: 'Track your pets\' health data and medical records.' }
        };
        
        const titleData = titles[tabName] || titles.dashboard;
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        
        if (pageTitle) pageTitle.textContent = titleData.title;
        if (pageSubtitle) pageSubtitle.textContent = titleData.subtitle;
    }

    // Data loading
    async loadDashboardData() {
        try {
            await this.loadPets();

            // The dashboard statistics component will handle loading stats automatically
            // We just need to load recent activity here
            const response = await fetch('/api/dashboard.php?action=activities', { credentials: 'same-origin' });
            if (response.ok) {
                const data = await response.json();
                if (data && data.success && Array.isArray(data.activities)) {
                    this.updateRecentActivity(data.activities);
                }
            }
        } catch (e) {
            console.warn('Dashboard load warning:', e);
        }
    }

    updateDashboardCards(stats) {
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(text);
        };

        setText('total-pets', stats.total_pets ?? 0);
        setText('meals-today', stats.meals_today ?? 0);
        const healthScoreEl = document.getElementById('health-score');
        if (healthScoreEl && typeof stats.health_score !== 'undefined') {
            healthScoreEl.textContent = `${stats.health_score}%`;
        }
        setText('next-checkup', stats.next_checkup ?? 0);
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        if (!activities || activities.length === 0) return;
        container.innerHTML = activities.map(a => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${a.icon || 'fas fa-info-circle'}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${a.description || ''}</div>
                    <div class="activity-time">${a.time_ago || ''}</div>
                </div>
            </div>
        `).join('');
    }

    async loadPets() {
        try {
            const response = await fetch('/api/pets.php', { credentials: 'same-origin' });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to load pets');

            const pets = result.pets || [];
            this.pets = pets;

            // Update count badge
            const countEl = document.getElementById('pets-count');
            if (countEl) countEl.textContent = String(pets.length);

            this.renderPets();
            this.attachPetsTabListeners();

            // Populate pet selectors for Nutrition and Health tabs
            this.populatePetSelectors();
        } catch (error) {
            console.error('Failed to load pets:', error);
        }
    }

    populatePetSelectors() {
        const renderOptions = (pets) => ['<option value="" disabled selected>Select Pet...</option>']
            .concat(pets.map(p => `<option value="${p.id}">${p.name} (${p.species}${p.weight ? ` · ${p.weight}kg` : ''})</option>`))
            .join('');

        const nutritionSelect = document.getElementById('nutrition-pet-select');
        if (nutritionSelect) nutritionSelect.innerHTML = renderOptions(this.pets);

        const healthSelect = document.getElementById('health-pet-select');
        if (healthSelect) healthSelect.innerHTML = renderOptions(this.pets);

        // Auto-select first pet for convenience
        const firstId = this.pets?.[0]?.id;
        if (firstId) {
            if (nutritionSelect && !nutritionSelect.value) nutritionSelect.value = String(firstId);
            if (healthSelect && !healthSelect.value) healthSelect.value = String(firstId);
        }
    }

    speciesIcon(species) {
        switch ((species || '').toLowerCase()) {
            case 'dog': return 'fa-dog';
            case 'cat': return 'fa-cat';
            case 'bird': return 'fa-dove';
            case 'rabbit': return 'fa-paw';
            default: return 'fa-paw';
        }
    }

    // Deterministic gradient generator for vibrant species cards
    hashVariant(seed, modulo) {
        const str = String(seed || 'x');
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (h << 5) - h + str.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h) % Math.max(1, modulo);
    }

    gradientForSpecies(species, seed) {
        const dog = [
            ['#60a5fa', '#2563eb'], // blue
            ['#818cf8', '#4f46e5'], // indigo
            ['#38bdf8', '#0ea5e9'], // sky
            ['#22d3ee', '#06b6d4'], // cyan
            ['#c4b5fd', '#7c3aed'], // violet
        ];
        const cat = [
            ['#34d399', '#059669'], // emerald
            ['#2dd4bf', '#0d9488'], // teal
            ['#22c55e', '#16a34a'], // green
            ['#a7f3d0', '#10b981'], // mint → emerald
        ];
        const bird = [
            ['#fb923c', '#f97316'], // orange
            ['#f59e0b', '#d97706'], // amber
            ['#fda4af', '#f43f5e'], // warm red-pink
        ];
        const other = [
            ['#a78bfa', '#6366f1'], // violet/indigo
            ['#94a3b8', '#475569'], // slate
        ];

        const map = { dog, cat, bird, rabbit: dog, other };
        const list = map[(species || 'other').toLowerCase()] || other;
        const [c1, c2] = list[this.hashVariant(seed, list.length)];
        return `linear-gradient(135deg, ${c1}, ${c2})`;
    }

    renderPets() {
        const container = document.getElementById('pets-container');
        if (!container) return;

        let filtered = this.pets.slice();
        const spec = s => (s || '').toLowerCase();
        if (this.currentPetsFilter === 'dogs') filtered = filtered.filter(p => spec(p.species) === 'dog');
        if (this.currentPetsFilter === 'cats') filtered = filtered.filter(p => spec(p.species) === 'cat');
        if (this.currentPetsFilter === 'other') filtered = filtered.filter(p => !['dog','cat'].includes(spec(p.species)));

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No pets in this filter</h3><p>Try a different filter or add a pet.</p></div>';
            return;
        }

        container.innerHTML = filtered.map(p => {
            const species = spec(p.species) || 'other';
            const icon = this.speciesIcon(species);
            const gradient = this.gradientForSpecies(species, p.name || p.id);
            return `
                <div class="pet-card vibrant tile" data-species="${species}" style="background: ${gradient}" onclick="openPetDashboard(${p.id})">
                    <div class="tile-actions">
                        <button class="tile-action-btn" onclick="event.stopPropagation(); editPet(${p.id})" title="Edit Pet"><i class="fas fa-pen"></i></button>
                        <button class="tile-action-btn" onclick="event.stopPropagation(); logWeight(${p.id})" title="Log Weight"><i class="fas fa-weight-hanging"></i></button>
                    </div>
                    <div class="tile-avatar"><i class="fas ${icon}"></i></div>
                    <div class="tile-title">
                        <div class="tile-name">${p.name}</div>
                        <div class="tile-breed">${p.breed || ''}</div>
                    </div>
                    <div class="tile-stats">
                        <span class="pet-chip glass-chip"><i class="fas fa-birthday-cake"></i>${p.age ?? '—'} yrs</span>
                        <span class="pet-chip glass-chip"><i class="fas fa-weight-hanging"></i>${p.weight ?? '—'} kg</span>
                    </div>
                </div>`;
        }).join('');
    }

    // Utilities
    getPetById(petId) {
        return this.pets.find(p => String(p.id) === String(petId));
    }

    // Edit Pet Modal (modern, consistent)
    showEditPet(petId) {
        const pet = this.getPetById(petId);
        if (!pet) return this.showNotification('Pet not found', 'error');
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        modalBody.innerHTML = `
            <div class="professional-modal-content professional-modal--wide">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-pen"></i>
                        <h2>Edit Pet</h2>
                    </div>
                    <button class="modal-close-btn" onclick="app.closeModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body-scrollable">
                    <form id="edit-pet-form" class="professional-pet-form" onsubmit="app.handleUpdatePet(event, ${pet.id})">
                        <div class="sections-grid">
                            <div class="section-block">
                                <div class="section-title"><span class="section-accent"></span>Basic Information</div>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label class="form-label required">Pet Name</label>
                                        <input type="text" name="name" class="form-input" required value="${pet.name || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Gender</label>
                                        <select name="gender" class="form-select">
                                            <option value="" ${!pet.gender ? 'selected' : ''}>Select Gender</option>
                                            <option value="male" ${pet.gender==='male'?'selected':''}>Male</option>
                                            <option value="female" ${pet.gender==='female'?'selected':''}>Female</option>
                                            <option value="unknown" ${pet.gender==='unknown'?'selected':''}>Unknown</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label required">Species</label>
                                        <select name="species" class="form-select" required>
                                            ${['dog','cat','bird','rabbit','other'].map(s => `<option value="${s}" ${String(pet.species).toLowerCase()===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Breed</label>
                                        <input type="text" name="breed" class="form-input" value="${pet.breed || ''}">
                                    </div>
                                </div>
                            </div>

                            <div class="section-block">
                                <div class="section-title"><span class="section-accent"></span>Physical Information</div>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label class="form-label">Age (years)</label>
                                        <input type="number" name="age" class="form-input" step="0.1" min="0" value="${pet.age ?? ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label required">Current Weight (kg)</label>
                                        <input type="number" name="weight" class="form-input" required step="0.1" min="0.1" value="${pet.weight ?? ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Ideal Weight (kg)</label>
                                        <input type="number" name="ideal_weight" class="form-input" step="0.1" min="0.1" value="${pet.ideal_weight ?? ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Body Condition Score (1-9)</label>
                                        <select name="body_condition_score" class="form-select">
                                            <option value="" ${!pet.body_condition_score?'selected':''}>Select Score</option>
                                            ${Array.from({length:9}, (_,i)=>`<option value="${i+1}" ${Number(pet.body_condition_score)===i+1?'selected':''}>${i+1}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="section-block section--full">
                                <div class="section-title"><span class="section-accent"></span>Activity & Health</div>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label class="form-label">Activity Level</label>
                                        <select name="activity_level" class="form-select">
                                            <option value="low" ${pet.activity_level==='low'?'selected':''}>Low</option>
                                            <option value="medium" ${!pet.activity_level||pet.activity_level==='medium'?'selected':''}>Medium</option>
                                            <option value="high" ${pet.activity_level==='high'?'selected':''}>High</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Spay/Neuter Status</label>
                                        <select name="spay_neuter_status" class="form-select">
                                            <option value="" ${!pet.spay_neuter_status?'selected':''}>Select Status</option>
                                            <option value="spayed" ${pet.spay_neuter_status==='spayed'?'selected':''}>Spayed</option>
                                            <option value="neutered" ${pet.spay_neuter_status==='neutered'?'selected':''}>Neutered</option>
                                            <option value="intact" ${pet.spay_neuter_status==='intact'?'selected':''}>Intact</option>
                                            <option value="unknown" ${pet.spay_neuter_status==='unknown'?'selected':''}>Unknown</option>
                                        </select>
                                    </div>
                                    <div class="form-group form-group--full">
                                        <label class="form-label">Notes</label>
                                        <textarea name="personality" class="form-textarea" rows="3">${pet.personality || ''}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>`;
        this.showModal();
    }

    async handleUpdatePet(event, petId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {};
        for (let [k, v] of formData.entries()) {
            if (v !== '') data[k] = v;
        }
        if (data.age) data.age = parseFloat(data.age);
        if (data.weight) data.weight = parseFloat(data.weight);
        if (data.ideal_weight) data.ideal_weight = parseFloat(data.ideal_weight);
        if (data.body_condition_score) data.body_condition_score = parseInt(data.body_condition_score, 10);
        try {
            const res = await fetch(`/api/pets.php/${petId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update pet');
            this.closeModal();
            await this.loadPets();
            this.showNotification('Pet updated successfully', 'success');
        } catch (e) {
            console.error(e);
            this.showNotification(e.message || 'Failed to update pet', 'error');
        }
    }

    // Log Weight Modal
    showLogWeight(petId) {
        const pet = this.getPetById(petId);
        if (!pet) return this.showNotification('Pet not found', 'error');
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        modalBody.innerHTML = `
            <div class="professional-modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-weight-hanging"></i>
                        <h2>Log Weight - ${pet.name}</h2>
                    </div>
                    <button class="modal-close-btn" onclick="app.closeModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body-scrollable">
                    <form id="log-weight-form" class="professional-pet-form" onsubmit="app.handleLogWeight(event, ${pet.id})">
                        <div class="section-block section--full">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Weight (kg)</label>
                                    <input type="number" name="weight" class="form-input" required step="0.1" min="0.1" value="${pet.weight ?? ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Date</label>
                                    <input type="date" name="recorded_date" class="form-input" required value="${todayStr}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Body Condition Score</label>
                                    <select name="body_condition_score" class="form-select">
                                        <option value="">Select Score</option>
                                        ${Array.from({length:9}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group form-group--full">
                                    <label class="form-label">Notes</label>
                                    <textarea name="notes" class="form-textarea" rows="3" placeholder="Optional notes..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Add Record</button>
                        </div>
                    </form>
                </div>
            </div>`;
        this.showModal();
    }

    async handleLogWeight(event, petId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const payload = { pet_id: petId };
        for (let [k, v] of formData.entries()) {
            if (v !== '') payload[k] = v;
        }
        if (payload.weight) payload.weight = parseFloat(payload.weight);
        if (payload.body_condition_score) payload.body_condition_score = parseInt(payload.body_condition_score, 10);
        try {
            const res = await fetch('/api/weight-log.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Failed to log weight');
            this.closeModal();
            await this.loadPets();
            this.showNotification('Weight recorded successfully', 'success');
        } catch (e) {
            console.error(e);
            this.showNotification(e.message || 'Failed to log weight', 'error');
        }
    }

    attachPetsTabListeners() {
        const filterButtons = document.querySelectorAll('#pets-tab .filter-btn');
        if (!filterButtons.length) return;
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPetsFilter = btn.getAttribute('data-filter') || 'all';
                this.renderPets();
            });
        });
    }
    
    /**
     * Show pet dashboard modal with detailed information
     */
    showPetDashboard(pet) {
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        
        const age = pet.age ? `${pet.age} years` : 'Unknown age';
        const weight = pet.weight || pet.current_weight || 'Unknown';
        const breed = pet.breed || 'Mixed breed';
        const activityLevel = pet.activity_level || 'Medium';
        
        modalBody.innerHTML = `
            <div class="professional-modal-content professional-modal--wide">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas ${this.speciesIcon(pet.species)}"></i>
                        <h2>${pet.name}'s Dashboard</h2>
                    </div>
                    <button class="modal-close-btn" onclick="app.closeModal()"><i class="fas fa-times"></i></button>
                </div>
                
                <div class="modal-body-scrollable">
                    <div class="pet-dashboard-content">
                        <!-- Pet Overview -->
                        <div class="pet-overview-section">
                            <div class="pet-avatar-large">
                                <i class="fas ${this.speciesIcon(pet.species)}"></i>
                            </div>
                            <div class="pet-basic-info">
                                <h3>${pet.name}</h3>
                                <p class="pet-details">${breed} • ${age} • ${weight} kg</p>
                                <div class="pet-tags">
                                    <span class="pet-tag">${pet.species}</span>
                                    <span class="pet-tag activity-${activityLevel.toLowerCase()}">${activityLevel} Activity</span>
                                    ${pet.spay_neuter_status ? `<span class="pet-tag">${pet.spay_neuter_status}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Stats -->
                        <div class="pet-stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon"><i class="fas fa-weight"></i></div>
                                <div class="stat-info">
                                    <div class="stat-value">${weight}</div>
                                    <div class="stat-label">Current Weight (kg)</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon"><i class="fas fa-birthday-cake"></i></div>
                                <div class="stat-info">
                                    <div class="stat-value">${pet.age || '—'}</div>
                                    <div class="stat-label">Age (years)</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon"><i class="fas fa-running"></i></div>
                                <div class="stat-info">
                                    <div class="stat-value">${activityLevel}</div>
                                    <div class="stat-label">Activity Level</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon"><i class="fas fa-heart"></i></div>
                                <div class="stat-info">
                                    <div class="stat-value">—</div>
                                    <div class="stat-label">Health Score</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Actions -->
                        <div class="pet-actions-section">
                            <h4><i class="fas fa-bolt"></i> Quick Actions</h4>
                            <div class="pet-actions-grid">
                                <button class="pet-action-btn" onclick="app.showEditPet(${pet.id}); app.closeModal();">
                                    <i class="fas fa-edit"></i>
                                    <span>Edit Profile</span>
                                </button>
                                <button class="pet-action-btn" onclick="app.showLogWeight(${pet.id}); app.closeModal();">
                                    <i class="fas fa-weight-hanging"></i>
                                    <span>Log Weight</span>
                                </button>
                                <button class="pet-action-btn" onclick="if(window.nutritionCalculator) { window.nutritionCalculator.calculateForPet(${pet.id}); app.closeModal(); }">
                                    <i class="fas fa-calculator"></i>
                                    <span>Calculate Nutrition</span>
                                </button>
                                <button class="pet-action-btn" onclick="if(window.mealPlanner) { window.mealPlanner.createMealPlan(${pet.id}); app.closeModal(); }">
                                    <i class="fas fa-utensils"></i>
                                    <span>Plan Meals</span>
                                </button>
                                <button class="pet-action-btn" onclick="alert('Health records coming soon!');">
                                    <i class="fas fa-stethoscope"></i>
                                    <span>Health Records</span>
                                </button>
                                <button class="pet-action-btn" onclick="alert('Photo gallery coming soon!');">
                                    <i class="fas fa-camera"></i>
                                    <span>Photos</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Recent Activity -->
                        <div class="pet-activity-section">
                            <h4><i class="fas fa-clock"></i> Recent Activity</h4>
                            <div id="pet-recent-activity-${pet.id}" class="pet-activity-list">
                                <div class="loading-state">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    <span>Loading recent activity...</span>
                                </div>
                            </div>
                        </div>
                        
                        ${pet.personality ? `
                        <!-- Notes -->
                        <div class="pet-notes-section">
                            <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                            <div class="pet-notes">
                                <p>${pet.personality}</p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal();
        
        // Load recent activity for this pet
        this.loadPetRecentActivity(pet.id);
        
        // Log activity
        this.logActivity('pet_dashboard_viewed', {
            pet_id: pet.id,
            pet_name: pet.name,
            description: `Viewed dashboard for ${pet.name}`
        });
    }
    
    /**
     * Load recent activity for a specific pet
     */
    async loadPetRecentActivity(petId) {
        try {
            const response = await fetch(`/api/dashboard.php?action=activities&pet_id=${petId}&limit=5`, {
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                const container = document.getElementById(`pet-recent-activity-${petId}`);
                
                if (container && data.success && data.activities) {
                    if (data.activities.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-info-circle"></i>
                                <p>No recent activity for this pet</p>
                            </div>
                        `;
                    } else {
                        container.innerHTML = data.activities.map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="${this.getActivityIcon(activity.type)}"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">${activity.description}</div>
                                    <div class="activity-time">${activity.time_ago || 'Recently'}</div>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading pet activity:', error);
            const container = document.getElementById(`pet-recent-activity-${petId}`);
            if (container) {
                container.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load recent activity</p>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Get icon for activity type
     */
    getActivityIcon(type) {
        const icons = {
            'pet_added': 'fa-plus-circle',
            'pet_updated': 'fa-edit',
            'weight_logged': 'fa-weight-hanging',
            'nutrition_calculated': 'fa-calculator',
            'meal_plan_created': 'fa-utensils',
            'meal_logged': 'fa-check-circle',
            'health_record_added': 'fa-stethoscope',
            'photo_uploaded': 'fa-camera',
            'vet_visit': 'fa-user-md'
        };
        return icons[type] || 'fa-info-circle';
    }
}

// Global functions
function showAddPet() { if (window.app) window.app.showAddPet(); }
function closeModal() { if (window.app) window.app.closeModal(); }
function switchToTab(tabName) { 
    if (window.app) {
        window.app.switchToTab(tabName);
    }
}
// Backward-compatibility alias for existing inline handlers
function switchTab(tabName) {
    switchToTab(tabName);
}

// Sidebar footer helpers
function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.classList.toggle('show');
}

function showUserProfile() {
    try {
        const root = document.getElementById('modal-body');
        if (!root) return;
        const userEl = document.querySelector('.sidebar-footer .user-profile');
        const name = userEl?.getAttribute('data-user-name') || 'User';
        const email = userEl?.getAttribute('data-user-email') || '';
        const avatar = userEl?.getAttribute('data-user-avatar') || '';

        root.innerHTML = `
            <div class="professional-modal-content profile-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-user"></i>
                        <h2>Profile</h2>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-outline" onclick="switchToTab('settings')"><i class="fas fa-sliders-h"></i> Settings</button>
                        <button class="modal-close-btn" onclick="app.closeModal()"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="modal-body-scrollable">
                    <div class="profile-header">
                        <div class="user-avatar">
                            ${avatar ? `<img src="${avatar}" alt="${name}">` : `<span class="user-avatar--letter">${(name||'U').charAt(0).toUpperCase()}</span>`}
                        </div>
                        <div>
                            <div class="profile-name">${name}</div>
                            <div class="profile-email">${email}</div>
                        </div>
                        <div class="profile-actions">
                            <button class="btn btn-outline" onclick="app.showNotification('Edit profile coming soon','info')"><i class="fas fa-pen"></i> Edit</button>
                            <a href="logout.php" class="btn btn-primary"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h4>Account</h4>
                        <div class="profile-row"><div>Full name</div><div>${name}</div></div>
                        <div class="profile-row"><div>Email</div><div>${email}</div></div>
                    </div>
                </div>
            </div>`;
        const modal = document.querySelector('.modal-content');
        if (modal) modal.classList.add('modal--professional');
        if (window.app) window.app.showModal();
    } catch (e) {
        console.error(e);
        if (window.app) window.app.showNotification('Unable to open profile','error');
    }
}
function logWeight(petId) { if (window.app) window.app.showLogWeight(petId); }
function editPet(petId) { if (window.app) window.app.showEditPet(petId); }
function openPetDashboard(petId) { 
    if (window.app) {
        const pet = window.app.getPetById(petId);
        if (pet) {
            window.app.showPetDashboard(pet);
        } else {
            console.error('Pet not found:', petId);
        }
    }
}
// Lazy loader for component scripts
const __scriptPromises = {};
function loadScriptOnce(src) {
    if (__scriptPromises[src]) return __scriptPromises[src];
    __scriptPromises[src] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
    return __scriptPromises[src];
}

function waitForGlobal(key, timeoutMs = 3000, intervalMs = 50) {
    return new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            if (window[key]) return resolve(true);
            if (Date.now() - start >= timeoutMs) return resolve(false);
            setTimeout(tick, intervalMs);
        };
        tick();
    });
}

function scriptTagExists(srcSuffix) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        if (!s.src) continue;
        if (s.src.endsWith(srcSuffix)) return true;
        // also handle absolute path vs relative
        const idx = s.src.indexOf('/assets/js/');
        if (idx !== -1 && s.src.substring(idx) === srcSuffix) return true;
    }
    return false;
}

async function ensureCalculatorLoaded() {
    if (window.nutritionCalculator) return true;
    try {
        const suffix = 'assets/js/components/nutrition-calculator.js';
        if (!scriptTagExists(suffix)) {
            await loadScriptOnce(suffix);
        }
    } catch {
        // ignore and fall through to wait
    }
    return await waitForGlobal('nutritionCalculator', 4000);
}

async function ensureMealPlannerLoaded() {
    if (window.mealPlanner) return true;
    try {
        const suffix = 'assets/js/components/meal-planner.js';
        if (!scriptTagExists(suffix)) {
            await loadScriptOnce(suffix);
        }
    } catch {
        // ignore and wait
    }
    return await waitForGlobal('mealPlanner', 4000);
}

async function ensureNutritionPlansPanelLoaded() {
    if (window.nutritionPlansPanel) return true;
    try {
        await loadScriptOnce('assets/js/components/nutrition-plans-panel.js');
        const getSelectedPetId = () => {
            const select = document.getElementById('nutrition-pet-select');
            return select && select.value ? parseInt(select.value) : null;
        };
        window.nutritionPlansPanel = new window.NutritionPlansPanel({ getSelectedPetId });
        return true;
    } catch {
        return false;
    }
}

async function openNutritionCalculator() { 
    console.log('Opening nutrition calculator');
    const select = document.getElementById('nutrition-pet-select');
    const selectedId = select ? parseInt(select.value) : null;
    const ready = await ensureCalculatorLoaded();
    if (!ready) {
        // Retry once; on failure, show non-blocking toast and exit silently
        const retry = await ensureCalculatorLoaded();
        if (!retry) {
            if (window.app) window.app.showNotification('Unable to load nutrition calculator. Please refresh.', 'error');
            return;
        }
    }
    
    // Log activity
    if (window.app && window.app.logActivity) {
        window.app.logActivity('nutrition_calculator_opened', {
            description: 'Opened nutrition calculator',
            pet_id: selectedId
        });
    }
    
    if (selectedId) {
        window.nutritionCalculator.calculateForPet(selectedId);
    } else {
        window.nutritionCalculator.loadNutritionInterface();
    }
}

async function openMealPlanner() { 
    console.log('Opening meal planner');
    const select = document.getElementById('nutrition-pet-select');
    const selectedId = select ? parseInt(select.value) : null;
    const ready = await ensureMealPlannerLoaded();
    if (!ready) {
        const retry = await ensureMealPlannerLoaded();
        if (!retry) {
            if (window.app) window.app.showNotification('Unable to load meal planner. Please refresh.', 'error');
            return;
        }
    }
    
    // Log activity
    if (window.app && window.app.logActivity) {
        window.app.logActivity('meal_planner_opened', {
            description: 'Opened meal planner',
            pet_id: selectedId
        });
    }
    
    window.mealPlanner.createMealPlan(selectedId || undefined);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ANMSApp();
    // Lazy init the nutrition plans panel and refresh when tab opens or selector changes
    ensureNutritionPlansPanelLoaded().then(() => {
        const select = document.getElementById('nutrition-pet-select');
        if (select) select.addEventListener('change', () => window.nutritionPlansPanel.refresh());
        // Also refresh once after pets load (slight delay to allow list population)
        setTimeout(() => window.nutritionPlansPanel.refresh(), 400);
    });

    // Apply persisted theme
    const persisted = localStorage.getItem('anms_theme');
    if (persisted) document.documentElement.setAttribute('data-theme', persisted);
});

// Theme helpers
function setTheme(theme) {
    if (theme === 'system') {
        localStorage.setItem('anms_theme', 'system');
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
        apply();
        try { mq.onchange = apply; } catch { mq.addEventListener && mq.addEventListener('change', apply); }
        return;
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('anms_theme', theme);
}
function applyThemeToggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
}