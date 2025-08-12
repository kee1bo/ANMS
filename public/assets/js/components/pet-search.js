/**
 * Advanced Pet Search Component
 * Comprehensive search with autocomplete, filters, and search history
 */
class PetSearchComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onSearchResults = options.onSearchResults || this.defaultResultsHandler;
        this.onSearchStart = options.onSearchStart || (() => {});
        this.onSearchEnd = options.onSearchEnd || (() => {});
        
        this.searchQuery = '';
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
            has_photos: false
        };
        
        this.searchHistory = this.loadSearchHistory();
        this.savedSearches = this.loadSavedSearches();
        this.searchSuggestions = [];
        this.isSearching = false;
        this.searchTimeout = null;
        this.currentResults = [];
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadSearchSuggestions();
    }

    render() {
        this.container.innerHTML = `
            <div class="pet-search-container">
                <!-- Search Header -->
                <div class="search-header">
                    <h3><i class="fas fa-search"></i> Find Your Pets</h3>
                    <div class="search-stats" id="search-stats" style="display: none;">
                        <span id="results-count">0 results</span>
                        <span id="search-time">in 0ms</span>
                    </div>
                </div>

                <!-- Main Search Bar -->
                <div class="main-search-bar">
                    <div class="search-input-container">
                        <input type="text" id="main-search-input" 
                               placeholder="Search by name, breed, species, or characteristics..."
                               autocomplete="off">
                        <div class="search-input-actions">
                            <button class="search-btn" id="search-btn" title="Search">
                                <i class="fas fa-search"></i>
                            </button>
                            <button class="clear-btn" id="clear-search-btn" title="Clear" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <!-- Search Suggestions Dropdown -->
                        <div class="search-suggestions" id="search-suggestions" style="display: none;">
                            <div class="suggestions-section">
                                <div class="suggestions-header">Suggestions</div>
                                <div class="suggestions-list" id="suggestions-list"></div>
                            </div>
                            <div class="suggestions-section" id="history-section" style="display: none;">
                                <div class="suggestions-header">Recent Searches</div>
                                <div class="suggestions-list" id="history-list"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Advanced Filters -->
                <div class="advanced-filters" id="advanced-filters">
                    <div class="filters-header">
                        <button class="filters-toggle" id="filters-toggle">
                            <i class="fas fa-filter"></i> Advanced Filters
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </button>
                        <div class="filters-actions">
                            <button class="btn btn-sm btn-outline" id="clear-filters-btn">
                                <i class="fas fa-times"></i> Clear Filters
                            </button>
                            <button class="btn btn-sm btn-primary" id="save-search-btn">
                                <i class="fas fa-bookmark"></i> Save Search
                            </button>
                        </div>
                    </div>
                    
                    <div class="filters-content" id="filters-content" style="display: none;">
                        <div class="filters-grid">
                            <!-- Basic Filters -->
                            <div class="filter-group">
                                <h4>Basic Information</h4>
                                <div class="filter-row">
                                    <div class="filter-item">
                                        <label for="filter-species">Species</label>
                                        <select id="filter-species" name="species">
                                            <option value="">All Species</option>
                                            <option value="dog">Dog</option>
                                            <option value="cat">Cat</option>
                                            <option value="bird">Bird</option>
                                            <option value="rabbit">Rabbit</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div class="filter-item">
                                        <label for="filter-breed">Breed</label>
                                        <input type="text" id="filter-breed" name="breed" 
                                               placeholder="Enter breed name" list="breed-suggestions">
                                        <datalist id="breed-suggestions"></datalist>
                                    </div>
                                </div>
                            </div>

                            <!-- Age and Weight Filters -->
                            <div class="filter-group">
                                <h4>Physical Characteristics</h4>
                                <div class="filter-row">
                                    <div class="filter-item">
                                        <label>Age Range (years)</label>
                                        <div class="range-inputs">
                                            <input type="number" id="filter-age-min" name="age_min" 
                                                   placeholder="Min" min="0" max="30" step="0.1">
                                            <span>to</span>
                                            <input type="number" id="filter-age-max" name="age_max" 
                                                   placeholder="Max" min="0" max="30" step="0.1">
                                        </div>
                                    </div>
                                    <div class="filter-item">
                                        <label>Weight Range (kg)</label>
                                        <div class="range-inputs">
                                            <input type="number" id="filter-weight-min" name="weight_min" 
                                                   placeholder="Min" min="0" max="200" step="0.1">
                                            <span>to</span>
                                            <input type="number" id="filter-weight-max" name="weight_max" 
                                                   placeholder="Max" min="0" max="200" step="0.1">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Activity and Health Filters -->
                            <div class="filter-group">
                                <h4>Activity & Health</h4>
                                <div class="filter-row">
                                    <div class="filter-item">
                                        <label for="filter-activity">Activity Level</label>
                                        <select id="filter-activity" name="activity_level">
                                            <option value="">Any Activity Level</option>
                                            <option value="low">Low Activity</option>
                                            <option value="medium">Medium Activity</option>
                                            <option value="high">High Activity</option>
                                        </select>
                                    </div>
                                    <div class="filter-item">
                                        <label for="filter-health">Health Status</label>
                                        <select id="filter-health" name="health_status">
                                            <option value="">Any Health Status</option>
                                            <option value="healthy">Healthy</option>
                                            <option value="needs_attention">Needs Attention</option>
                                            <option value="chronic_condition">Chronic Condition</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Filters -->
                            <div class="filter-group">
                                <h4>Additional Options</h4>
                                <div class="filter-row">
                                    <div class="filter-item">
                                        <label for="filter-spay-neuter">Spay/Neuter Status</label>
                                        <select id="filter-spay-neuter" name="spay_neuter_status">
                                            <option value="">Any Status</option>
                                            <option value="spayed">Spayed</option>
                                            <option value="neutered">Neutered</option>
                                            <option value="intact">Intact</option>
                                            <option value="unknown">Unknown</option>
                                        </select>
                                    </div>
                                    <div class="filter-item">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="filter-has-photos" name="has_photos">
                                            <span class="checkmark"></span>
                                            Has Photos Only
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Saved Searches -->
                <div class="saved-searches" id="saved-searches" style="display: none;">
                    <div class="saved-searches-header">
                        <h4><i class="fas fa-bookmark"></i> Saved Searches</h4>
                        <button class="btn btn-sm btn-outline" onclick="petSearch.toggleSavedSearches()">
                            <i class="fas fa-times"></i> Hide
                        </button>
                    </div>
                    <div class="saved-searches-list" id="saved-searches-list"></div>
                </div>

                <!-- Search Results -->
                <div class="search-results" id="search-results" style="display: none;">
                    <div class="results-header">
                        <h4>Search Results</h4>
                        <div class="results-actions">
                            <div class="sort-controls">
                                <label for="results-sort">Sort by:</label>
                                <select id="results-sort">
                                    <option value="relevance">Relevance</option>
                                    <option value="name-asc">Name (A-Z)</option>
                                    <option value="name-desc">Name (Z-A)</option>
                                    <option value="age-asc">Age (Youngest)</option>
                                    <option value="age-desc">Age (Oldest)</option>
                                    <option value="weight-asc">Weight (Lightest)</option>
                                    <option value="weight-desc">Weight (Heaviest)</option>
                                </select>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="petSearch.exportResults()">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                    <div class="results-content" id="results-content"></div>
                    <div class="results-pagination" id="results-pagination"></div>
                </div>

                <!-- Loading State -->
                <div class="search-loading" id="search-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Searching your pets...</p>
                </div>

                <!-- No Results State -->
                <div class="no-results" id="no-results" style="display: none;">
                    <div class="no-results-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h4>No pets found</h4>
                    <p>Try adjusting your search criteria or filters</p>
                    <div class="no-results-suggestions">
                        <button class="btn btn-outline" onclick="petSearch.clearAllFilters()">
                            <i class="fas fa-refresh"></i> Clear All Filters
                        </button>
                        <button class="btn btn-primary" onclick="petSearch.showSuggestions()">
                            <i class="fas fa-lightbulb"></i> Search Tips
                        </button>
                    </div>
                </div>
            </div>

            <!-- Save Search Modal -->
            <div class="save-search-modal" id="save-search-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4>Save Search</h4>
                        <button class="close-btn" onclick="petSearch.closeSaveSearchModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="search-name">Search Name</label>
                            <input type="text" id="search-name" placeholder="Enter a name for this search">
                        </div>
                        <div class="form-group">
                            <label for="search-description">Description (optional)</label>
                            <textarea id="search-description" placeholder="Describe what this search is for"></textarea>
                        </div>
                        <div class="search-preview">
                            <strong>Search Criteria:</strong>
                            <div id="search-preview-content"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="petSearch.closeSaveSearchModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="petSearch.saveCurrentSearch()">Save Search</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const searchInput = document.getElementById('main-search-input');
        const searchBtn = document.getElementById('search-btn');
        const clearBtn = document.getElementById('clear-search-btn');
        const filtersToggle = document.getElementById('filters-toggle');

        // Main search input
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updateClearButton();
            this.showSearchSuggestions();
            this.debounceSearch();
        });

        searchInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            } else if (e.key === 'Escape') {
                this.hideSearchSuggestions();
            }
        });

        // Search button
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        // Clear button
        clearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Filters toggle
        filtersToggle.addEventListener('click', () => {
            this.toggleFilters();
        });

        // Filter inputs
        this.attachFilterListeners();

        // Results sorting
        document.getElementById('results-sort').addEventListener('change', (e) => {
            this.sortResults(e.target.value);
        });

        // Save search button
        document.getElementById('save-search-btn').addEventListener('click', () => {
            this.showSaveSearchModal();
        });

        // Clear filters button
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearAllFilters();
        });

        // Click outside to hide suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-container')) {
                this.hideSearchSuggestions();
            }
        });

        // Species change updates breed suggestions
        document.getElementById('filter-species').addEventListener('change', (e) => {
            this.updateBreedSuggestions(e.target.value);
        });
    }

    attachFilterListeners() {
        const filterInputs = document.querySelectorAll('#advanced-filters input, #advanced-filters select');
        
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFiltersFromForm();
                this.debounceSearch();
            });
        });
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (this.searchQuery || this.hasActiveFilters()) {
                this.performSearch();
            } else {
                this.clearResults();
            }
        }, 300);
    }

    async performSearch() {
        if (this.isSearching) return;

        const searchCriteria = this.buildSearchCriteria();
        if (!searchCriteria.query && !this.hasActiveFilters()) {
            this.clearResults();
            return;
        }

        this.isSearching = true;
        this.onSearchStart();
        this.showLoading();
        this.hideSearchSuggestions();

        const startTime = Date.now();

        try {
            const response = await fetch('/api/pets.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    action: 'search',
                    ...searchCriteria
                })
            });

            const data = await response.json();
            const searchTime = Date.now() - startTime;

            if (data.success) {
                this.currentResults = data.pets || [];
                this.displayResults(this.currentResults, searchTime);
                this.addToSearchHistory(searchCriteria);
                this.onSearchResults(this.currentResults);
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        } finally {
            this.isSearching = false;
            this.hideLoading();
            this.onSearchEnd();
        }
    }

    buildSearchCriteria() {
        const criteria = {
            query: this.searchQuery.trim(),
            filters: {}
        };

        // Add active filters
        Object.keys(this.filters).forEach(key => {
            const value = this.filters[key];
            if (value !== '' && value !== false && value !== null && value !== undefined) {
                criteria.filters[key] = value;
            }
        });

        return criteria;
    }

    hasActiveFilters() {
        return Object.values(this.filters).some(value => 
            value !== '' && value !== false && value !== null && value !== undefined
        );
    }

    updateFiltersFromForm() {
        const filterInputs = document.querySelectorAll('#advanced-filters input, #advanced-filters select');
        
        filterInputs.forEach(input => {
            const name = input.name;
            if (name && this.filters.hasOwnProperty(name)) {
                if (input.type === 'checkbox') {
                    this.filters[name] = input.checked;
                } else {
                    this.filters[name] = input.value;
                }
            }
        });
    }

    displayResults(results, searchTime) {
        const resultsContainer = document.getElementById('search-results');
        const resultsContent = document.getElementById('results-content');
        const statsContainer = document.getElementById('search-stats');
        const noResultsContainer = document.getElementById('no-results');

        // Update stats
        document.getElementById('results-count').textContent = 
            `${results.length} result${results.length !== 1 ? 's' : ''}`;
        document.getElementById('search-time').textContent = `in ${searchTime}ms`;
        statsContainer.style.display = 'block';

        if (results.length === 0) {
            resultsContainer.style.display = 'none';
            noResultsContainer.style.display = 'block';
            return;
        }

        noResultsContainer.style.display = 'none';
        resultsContainer.style.display = 'block';

        // Render results
        resultsContent.innerHTML = results.map(pet => this.renderPetResult(pet)).join('');
    }

    renderPetResult(pet) {
        const primaryPhoto = pet.primary_photo;
        const photoUrl = primaryPhoto ? primaryPhoto.thumbnail_url : '/assets/images/default-pet.png';
        const age = pet.age ? `${pet.age} years old` : 'Age unknown';
        const healthStatus = pet.health_status || 'Unknown';
        const healthSummary = pet.health_summary || {};

        return `
            <div class="search-result-item" data-pet-id="${pet.id}">
                <div class="result-photo">
                    <img src="${photoUrl}" alt="${pet.name}" onerror="this.src='/assets/images/default-pet.png'">
                    <div class="result-species-badge">${pet.species}</div>
                </div>
                <div class="result-info">
                    <div class="result-header">
                        <h4 class="result-name">${pet.name}</h4>
                        <div class="result-actions">
                            <button class="btn btn-sm btn-primary" onclick="petSearch.viewPet(${pet.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="petSearch.editPet(${pet.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                    <div class="result-details">
                        <div class="result-basic">
                            <span class="detail-item">
                                <i class="fas fa-paw"></i> ${pet.breed || 'Mixed breed'}
                            </span>
                            <span class="detail-item">
                                <i class="fas fa-birthday-cake"></i> ${age}
                            </span>
                            <span class="detail-item">
                                <i class="fas fa-weight"></i> ${pet.weight}kg
                            </span>
                            <span class="detail-item">
                                <i class="fas fa-running"></i> ${pet.activity_level} activity
                            </span>
                        </div>
                        ${pet.personality ? `
                            <div class="result-personality">
                                <i class="fas fa-heart"></i> ${pet.personality}
                            </div>
                        ` : ''}
                        <div class="result-health">
                            <span class="health-status status-${healthStatus.toLowerCase().replace(' ', '-')}">
                                <i class="fas fa-heartbeat"></i> ${healthStatus}
                            </span>
                            ${healthSummary.active_conditions > 0 ? `
                                <span class="health-conditions">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    ${healthSummary.active_conditions} condition(s)
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    sortResults(sortBy) {
        if (!this.currentResults.length) return;

        const [field, order] = sortBy.split('-');
        
        this.currentResults.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle null values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Convert to appropriate types for comparison
            if (field === 'weight' || field === 'age') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;
            
            return order === 'desc' ? -comparison : comparison;
        });

        this.displayResults(this.currentResults, 0);
    }

    showSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        const suggestionsList = document.getElementById('suggestions-list');
        const historySection = document.getElementById('history-section');
        const historyList = document.getElementById('history-list');

        if (!this.searchQuery && this.searchHistory.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        // Show suggestions based on current input
        if (this.searchQuery) {
            const filteredSuggestions = this.searchSuggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(this.searchQuery.toLowerCase())
            ).slice(0, 5);

            suggestionsList.innerHTML = filteredSuggestions.map(suggestion => `
                <div class="suggestion-item" onclick="petSearch.selectSuggestion('${suggestion}')">
                    <i class="fas fa-search"></i>
                    <span>${this.highlightMatch(suggestion, this.searchQuery)}</span>
                </div>
            `).join('');
        } else {
            suggestionsList.innerHTML = '';
        }

        // Show recent searches
        if (this.searchHistory.length > 0) {
            historyList.innerHTML = this.searchHistory.slice(0, 5).map(search => `
                <div class="suggestion-item history-item" onclick="petSearch.selectHistoryItem('${search.query}')">
                    <i class="fas fa-history"></i>
                    <span>${search.query}</span>
                    <small>${search.timestamp}</small>
                </div>
            `).join('');
            historySection.style.display = 'block';
        } else {
            historySection.style.display = 'none';
        }

        suggestionsContainer.style.display = 'block';
    }

    hideSearchSuggestions() {
        document.getElementById('search-suggestions').style.display = 'none';
    }

    selectSuggestion(suggestion) {
        document.getElementById('main-search-input').value = suggestion;
        this.searchQuery = suggestion;
        this.hideSearchSuggestions();
        this.updateClearButton();
        this.performSearch();
    }

    selectHistoryItem(query) {
        document.getElementById('main-search-input').value = query;
        this.searchQuery = query;
        this.hideSearchSuggestions();
        this.updateClearButton();
        this.performSearch();
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    toggleFilters() {
        const filtersContent = document.getElementById('filters-content');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (filtersContent.style.display === 'none') {
            filtersContent.style.display = 'block';
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
        } else {
            filtersContent.style.display = 'none';
            toggleIcon.classList.remove('fa-chevron-up');
            toggleIcon.classList.add('fa-chevron-down');
        }
    }

    clearSearch() {
        document.getElementById('main-search-input').value = '';
        this.searchQuery = '';
        this.updateClearButton();
        this.hideSearchSuggestions();
        this.clearResults();
    }

    clearAllFilters() {
        // Reset filters object
        Object.keys(this.filters).forEach(key => {
            if (typeof this.filters[key] === 'boolean') {
                this.filters[key] = false;
            } else {
                this.filters[key] = '';
            }
        });

        // Reset form inputs
        const filterInputs = document.querySelectorAll('#advanced-filters input, #advanced-filters select');
        filterInputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        // Clear search and results
        this.clearSearch();
    }

    clearResults() {
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('search-stats').style.display = 'none';
        this.currentResults = [];
    }

    updateClearButton() {
        const clearBtn = document.getElementById('clear-search-btn');
        clearBtn.style.display = this.searchQuery ? 'block' : 'none';
    }

    showLoading() {
        document.getElementById('search-loading').style.display = 'block';
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('no-results').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('search-loading').style.display = 'none';
    }

    showError(message) {
        // Simple error display - in a real app you might use a toast library
        alert(`Search Error: ${message}`);
    }

    // Search history management
    addToSearchHistory(criteria) {
        if (!criteria.query) return;

        const historyItem = {
            query: criteria.query,
            filters: criteria.filters,
            timestamp: new Date().toLocaleDateString(),
            date: new Date().toISOString()
        };

        // Remove duplicate if exists
        this.searchHistory = this.searchHistory.filter(item => item.query !== criteria.query);
        
        // Add to beginning
        this.searchHistory.unshift(historyItem);
        
        // Keep only last 20 searches
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        this.saveSearchHistory();
    }

    loadSearchHistory() {
        try {
            const history = localStorage.getItem('petSearchHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading search history:', error);
            return [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('petSearchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Saved searches management
    showSaveSearchModal() {
        const modal = document.getElementById('save-search-modal');
        const previewContent = document.getElementById('search-preview-content');
        
        // Generate preview of current search
        const criteria = this.buildSearchCriteria();
        let preview = [];
        
        if (criteria.query) {
            preview.push(`Query: "${criteria.query}"`);
        }
        
        Object.keys(criteria.filters).forEach(key => {
            const value = criteria.filters[key];
            if (value !== '' && value !== false) {
                const label = this.getFilterLabel(key);
                preview.push(`${label}: ${value}`);
            }
        });
        
        previewContent.innerHTML = preview.length > 0 ? 
            preview.map(item => `<div class="preview-item">${item}</div>`).join('') :
            '<div class="preview-item">No search criteria</div>';
        
        modal.style.display = 'flex';
    }

    closeSaveSearchModal() {
        document.getElementById('save-search-modal').style.display = 'none';
        document.getElementById('search-name').value = '';
        document.getElementById('search-description').value = '';
    }

    saveCurrentSearch() {
        const name = document.getElementById('search-name').value.trim();
        if (!name) {
            alert('Please enter a name for this search');
            return;
        }

        const description = document.getElementById('search-description').value.trim();
        const criteria = this.buildSearchCriteria();

        const savedSearch = {
            id: Date.now(),
            name: name,
            description: description,
            criteria: criteria,
            created: new Date().toISOString()
        };

        this.savedSearches.push(savedSearch);
        this.saveSavedSearches();
        this.closeSaveSearchModal();
        
        alert('Search saved successfully!');
    }

    loadSavedSearches() {
        try {
            const saved = localStorage.getItem('petSavedSearches');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved searches:', error);
            return [];
        }
    }

    saveSavedSearches() {
        try {
            localStorage.setItem('petSavedSearches', JSON.stringify(this.savedSearches));
        } catch (error) {
            console.error('Error saving searches:', error);
        }
    }

    // Utility methods
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
            has_photos: 'Has Photos'
        };
        return labels[key] || key;
    }

    async loadSearchSuggestions() {
        // In a real app, this would load from an API
        this.searchSuggestions = [
            'Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Poodle',
            'Persian Cat', 'Maine Coon', 'Siamese', 'British Shorthair',
            'Budgerigar', 'Cockatiel', 'Canary', 'Lovebird',
            'Holland Lop', 'Netherland Dwarf', 'Mini Rex',
            'high activity', 'low activity', 'healthy', 'needs attention',
            'spayed', 'neutered', 'intact'
        ];
    }

    updateBreedSuggestions(species) {
        const breedInput = document.getElementById('filter-breed');
        const datalist = document.getElementById('breed-suggestions');
        
        // This would typically load breed data from an API
        const breedData = {
            dog: ['Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 'Poodle'],
            cat: ['Persian', 'Maine Coon', 'Siamese', 'British Shorthair', 'Ragdoll'],
            bird: ['Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure'],
            rabbit: ['Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead'],
            other: []
        };
        
        const breeds = breedData[species] || [];
        datalist.innerHTML = breeds.map(breed => `<option value="${breed}">`).join('');
    }

    // Public methods for external use
    defaultResultsHandler(results) {
        console.log('Search results:', results);
    }

    viewPet(petId) {
        window.location.href = `/test-pet-profile.html?id=${petId}`;
    }

    editPet(petId) {
        console.log('Edit pet:', petId);
        // Will be implemented with pet edit functionality
    }

    exportResults() {
        if (this.currentResults.length === 0) {
            alert('No results to export');
            return;
        }

        // Simple CSV export
        const headers = ['Name', 'Species', 'Breed', 'Age', 'Weight', 'Activity Level', 'Health Status'];
        const csvContent = [
            headers.join(','),
            ...this.currentResults.map(pet => [
                pet.name,
                pet.species,
                pet.breed || '',
                pet.age || '',
                pet.weight || '',
                pet.activity_level || '',
                pet.health_status || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pet-search-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    showSuggestions() {
        alert(`Search Tips:
• Use specific breed names for better results
• Try searching by personality traits
• Use age ranges in filters for precise results
• Combine multiple filters for targeted searches
• Save frequently used searches for quick access`);
    }

    toggleSavedSearches() {
        const container = document.getElementById('saved-searches');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
}

// Initialize global pet search instance
let petSearch;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pet-search-container')) {
        petSearch = new PetSearchComponent('pet-search-container');
    }
});