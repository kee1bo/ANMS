/**
 * Filter and Sort Interface Component
 * Advanced filtering and sorting system for pet data
 */
class FilterSortInterface {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onFiltersChange = options.onFiltersChange || (() => {});
        this.onSortChange = options.onSortChange || (() => {});
        this.onReset = options.onReset || (() => {});
        
        this.filters = {
            species: '',
            breed: '',
            age_min: '',
            age_max: '',
            weight_min: '',
            weight_max: '',
            activity_level: '',
            health_status: '',
            spay_neuter_status: '',
            has_photos: false,
            has_health_conditions: false
        };
        
        this.sortOptions = {
            field: 'name',
            order: 'asc'
        };
        
        this.isCollapsed = true;
        this.activeFiltersCount = 0;
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadSavedState();
    }

    render() {
        this.container.innerHTML = `
            <div class="filter-sort-interface">
                <!-- Filter Header -->
                <div class="filter-header">
                    <div class="filter-toggle" id="filter-toggle">
                        <button class="filter-toggle-btn" onclick="filterSort.toggleFilters()">
                            <i class="fas fa-filter"></i>
                            <span>Filters & Sort</span>
                            <span class="active-filters-badge" id="active-filters-badge" style="display: none;">0</span>
                            <i class="fas fa-chevron-down toggle-icon" id="toggle-icon"></i>
                        </button>
                    </div>
                    
                    <div class="filter-actions">
                        <div class="sort-quick-select">
                            <label for="quick-sort">Sort by:</label>
                            <select id="quick-sort" class="sort-select">
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="age-asc">Age (Youngest)</option>
                                <option value="age-desc">Age (Oldest)</option>
                                <option value="weight-asc">Weight (Lightest)</option>
                                <option value="weight-desc">Weight (Heaviest)</option>
                                <option value="species-asc">Species (A-Z)</option>
                                <option value="created_at-desc">Recently Added</option>
                                <option value="updated_at-desc">Recently Updated</option>
                            </select>
                        </div>
                        
                        <button class="btn btn-sm btn-outline" id="reset-filters-btn" onclick="filterSort.resetAll()">
                            <i class="fas fa-refresh"></i> Reset
                        </button>
                    </div>
                </div>

                <!-- Collapsible Filter Panel -->
                <div class="filter-panel" id="filter-panel" style="display: none;">
                    <div class="filter-sections">
                        <!-- Basic Filters -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">
                                <i class="fas fa-paw"></i> Basic Information
                            </h4>
                            <div class="filter-grid">
                                <div class="filter-group">
                                    <label for="filter-species">Species</label>
                                    <select id="filter-species" name="species" class="filter-input">
                                        <option value="">All Species</option>
                                        <option value="dog">Dogs</option>
                                        <option value="cat">Cats</option>
                                        <option value="bird">Birds</option>
                                        <option value="rabbit">Rabbits</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="filter-breed">Breed</label>
                                    <input type="text" id="filter-breed" name="breed" 
                                           class="filter-input" placeholder="Enter breed name"
                                           list="breed-suggestions">
                                    <datalist id="breed-suggestions"></datalist>
                                </div>
                            </div>
                        </div>

                        <!-- Age and Weight Filters -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">
                                <i class="fas fa-ruler"></i> Physical Characteristics
                            </h4>
                            <div class="filter-grid">
                                <div class="filter-group">
                                    <label>Age Range (years)</label>
                                    <div class="range-filter">
                                        <input type="number" id="filter-age-min" name="age_min" 
                                               class="filter-input range-input" placeholder="Min" 
                                               min="0" max="30" step="0.1">
                                        <span class="range-separator">to</span>
                                        <input type="number" id="filter-age-max" name="age_max" 
                                               class="filter-input range-input" placeholder="Max" 
                                               min="0" max="30" step="0.1">
                                    </div>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Weight Range (kg)</label>
                                    <div class="range-filter">
                                        <input type="number" id="filter-weight-min" name="weight_min" 
                                               class="filter-input range-input" placeholder="Min" 
                                               min="0" max="200" step="0.1">
                                        <span class="range-separator">to</span>
                                        <input type="number" id="filter-weight-max" name="weight_max" 
                                               class="filter-input range-input" placeholder="Max" 
                                               min="0" max="200" step="0.1">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Activity and Health Filters -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">
                                <i class="fas fa-heartbeat"></i> Activity & Health
                            </h4>
                            <div class="filter-grid">
                                <div class="filter-group">
                                    <label for="filter-activity">Activity Level</label>
                                    <select id="filter-activity" name="activity_level" class="filter-input">
                                        <option value="">Any Activity Level</option>
                                        <option value="low">Low Activity</option>
                                        <option value="medium">Medium Activity</option>
                                        <option value="high">High Activity</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="filter-health">Health Status</label>
                                    <select id="filter-health" name="health_status" class="filter-input">
                                        <option value="">Any Health Status</option>
                                        <option value="healthy">Healthy</option>
                                        <option value="needs_attention">Needs Attention</option>
                                        <option value="chronic_condition">Chronic Condition</option>
                                        <option value="recovering">Recovering</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Filters -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">
                                <i class="fas fa-sliders-h"></i> Additional Options
                            </h4>
                            <div class="filter-grid">
                                <div class="filter-group">
                                    <label for="filter-spay-neuter">Spay/Neuter Status</label>
                                    <select id="filter-spay-neuter" name="spay_neuter_status" class="filter-input">
                                        <option value="">Any Status</option>
                                        <option value="spayed">Spayed</option>
                                        <option value="neutered">Neutered</option>
                                        <option value="intact">Intact</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Special Filters</label>
                                    <div class="checkbox-filters">
                                        <label class="checkbox-filter">
                                            <input type="checkbox" id="filter-has-photos" name="has_photos">
                                            <span class="checkmark"></span>
                                            Has Photos
                                        </label>
                                        <label class="checkbox-filter">
                                            <input type="checkbox" id="filter-has-conditions" name="has_health_conditions">
                                            <span class="checkmark"></span>
                                            Has Health Conditions
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Advanced Sort Options -->
                        <div class="filter-section">
                            <h4 class="filter-section-title">
                                <i class="fas fa-sort"></i> Advanced Sorting
                            </h4>
                            <div class="sort-options">
                                <div class="sort-group">
                                    <label for="sort-field">Sort Field</label>
                                    <select id="sort-field" class="filter-input">
                                        <option value="name">Name</option>
                                        <option value="species">Species</option>
                                        <option value="breed">Breed</option>
                                        <option value="age">Age</option>
                                        <option value="weight">Weight</option>
                                        <option value="activity_level">Activity Level</option>
                                        <option value="health_status">Health Status</option>
                                        <option value="created_at">Date Added</option>
                                        <option value="updated_at">Last Updated</option>
                                    </select>
                                </div>
                                
                                <div class="sort-group">
                                    <label for="sort-order">Sort Order</label>
                                    <select id="sort-order" class="filter-input">
                                        <option value="asc">Ascending (A-Z, 0-9)</option>
                                        <option value="desc">Descending (Z-A, 9-0)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Actions -->
                    <div class="filter-panel-actions">
                        <button class="btn btn-secondary" onclick="filterSort.clearFilters()">
                            <i class="fas fa-times"></i> Clear Filters
                        </button>
                        <button class="btn btn-outline" onclick="filterSort.saveFilterPreset()">
                            <i class="fas fa-bookmark"></i> Save Preset
                        </button>
                        <button class="btn btn-primary" onclick="filterSort.applyFilters()">
                            <i class="fas fa-check"></i> Apply Filters
                        </button>
                    </div>
                </div>

                <!-- Active Filters Display -->
                <div class="active-filters" id="active-filters" style="display: none;">
                    <div class="active-filters-header">
                        <span class="active-filters-title">Active Filters:</span>
                        <button class="clear-all-btn" onclick="filterSort.clearFilters()">
                            <i class="fas fa-times"></i> Clear All
                        </button>
                    </div>
                    <div class="active-filters-list" id="active-filters-list"></div>
                </div>

                <!-- Filter Presets -->
                <div class="filter-presets" id="filter-presets" style="display: none;">
                    <div class="presets-header">
                        <h5>Saved Filter Presets</h5>
                        <button class="btn btn-sm btn-outline" onclick="filterSort.togglePresets()">
                            <i class="fas fa-times"></i> Hide
                        </button>
                    </div>
                    <div class="presets-list" id="presets-list"></div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Quick sort change
        document.getElementById('quick-sort').addEventListener('change', (e) => {
            const [field, order] = e.target.value.split('-');
            this.sortOptions = { field, order };
            this.updateAdvancedSort();
            this.onSortChange(this.sortOptions);
            this.saveState();
        });

        // Advanced sort changes
        document.getElementById('sort-field').addEventListener('change', (e) => {
            this.sortOptions.field = e.target.value;
            this.updateQuickSort();
            this.onSortChange(this.sortOptions);
            this.saveState();
        });

        document.getElementById('sort-order').addEventListener('change', (e) => {
            this.sortOptions.order = e.target.value;
            this.updateQuickSort();
            this.onSortChange(this.sortOptions);
            this.saveState();
        });

        // Filter inputs
        const filterInputs = document.querySelectorAll('.filter-input, input[type="checkbox"]');
        filterInputs.forEach(input => {
            const eventType = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(eventType, () => {
                this.updateFiltersFromForm();
                this.updateActiveFilters();
                this.saveState();
                
                // Debounced filter application
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => {
                    this.onFiltersChange(this.filters);
                }, 300);
            });
        });

        // Species change updates breed suggestions
        document.getElementById('filter-species').addEventListener('change', (e) => {
            this.updateBreedSuggestions(e.target.value);
        });
    }

    toggleFilters() {
        this.isCollapsed = !this.isCollapsed;
        const panel = document.getElementById('filter-panel');
        const icon = document.getElementById('toggle-icon');
        
        if (this.isCollapsed) {
            panel.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            panel.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }

    updateFiltersFromForm() {
        const filterInputs = document.querySelectorAll('.filter-input');
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        // Update regular filters
        filterInputs.forEach(input => {
            const name = input.name;
            if (name && this.filters.hasOwnProperty(name)) {
                this.filters[name] = input.value;
            }
        });
        
        // Update checkbox filters
        checkboxes.forEach(checkbox => {
            const name = checkbox.name;
            if (name && this.filters.hasOwnProperty(name)) {
                this.filters[name] = checkbox.checked;
            }
        });
    }

    updateActiveFilters() {
        const activeFiltersContainer = document.getElementById('active-filters');
        const activeFiltersList = document.getElementById('active-filters-list');
        const badge = document.getElementById('active-filters-badge');
        
        const activeFilters = [];
        
        // Check each filter for active values
        Object.keys(this.filters).forEach(key => {
            const value = this.filters[key];
            if (value !== '' && value !== false && value !== null && value !== undefined) {
                const label = this.getFilterLabel(key);
                const displayValue = this.getFilterDisplayValue(key, value);
                activeFilters.push({ key, label, value, displayValue });
            }
        });
        
        this.activeFiltersCount = activeFilters.length;
        
        // Update badge
        if (this.activeFiltersCount > 0) {
            badge.textContent = this.activeFiltersCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
        
        // Update active filters display
        if (activeFilters.length > 0) {
            activeFiltersContainer.style.display = 'block';
            activeFiltersList.innerHTML = activeFilters.map(filter => `
                <div class="active-filter-tag">
                    <span class="filter-label">${filter.label}:</span>
                    <span class="filter-value">${filter.displayValue}</span>
                    <button class="remove-filter-btn" onclick="filterSort.removeFilter('${filter.key}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        } else {
            activeFiltersContainer.style.display = 'none';
        }
    }

    removeFilter(filterKey) {
        // Reset the filter value
        if (typeof this.filters[filterKey] === 'boolean') {
            this.filters[filterKey] = false;
        } else {
            this.filters[filterKey] = '';
        }
        
        // Update the form input
        const input = document.querySelector(`[name="${filterKey}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        }
        
        this.updateActiveFilters();
        this.onFiltersChange(this.filters);
        this.saveState();
    }

    clearFilters() {
        // Reset all filter values
        Object.keys(this.filters).forEach(key => {
            if (typeof this.filters[key] === 'boolean') {
                this.filters[key] = false;
            } else {
                this.filters[key] = '';
            }
        });
        
        // Reset form inputs
        document.querySelectorAll('.filter-input').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateActiveFilters();
        this.onFiltersChange(this.filters);
        this.saveState();
    }

    resetAll() {
        this.clearFilters();
        
        // Reset sort to default
        this.sortOptions = { field: 'name', order: 'asc' };
        document.getElementById('quick-sort').value = 'name-asc';
        this.updateAdvancedSort();
        
        this.onSortChange(this.sortOptions);
        this.onReset();
        this.saveState();
    }

    applyFilters() {
        this.updateFiltersFromForm();
        this.onFiltersChange(this.filters);
        this.saveState();
        
        // Collapse panel after applying
        if (!this.isCollapsed) {
            this.toggleFilters();
        }
    }

    updateQuickSort() {
        const quickSort = document.getElementById('quick-sort');
        const value = `${this.sortOptions.field}-${this.sortOptions.order}`;
        
        // Check if this combination exists in quick sort options
        const option = quickSort.querySelector(`option[value="${value}"]`);
        if (option) {
            quickSort.value = value;
        } else {
            quickSort.value = ''; // Custom sort
        }
    }

    updateAdvancedSort() {
        document.getElementById('sort-field').value = this.sortOptions.field;
        document.getElementById('sort-order').value = this.sortOptions.order;
    }

    updateBreedSuggestions(species) {
        const datalist = document.getElementById('breed-suggestions');
        
        // Breed data by species
        const breedData = {
            dog: ['Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky'],
            cat: ['Persian', 'Maine Coon', 'Ragdoll', 'British Shorthair', 'Siamese', 'Russian Blue', 'Abyssinian', 'Bengal', 'Birman', 'Scottish Fold'],
            bird: ['Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure', 'Macaw', 'African Grey', 'Cockatoo', 'Finch', 'Parakeet'],
            rabbit: ['Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant', 'English Angora', 'Dutch', 'New Zealand', 'Californian'],
            other: []
        };
        
        const breeds = breedData[species] || [];
        datalist.innerHTML = breeds.map(breed => `<option value="${breed}">`).join('');
    }

    getFilterLabel(key) {
        const labels = {
            species: 'Species',
            breed: 'Breed',
            age_min: 'Min Age',
            age_max: 'Max Age',
            weight_min: 'Min Weight',
            weight_max: 'Max Weight',
            activity_level: 'Activity Level',
            health_status: 'Health Status',
            spay_neuter_status: 'Spay/Neuter Status',
            has_photos: 'Has Photos',
            has_health_conditions: 'Has Health Conditions'
        };
        return labels[key] || key;
    }

    getFilterDisplayValue(key, value) {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        
        // Format specific values
        if (key.includes('weight') && value) {
            return `${value}kg`;
        }
        
        if (key.includes('age') && value) {
            return `${value} years`;
        }
        
        // Capitalize first letter
        return value.toString().charAt(0).toUpperCase() + value.toString().slice(1);
    }

    saveFilterPreset() {
        const name = prompt('Enter a name for this filter preset:');
        if (!name) return;
        
        const preset = {
            name: name,
            filters: { ...this.filters },
            sort: { ...this.sortOptions },
            created: new Date().toISOString()
        };
        
        const presets = this.loadFilterPresets();
        presets.push(preset);
        
        try {
            localStorage.setItem('filterSortPresets', JSON.stringify(presets));
            this.renderPresets();
            alert('Filter preset saved successfully!');
        } catch (error) {
            console.error('Error saving preset:', error);
            alert('Failed to save preset');
        }
    }

    loadFilterPresets() {
        try {
            const presets = localStorage.getItem('filterSortPresets');
            return presets ? JSON.parse(presets) : [];
        } catch (error) {
            console.error('Error loading presets:', error);
            return [];
        }
    }

    renderPresets() {
        const presets = this.loadFilterPresets();
        const container = document.getElementById('filter-presets');
        const list = document.getElementById('presets-list');
        
        if (presets.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        list.innerHTML = presets.map((preset, index) => `
            <div class="preset-item">
                <div class="preset-info">
                    <h6 class="preset-name">${preset.name}</h6>
                    <p class="preset-details">
                        ${Object.values(preset.filters).filter(v => v !== '' && v !== false).length} filters, 
                        sorted by ${preset.sort.field} (${preset.sort.order})
                    </p>
                </div>
                <div class="preset-actions">
                    <button class="btn btn-sm btn-primary" onclick="filterSort.applyPreset(${index})">
                        Apply
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="filterSort.deletePreset(${index})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    applyPreset(index) {
        const presets = this.loadFilterPresets();
        const preset = presets[index];
        if (!preset) return;
        
        // Apply filters
        this.filters = { ...preset.filters };
        this.sortOptions = { ...preset.sort };
        
        // Update form inputs
        Object.keys(this.filters).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = this.filters[key];
                } else {
                    input.value = this.filters[key];
                }
            }
        });
        
        // Update sort selects
        this.updateQuickSort();
        this.updateAdvancedSort();
        
        // Update displays
        this.updateActiveFilters();
        
        // Trigger callbacks
        this.onFiltersChange(this.filters);
        this.onSortChange(this.sortOptions);
        this.saveState();
    }

    deletePreset(index) {
        if (!confirm('Are you sure you want to delete this preset?')) return;
        
        const presets = this.loadFilterPresets();
        presets.splice(index, 1);
        
        try {
            localStorage.setItem('filterSortPresets', JSON.stringify(presets));
            this.renderPresets();
        } catch (error) {
            console.error('Error deleting preset:', error);
        }
    }

    togglePresets() {
        const container = document.getElementById('filter-presets');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
        
        if (container.style.display === 'block') {
            this.renderPresets();
        }
    }

    saveState() {
        try {
            const state = {
                filters: this.filters,
                sort: this.sortOptions,
                isCollapsed: this.isCollapsed
            };
            localStorage.setItem('filterSortState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving filter state:', error);
        }
    }

    loadSavedState() {
        try {
            const state = localStorage.getItem('filterSortState');
            if (state) {
                const parsed = JSON.parse(state);
                this.filters = { ...this.filters, ...parsed.filters };
                this.sortOptions = { ...this.sortOptions, ...parsed.sort };
                this.isCollapsed = parsed.isCollapsed !== false; // Default to collapsed
                
                // Update form inputs with saved values
                Object.keys(this.filters).forEach(key => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = this.filters[key];
                        } else {
                            input.value = this.filters[key];
                        }
                    }
                });
                
                // Update sort selects
                this.updateQuickSort();
                this.updateAdvancedSort();
                
                // Update displays
                this.updateActiveFilters();
                
                // Set initial panel state
                if (!this.isCollapsed) {
                    this.toggleFilters();
                }
            }
        } catch (error) {
            console.error('Error loading filter state:', error);
        }
    }

    // Get current filter and sort state
    getState() {
        return {
            filters: { ...this.filters },
            sort: { ...this.sortOptions },
            activeFiltersCount: this.activeFiltersCount
        };
    }

    // Set filter and sort state programmatically
    setState(state) {
        if (state.filters) {
            this.filters = { ...this.filters, ...state.filters };
        }
        
        if (state.sort) {
            this.sortOptions = { ...this.sortOptions, ...state.sort };
        }
        
        // Update form inputs
        Object.keys(this.filters).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = this.filters[key];
                } else {
                    input.value = this.filters[key];
                }
            }
        });
        
        // Update sort selects
        this.updateQuickSort();
        this.updateAdvancedSort();
        
        // Update displays
        this.updateActiveFilters();
        this.saveState();
    }

    // Export current filters for sharing or backup
    exportFilters() {
        const exportData = {
            filters: this.filters,
            sort: this.sortOptions,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pet-filters-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Import filters from file
    importFilters(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                if (importData.filters && importData.sort) {
                    this.setState(importData);
                    alert('Filters imported successfully!');
                } else {
                    throw new Error('Invalid filter file format');
                }
            } catch (error) {
                console.error('Error importing filters:', error);
                alert('Failed to import filters: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // Destroy the component and clean up
    destroy() {
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
        }
        
        // Remove event listeners
        const filterInputs = document.querySelectorAll('.filter-input, input[type="checkbox"]');
        filterInputs.forEach(input => {
            input.removeEventListener('input', this.handleFilterChange);
            input.removeEventListener('change', this.handleFilterChange);
        });
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterSortInterface;
}
                
                // Apply saved state to form
                this.populateForm();
                this.updateActiveFilters();
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }

    populateForm() {
        // Populate filter inputs
        Object.keys(this.filters).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = this.filters[key];
                } else {
                    input.value = this.filters[key];
                }
            }
        });
        
        // Populate sort selects
        this.updateQuickSort();
        this.updateAdvancedSort();
        
        // Set panel state
        if (!this.isCollapsed) {
            this.toggleFilters();
        }
    }

    // Public methods for external use
    getFilters() {
        return { ...this.filters };
    }

    getSortOptions() {
        return { ...this.sortOptions };
    }

    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this.populateForm();
        this.updateActiveFilters();
        this.saveState();
    }

    setSortOptions(sortOptions) {
        this.sortOptions = { ...this.sortOptions, ...sortOptions };
        this.updateQuickSort();
        this.updateAdvancedSort();
        this.saveState();
    }

    getActiveFiltersCount() {
        return this.activeFiltersCount;
    }

    hasActiveFilters() {
        return this.activeFiltersCount > 0;
    }
}

// Initialize global filter sort instance
let filterSort;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filter-sort-container')) {
        filterSort = new FilterSortInterface('filter-sort-container');
    }
});