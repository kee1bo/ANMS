// Pet Data Management Component
class PetDataManager extends EventEmitter {
    constructor(container, options = {}) {
        super();
        this.container = container;
        this.options = {
            apiClient: options.apiClient,
            enableBulkOperations: options.enableBulkOperations !== false,
            enableExport: options.enableExport !== false,
            enableImport: options.enableImport !== false,
            enableSharing: options.enableSharing !== false,
            ...options
        };

        this.pets = [];
        this.selectedPets = new Set();
        this.currentView = 'grid';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.filterBy = {};

        this.exporter = new PetDataExporter(this.options.apiClient);
        this.importer = new PetDataImporter(this.options.apiClient);

        this.init();
    }

    init() {
        this.createInterface();
        this.setupEventListeners();
        this.loadPets();
    }

    createInterface() {
        this.container.innerHTML = `
            <div class="pet-data-manager">
                <div class="manager-header">
                    <div class="header-title">
                        <h2>Pet Data Management</h2>
                        <p>Manage, export, and share your pet data</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-pet-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Pet
                        </button>
                    </div>
                </div>

                <div class="manager-toolbar">
                    <div class="toolbar-left">
                        <div class="view-controls">
                            <button class="btn-view ${this.currentView === 'grid' ? 'active' : ''}" data-view="grid">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="3" y="3" width="7" height="7"/>
                                    <rect x="14" y="3" width="7" height="7"/>
                                    <rect x="3" y="14" width="7" height="7"/>
                                    <rect x="14" y="14" width="7" height="7"/>
                                </svg>
                            </button>
                            <button class="btn-view ${this.currentView === 'list' ? 'active' : ''}" data-view="list">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/>
                                    <line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                                </svg>
                            </button>
                        </div>

                        <div class="sort-controls">
                            <select id="sort-select">
                                <option value="name">Sort by Name</option>
                                <option value="species">Sort by Species</option>
                                <option value="age">Sort by Age</option>
                                <option value="createdAt">Sort by Date Added</option>
                                <option value="updatedAt">Sort by Last Updated</option>
                            </select>
                            <button class="btn-sort-order" id="sort-order-btn" data-order="asc">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M7 12h10m-7 6h4"/>
                                </svg>
                            </button>
                        </div>

                        <div class="filter-controls">
                            <select id="species-filter">
                                <option value="">All Species</option>
                                <option value="dog">Dogs</option>
                                <option value="cat">Cats</option>
                                <option value="rabbit">Rabbits</option>
                                <option value="bird">Birds</option>
                                <option value="other">Other</option>
                            </select>
                            <input type="text" id="search-input" placeholder="Search pets..." />
                        </div>
                    </div>

                    <div class="toolbar-right">
                        <div class="bulk-actions" id="bulk-actions" style="display: none;">
                            <span class="selected-count" id="selected-count">0 selected</span>
                            <button class="btn btn-sm" id="bulk-export-btn">Export Selected</button>
                            <button class="btn btn-sm" id="bulk-share-btn">Share Selected</button>
                            <button class="btn btn-sm btn-danger" id="bulk-delete-btn">Delete Selected</button>
                        </div>

                        <div class="data-actions">
                            <div class="dropdown" id="export-dropdown">
                                <button class="btn btn-secondary dropdown-toggle" id="export-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Export
                                </button>
                                <div class="dropdown-menu" id="export-menu">
                                    <button class="dropdown-item" data-format="pdf">PDF Report</button>
                                    <button class="dropdown-item" data-format="csv">CSV Data</button>
                                    <button class="dropdown-item" data-format="json">JSON Backup</button>
                                    <button class="dropdown-item" data-format="xml">XML Data</button>
                                </div>
                            </div>

                            <div class="dropdown" id="import-dropdown">
                                <button class="btn btn-secondary dropdown-toggle" id="import-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17,8 12,3 7,8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    Import
                                </button>
                                <div class="dropdown-menu" id="import-menu">
                                    <button class="dropdown-item" data-format="json">Import JSON</button>
                                    <button class="dropdown-item" data-format="csv">Import CSV</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="manager-content">
                    <div class="pets-container" id="pets-container">
                        <div class="loading-state" id="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Loading pets...</p>
                        </div>
                    </div>
                </div>

                <div class="manager-footer">
                    <div class="footer-stats" id="footer-stats">
                        <span>Total: 0 pets</span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn btn-sm" id="select-all-btn">Select All</button>
                        <button class="btn btn-sm" id="clear-selection-btn">Clear Selection</button>
                    </div>
                </div>
            </div>

            <!-- Export Options Modal -->
            <div class="modal" id="export-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Export Options</h3>
                        <button class="modal-close" id="export-modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="export-form">
                            <div class="form-group">
                                <label>Export Format:</label>
                                <select id="export-format" required>
                                    <option value="">Select format...</option>
                                    <option value="pdf">PDF Report</option>
                                    <option value="csv">CSV Data</option>
                                    <option value="json">JSON Backup</option>
                                    <option value="xml">XML Data</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Export Scope:</label>
                                <div class="radio-group">
                                    <label><input type="radio" name="scope" value="all" checked> All pets</label>
                                    <label><input type="radio" name="scope" value="selected"> Selected pets only</label>
                                    <label><input type="radio" name="scope" value="filtered"> Current filtered view</label>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Include:</label>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" name="include" value="healthRecords" checked> Health Records</label>
                                    <label><input type="checkbox" name="include" value="photos"> Photo Information</label>
                                    <label><input type="checkbox" name="include" value="internalIds"> Internal IDs</label>
                                </div>
                            </div>

                            <div class="form-group">
                                <label><input type="checkbox" id="exclude-empty"> Exclude empty fields</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="confirm-export-btn">Export</button>
                        <button class="btn btn-secondary" id="cancel-export-btn">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Import Modal -->
            <div class="modal" id="import-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Import Pet Data</h3>
                        <button class="modal-close" id="import-modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="import-form">
                            <div class="form-group">
                                <label>Select File:</label>
                                <input type="file" id="import-file" accept=".json,.csv" required>
                                <small>Supported formats: JSON, CSV</small>
                            </div>

                            <div class="form-group">
                                <label>Import Options:</label>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" id="check-duplicates" checked> Check for duplicates</label>
                                    <label><input type="checkbox" id="skip-duplicates" checked> Skip duplicates</label>
                                    <label><input type="checkbox" id="update-duplicates"> Update existing pets</label>
                                </div>
                            </div>

                            <div class="import-preview" id="import-preview" style="display: none;">
                                <h4>Import Preview</h4>
                                <div class="preview-stats" id="preview-stats"></div>
                                <div class="preview-data" id="preview-data"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="confirm-import-btn" disabled>Import</button>
                        <button class="btn btn-secondary" id="cancel-import-btn">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Share Modal -->
            <div class="modal" id="share-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Share Pet Data</h3>
                        <button class="modal-close" id="share-modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="share-form">
                            <div class="form-group">
                                <label>Share with:</label>
                                <input type="email" id="share-email" placeholder="veterinarian@example.com" required>
                            </div>

                            <div class="form-group">
                                <label>Access Level:</label>
                                <select id="share-access">
                                    <option value="view">View Only</option>
                                    <option value="comment">View & Comment</option>
                                    <option value="edit">View & Edit</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Expiration:</label>
                                <select id="share-expiration">
                                    <option value="7">7 days</option>
                                    <option value="30">30 days</option>
                                    <option value="90">90 days</option>
                                    <option value="never">Never</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Message (optional):</label>
                                <textarea id="share-message" placeholder="Additional message for the recipient..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="confirm-share-btn">Share</button>
                        <button class="btn btn-secondary" id="cancel-share-btn">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Hidden file input for import -->
            <input type="file" id="hidden-file-input" style="display: none;" accept=".json,.csv">
        `;
    }

    setupEventListeners() {
        // View controls
        this.container.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setView(e.target.closest('.btn-view').dataset.view);
            });
        });

        // Sort controls
        const sortSelect = this.container.querySelector('#sort-select');
        const sortOrderBtn = this.container.querySelector('#sort-order-btn');

        sortSelect.addEventListener('change', (e) => {
            this.setSortBy(e.target.value);
        });

        sortOrderBtn.addEventListener('click', () => {
            this.toggleSortOrder();
        });

        // Filter controls
        const speciesFilter = this.container.querySelector('#species-filter');
        const searchInput = this.container.querySelector('#search-input');

        speciesFilter.addEventListener('change', (e) => {
            this.setFilter('species', e.target.value);
        });

        searchInput.addEventListener('input', (e) => {
            this.setFilter('search', e.target.value);
        });

        // Selection controls
        const selectAllBtn = this.container.querySelector('#select-all-btn');
        const clearSelectionBtn = this.container.querySelector('#clear-selection-btn');

        selectAllBtn.addEventListener('click', () => this.selectAll());
        clearSelectionBtn.addEventListener('click', () => this.clearSelection());

        // Export controls
        this.setupExportControls();

        // Import controls
        this.setupImportControls();

        // Share controls
        this.setupShareControls();

        // Bulk actions
        this.setupBulkActions();

        // Add pet button
        this.container.querySelector('#add-pet-btn').addEventListener('click', () => {
            this.emit('addPet');
        });
    }

    setupExportControls() {
        const exportBtn = this.container.querySelector('#export-btn');
        const exportMenu = this.container.querySelector('#export-menu');
        const exportModal = this.container.querySelector('#export-modal');

        // Dropdown toggle
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.style.display = exportMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            exportMenu.style.display = 'none';
        });

        // Export format selection
        exportMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.openExportModal(format);
                exportMenu.style.display = 'none';
            });
        });

        // Export modal controls
        const exportModalClose = exportModal.querySelector('#export-modal-close');
        const confirmExportBtn = exportModal.querySelector('#confirm-export-btn');
        const cancelExportBtn = exportModal.querySelector('#cancel-export-btn');

        exportModalClose.addEventListener('click', () => this.closeExportModal());
        cancelExportBtn.addEventListener('click', () => this.closeExportModal());
        confirmExportBtn.addEventListener('click', () => this.performExport());
    }

    setupImportControls() {
        const importBtn = this.container.querySelector('#import-btn');
        const importMenu = this.container.querySelector('#import-menu');
        const importModal = this.container.querySelector('#import-modal');
        const hiddenFileInput = this.container.querySelector('#hidden-file-input');

        // Dropdown toggle
        importBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            importMenu.style.display = importMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Import format selection
        importMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                hiddenFileInput.accept = format === 'json' ? '.json' : '.csv';
                hiddenFileInput.click();
                importMenu.style.display = 'none';
            });
        });

        // File selection
        hiddenFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.openImportModal(e.target.files[0]);
            }
        });

        // Import modal controls
        const importModalClose = importModal.querySelector('#import-modal-close');
        const confirmImportBtn = importModal.querySelector('#confirm-import-btn');
        const cancelImportBtn = importModal.querySelector('#cancel-import-btn');

        importModalClose.addEventListener('click', () => this.closeImportModal());
        cancelImportBtn.addEventListener('click', () => this.closeImportModal());
        confirmImportBtn.addEventListener('click', () => this.performImport());

        // Import file preview
        const importFile = importModal.querySelector('#import-file');
        importFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.previewImportFile(e.target.files[0]);
            }
        });
    }

    setupShareControls() {
        const shareModal = this.container.querySelector('#share-modal');
        const shareModalClose = shareModal.querySelector('#share-modal-close');
        const confirmShareBtn = shareModal.querySelector('#confirm-share-btn');
        const cancelShareBtn = shareModal.querySelector('#cancel-share-btn');

        shareModalClose.addEventListener('click', () => this.closeShareModal());
        cancelShareBtn.addEventListener('click', () => this.closeShareModal());
        confirmShareBtn.addEventListener('click', () => this.performShare());
    }

    setupBulkActions() {
        const bulkExportBtn = this.container.querySelector('#bulk-export-btn');
        const bulkShareBtn = this.container.querySelector('#bulk-share-btn');
        const bulkDeleteBtn = this.container.querySelector('#bulk-delete-btn');

        bulkExportBtn.addEventListener('click', () => this.bulkExport());
        bulkShareBtn.addEventListener('click', () => this.bulkShare());
        bulkDeleteBtn.addEventListener('click', () => this.bulkDelete());
    }

    async loadPets() {
        try {
            this.showLoading(true);
            
            if (this.options.apiClient) {
                const response = await this.options.apiClient.get('/pets');
                this.pets = response.data.pets || [];
            } else {
                // Mock data for testing
                this.pets = this.generateMockPets();
            }
            
            this.renderPets();
            this.updateFooterStats();
            
        } catch (error) {
            console.error('Failed to load pets:', error);
            this.showError('Failed to load pets');
        } finally {
            this.showLoading(false);
        }
    }

    generateMockPets() {
        return [
            {
                id: 1,
                name: 'Buddy',
                species: 'dog',
                breed: 'Golden Retriever',
                age: 5,
                gender: 'male',
                photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop',
                createdAt: '2023-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                name: 'Luna',
                species: 'cat',
                breed: 'Persian',
                age: 3,
                gender: 'female',
                photoUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop',
                createdAt: '2023-03-20T14:30:00Z',
                updatedAt: '2024-02-10T09:15:00Z'
            },
            {
                id: 3,
                name: 'Max',
                species: 'dog',
                breed: 'Labrador Retriever',
                age: 2,
                gender: 'male',
                photoUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=150&h=150&fit=crop',
                createdAt: '2023-06-10T16:45:00Z',
                updatedAt: '2024-01-25T11:20:00Z'
            }
        ];
    }

    renderPets() {
        const container = this.container.querySelector('#pets-container');
        const filteredPets = this.getFilteredPets();
        const sortedPets = this.getSortedPets(filteredPets);

        if (sortedPets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <h3>No pets found</h3>
                    <p>Add your first pet or adjust your filters</p>
                    <button class="btn btn-primary" onclick="this.emit('addPet')">Add Pet</button>
                </div>
            `;
            return;
        }

        const petsHTML = sortedPets.map(pet => this.renderPetCard(pet)).join('');
        container.innerHTML = `<div class="pets-${this.currentView}">${petsHTML}</div>`;

        // Add event listeners to pet cards
        this.setupPetCardListeners();
    }

    renderPetCard(pet) {
        const isSelected = this.selectedPets.has(pet.id);
        const photoUrl = pet.photoUrl || 'https://via.placeholder.com/150x150?text=No+Photo';

        if (this.currentView === 'grid') {
            return `
                <div class="pet-card ${isSelected ? 'selected' : ''}" data-pet-id="${pet.id}">
                    <div class="pet-card-header">
                        <input type="checkbox" class="pet-checkbox" ${isSelected ? 'checked' : ''}>
                        <div class="pet-actions">
                            <button class="btn-action" data-action="edit" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="btn-action" data-action="delete" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="pet-photo">
                        <img src="${photoUrl}" alt="${pet.name}" loading="lazy">
                    </div>
                    <div class="pet-info">
                        <h3 class="pet-name">${pet.name}</h3>
                        <p class="pet-details">${pet.species} • ${pet.breed || 'Mixed'}</p>
                        <p class="pet-age">${pet.age ? `${pet.age} years old` : 'Age unknown'}</p>
                        <div class="pet-meta">
                            <span class="pet-gender">${pet.gender}</span>
                            <span class="pet-updated">Updated ${this.formatDate(pet.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="pet-row ${isSelected ? 'selected' : ''}" data-pet-id="${pet.id}">
                    <div class="pet-row-checkbox">
                        <input type="checkbox" class="pet-checkbox" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="pet-row-photo">
                        <img src="${photoUrl}" alt="${pet.name}" loading="lazy">
                    </div>
                    <div class="pet-row-info">
                        <div class="pet-row-main">
                            <h3 class="pet-name">${pet.name}</h3>
                            <p class="pet-details">${pet.species} • ${pet.breed || 'Mixed'} • ${pet.gender}</p>
                        </div>
                        <div class="pet-row-meta">
                            <span class="pet-age">${pet.age ? `${pet.age} years` : 'Age unknown'}</span>
                            <span class="pet-updated">Updated ${this.formatDate(pet.updatedAt)}</span>
                        </div>
                    </div>
                    <div class="pet-row-actions">
                        <button class="btn-action" data-action="edit" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-action" data-action="delete" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }
    }

    setupPetCardListeners() {
        // Checkbox listeners
        this.container.querySelectorAll('.pet-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const petId = parseInt(e.target.closest('[data-pet-id]').dataset.petId);
                this.togglePetSelection(petId);
            });
        });

        // Action button listeners
        this.container.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.closest('.btn-action').dataset.action;
                const petId = parseInt(e.target.closest('[data-pet-id]').dataset.petId);
                this.handlePetAction(action, petId);
            });
        });

        // Pet card click listeners
        this.container.querySelectorAll('[data-pet-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.pet-checkbox') && !e.target.closest('.btn-action')) {
                    const petId = parseInt(card.dataset.petId);
                    this.emit('viewPet', { petId });
                }
            });
        });
    }

    // View and sorting methods
    setView(view) {
        this.currentView = view;
        this.container.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.renderPets();
    }

    setSortBy(field) {
        this.sortBy = field;
        this.renderPets();
    }

    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        const btn = this.container.querySelector('#sort-order-btn');
        btn.dataset.order = this.sortOrder;
        this.renderPets();
    }

    setFilter(type, value) {
        if (value) {
            this.filterBy[type] = value;
        } else {
            delete this.filterBy[type];
        }
        this.renderPets();
        this.updateFooterStats();
    }

    getFilteredPets() {
        return this.pets.filter(pet => {
            // Species filter
            if (this.filterBy.species && pet.species !== this.filterBy.species) {
                return false;
            }

            // Search filter
            if (this.filterBy.search) {
                const search = this.filterBy.search.toLowerCase();
                const searchFields = [pet.name, pet.species, pet.breed, pet.gender].filter(Boolean);
                if (!searchFields.some(field => field.toLowerCase().includes(search))) {
                    return false;
                }
            }

            return true;
        });
    }

    getSortedPets(pets) {
        return [...pets].sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // Handle null/undefined values
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';

            // Convert to strings for comparison
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();

            if (this.sortOrder === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    // Selection methods
    togglePetSelection(petId) {
        if (this.selectedPets.has(petId)) {
            this.selectedPets.delete(petId);
        } else {
            this.selectedPets.add(petId);
        }
        this.updateSelectionUI();
    }

    selectAll() {
        const filteredPets = this.getFilteredPets();
        filteredPets.forEach(pet => this.selectedPets.add(pet.id));
        this.updateSelectionUI();
        this.renderPets();
    }

    clearSelection() {
        this.selectedPets.clear();
        this.updateSelectionUI();
        this.renderPets();
    }

    updateSelectionUI() {
        const count = this.selectedPets.size;
        const bulkActions = this.container.querySelector('#bulk-actions');
        const selectedCount = this.container.querySelector('#selected-count');

        if (count > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = `${count} selected`;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    // Pet actions
    handlePetAction(action, petId) {
        switch (action) {
            case 'edit':
                this.emit('editPet', { petId });
                break;
            case 'delete':
                this.deletePet(petId);
                break;
        }
    }

    async deletePet(petId) {
        const pet = this.pets.find(p => p.id === petId);
        if (!pet) return;

        if (confirm(`Are you sure you want to delete ${pet.name}? This action cannot be undone.`)) {
            try {
                if (this.options.apiClient) {
                    await this.options.apiClient.delete(`/pets/${petId}`);
                }
                
                this.pets = this.pets.filter(p => p.id !== petId);
                this.selectedPets.delete(petId);
                this.renderPets();
                this.updateSelectionUI();
                this.updateFooterStats();
                
                this.emit('petDeleted', { petId, pet });
                this.showSuccess(`${pet.name} has been deleted`);
                
            } catch (error) {
                console.error('Failed to delete pet:', error);
                this.showError('Failed to delete pet');
            }
        }
    }

    // Export methods
    openExportModal(format) {
        const modal = this.container.querySelector('#export-modal');
        const formatSelect = modal.querySelector('#export-format');
        
        formatSelect.value = format;
        modal.style.display = 'block';
    }

    closeExportModal() {
        const modal = this.container.querySelector('#export-modal');
        modal.style.display = 'none';
    }

    async performExport() {
        const modal = this.container.querySelector('#export-modal');
        const form = modal.querySelector('#export-form');
        const formData = new FormData(form);
        
        const format = formData.get('format') || modal.querySelector('#export-format').value;
        const scope = formData.get('scope');
        const includes = formData.getAll('include');
        const excludeEmpty = modal.querySelector('#exclude-empty').checked;

        try {
            let petsToExport = [];
            
            switch (scope) {
                case 'all':
                    petsToExport = this.pets;
                    break;
                case 'selected':
                    petsToExport = this.pets.filter(pet => this.selectedPets.has(pet.id));
                    break;
                case 'filtered':
                    petsToExport = this.getFilteredPets();
                    break;
            }

            if (petsToExport.length === 0) {
                this.showError('No pets to export');
                return;
            }

            const options = {
                includeFields: includes.length > 0 ? includes : null,
                excludeEmptyFields: excludeEmpty,
                excludeInternalIds: !includes.includes('internalIds')
            };

            let result;
            if (petsToExport.length === 1) {
                result = await this.exporter.exportPetData(petsToExport[0].id, format, options);
            } else {
                const petIds = petsToExport.map(pet => pet.id);
                result = await this.exporter.exportMultiplePets(petIds, format, options);
            }

            this.showSuccess(`Export completed: ${result.filename}`);
            this.closeExportModal();
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showError(`Export failed: ${error.message}`);
        }
    }

    // Import methods
    openImportModal(file) {
        const modal = this.container.querySelector('#import-modal');
        const fileInput = modal.querySelector('#import-file');
        
        fileInput.files = file ? [file] : null;
        modal.style.display = 'block';
        
        if (file) {
            this.previewImportFile(file);
        }
    }

    closeImportModal() {
        const modal = this.container.querySelector('#import-modal');
        modal.style.display = 'none';
    }

    async previewImportFile(file) {
        try {
            const format = file.name.endsWith('.json') ? 'json' : 'csv';
            const content = await this.readFile(file);
            
            let previewData;
            if (format === 'json') {
                previewData = this.importer.parseJSONData(content);
            } else {
                previewData = this.importer.parseCSVData(content);
            }

            const preview = this.container.querySelector('#import-preview');
            const stats = this.container.querySelector('#preview-stats');
            const data = this.container.querySelector('#preview-data');

            stats.innerHTML = `
                <p><strong>File:</strong> ${file.name}</p>
                <p><strong>Format:</strong> ${format.toUpperCase()}</p>
                <p><strong>Pets to import:</strong> ${previewData.length}</p>
            `;

            data.innerHTML = `
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Species</th>
                            <th>Breed</th>
                            <th>Age</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${previewData.slice(0, 5).map(pet => `
                            <tr>
                                <td>${pet.name || 'N/A'}</td>
                                <td>${pet.species || 'N/A'}</td>
                                <td>${pet.breed || 'N/A'}</td>
                                <td>${pet.age || 'N/A'}</td>
                            </tr>
                        `).join('')}
                        ${previewData.length > 5 ? `<tr><td colspan="4">... and ${previewData.length - 5} more</td></tr>` : ''}
                    </tbody>
                </table>
            `;

            preview.style.display = 'block';
            this.container.querySelector('#confirm-import-btn').disabled = false;

        } catch (error) {
            console.error('Preview failed:', error);
            this.showError('Failed to preview import file');
        }
    }

    async performImport() {
        const modal = this.container.querySelector('#import-modal');
        const fileInput = modal.querySelector('#import-file');
        const checkDuplicates = modal.querySelector('#check-duplicates').checked;
        const skipDuplicates = modal.querySelector('#skip-duplicates').checked;
        const updateDuplicates = modal.querySelector('#update-duplicates').checked;

        if (!fileInput.files || fileInput.files.length === 0) {
            this.showError('Please select a file to import');
            return;
        }

        try {
            const file = fileInput.files[0];
            const format = file.name.endsWith('.json') ? 'json' : 'csv';
            
            const options = {
                checkDuplicates,
                skipDuplicates,
                updateDuplicates
            };

            const result = await this.importer.importPetData(file, format, options);
            
            this.showSuccess(`Import completed: ${result.imported} pets imported, ${result.failed} failed`);
            
            if (result.errors.length > 0) {
                console.warn('Import errors:', result.errors);
            }

            this.closeImportModal();
            this.loadPets(); // Reload pets to show imported data
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showError(`Import failed: ${error.message}`);
        }
    }

    // Share methods
    openShareModal() {
        const modal = this.container.querySelector('#share-modal');
        modal.style.display = 'block';
    }

    closeShareModal() {
        const modal = this.container.querySelector('#share-modal');
        modal.style.display = 'none';
    }

    async performShare() {
        const modal = this.container.querySelector('#share-modal');
        const email = modal.querySelector('#share-email').value;
        const access = modal.querySelector('#share-access').value;
        const expiration = modal.querySelector('#share-expiration').value;
        const message = modal.querySelector('#share-message').value;

        if (!email) {
            this.showError('Please enter an email address');
            return;
        }

        try {
            const selectedPetIds = Array.from(this.selectedPets);
            
            // Mock share implementation
            const shareData = {
                petIds: selectedPetIds,
                email,
                access,
                expiration,
                message
            };

            // In real implementation, this would call the API
            console.log('Sharing pets:', shareData);
            
            this.showSuccess(`Pet data shared with ${email}`);
            this.closeShareModal();
            
        } catch (error) {
            console.error('Share failed:', error);
            this.showError('Failed to share pet data');
        }
    }

    // Bulk operations
    async bulkExport() {
        if (this.selectedPets.size === 0) {
            this.showError('Please select pets to export');
            return;
        }
        
        this.openExportModal('pdf');
        
        // Pre-select "selected" scope
        const modal = this.container.querySelector('#export-modal');
        const scopeRadio = modal.querySelector('input[name="scope"][value="selected"]');
        if (scopeRadio) {
            scopeRadio.checked = true;
        }
    }

    bulkShare() {
        if (this.selectedPets.size === 0) {
            this.showError('Please select pets to share');
            return;
        }
        
        this.openShareModal();
    }

    async bulkDelete() {
        if (this.selectedPets.size === 0) {
            this.showError('Please select pets to delete');
            return;
        }

        const selectedPetNames = this.pets
            .filter(pet => this.selectedPets.has(pet.id))
            .map(pet => pet.name)
            .join(', ');

        if (confirm(`Are you sure you want to delete ${this.selectedPets.size} pet(s): ${selectedPetNames}? This action cannot be undone.`)) {
            try {
                const deletePromises = Array.from(this.selectedPets).map(petId => {
                    if (this.options.apiClient) {
                        return this.options.apiClient.delete(`/pets/${petId}`);
                    }
                    return Promise.resolve();
                });

                await Promise.all(deletePromises);
                
                this.pets = this.pets.filter(pet => !this.selectedPets.has(pet.id));
                this.selectedPets.clear();
                
                this.renderPets();
                this.updateSelectionUI();
                this.updateFooterStats();
                
                this.showSuccess(`${deletePromises.length} pet(s) deleted successfully`);
                
            } catch (error) {
                console.error('Bulk delete failed:', error);
                this.showError('Failed to delete some pets');
            }
        }
    }

    // Utility methods
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    }

    updateFooterStats() {
        const footerStats = this.container.querySelector('#footer-stats');
        const filteredPets = this.getFilteredPets();
        
        let statsText = `Total: ${this.pets.length} pets`;
        if (filteredPets.length !== this.pets.length) {
            statsText += ` (${filteredPets.length} shown)`;
        }
        
        footerStats.innerHTML = `<span>${statsText}</span>`;
    }

    showLoading(show) {
        const loadingState = this.container.querySelector('#loading-state');
        loadingState.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        this.emit('error', { message });
    }

    showSuccess(message) {
        this.emit('success', { message });
    }

    // Public API methods
    getPets() {
        return this.pets;
    }

    getSelectedPets() {
        return this.pets.filter(pet => this.selectedPets.has(pet.id));
    }

    refresh() {
        this.loadPets();
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for module use
window.PetDataManager = PetDataManager;