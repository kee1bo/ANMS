/**
 * Quick Actions Component
 * Manages quick action buttons and their availability based on context
 */
class QuickActions {
    constructor(modalManager = null, navigationManager = null) {
        this.modalManager = modalManager || window.app;
        this.navigationManager = navigationManager || window.app;
        this.actions = new Map();
        this.containerId = 'quick-actions-container';
        this.pets = [];
        
        this.init();
    }
    
    init() {
        this.registerDefaultActions();
        this.setupEventListeners();
        this.loadPetData();
        this.render();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for pet changes to update action availability
        document.addEventListener('petAdded', () => {
            this.loadPetData();
            this.updateActionAvailability();
        });
        
        document.addEventListener('petUpdated', () => {
            this.loadPetData();
            this.updateActionAvailability();
        });
        
        document.addEventListener('petDeleted', () => {
            this.loadPetData();
            this.updateActionAvailability();
        });
        
        // Listen for clicks on quick action buttons
        document.addEventListener('click', (e) => {
            const actionButton = e.target.closest('[data-quick-action]');
            if (actionButton) {
                const actionName = actionButton.dataset.quickAction;
                this.executeAction(actionName, { button: actionButton, event: e });
            }
        });
    }
    
    /**
     * Register default actions
     */
    registerDefaultActions() {
        this.registerAction('add_pet', {
            icon: 'fas fa-plus',
            label: 'Add New Pet',
            description: 'Add a new pet to your profile',
            handler: 'showAddPetModal',
            requiresPets: false,
            priority: 1
        });
        
        this.registerAction('plan_meal', {
            icon: 'fas fa-utensils',
            label: 'Plan Meal',
            description: 'Create a meal plan for your pets',
            handler: 'openMealPlanner',
            requiresPets: true,
            priority: 2
        });
        
        this.registerAction('calculate_nutrition', {
            icon: 'fas fa-calculator',
            label: 'Calculate Nutrition',
            description: 'Calculate nutrition requirements',
            handler: 'openNutritionCalculator',
            requiresPets: true,
            priority: 3
        });
        
        this.registerAction('log_health', {
            icon: 'fas fa-heart',
            label: 'Log Health',
            description: 'Record health information',
            handler: 'openHealthLogger',
            requiresPets: true,
            priority: 4
        });
        
        this.registerAction('view_reports', {
            icon: 'fas fa-chart-bar',
            label: 'View Reports',
            description: 'View health and nutrition reports',
            handler: 'openReports',
            requiresPets: true,
            priority: 5
        });
        
        this.registerAction('upload_photo', {
            icon: 'fas fa-camera',
            label: 'Upload Photo',
            description: 'Add photos of your pets',
            handler: 'openPhotoUpload',
            requiresPets: true,
            priority: 6
        });
    }
    
    /**
     * Register a new action
     */
    registerAction(name, config) {
        const action = {
            name,
            icon: config.icon || 'fas fa-cog',
            label: config.label || name,
            description: config.description || '',
            handler: config.handler || name,
            requiresPets: config.requiresPets || false,
            priority: config.priority || 999,
            enabled: true,
            visible: true,
            ...config
        };
        
        this.actions.set(name, action);
        
        // Re-render if already initialized
        if (this.actions.size > 1) {
            this.render();
        }
    }
    
    /**
     * Execute an action
     */
    executeAction(actionName, context = {}) {
        const action = this.actions.get(actionName);
        if (!action) {
            console.warn(`Action '${actionName}' not found`);
            return;
        }
        
        if (!action.enabled) {
            this.showActionDisabledMessage(action);
            return;
        }
        
        try {
            // Call the handler method
            if (typeof action.handler === 'function') {
                action.handler(context);
            } else if (typeof action.handler === 'string') {
                this.callHandlerMethod(action.handler, context);
            }
            
            // Log the action
            this.logActionUsage(actionName);
            
        } catch (error) {
            console.error(`Error executing action '${actionName}':`, error);
            this.showActionError(action, error);
        }
    }
    
    /**
     * Call handler method by name
     */
    callHandlerMethod(handlerName, context) {
        // Store dashboard context for return functionality
        this.storeDashboardContext();
        
        switch (handlerName) {
            case 'showAddPetModal':
                this.handleAddPetAction(context);
                break;
                
            case 'openMealPlanner':
                this.handleMealPlannerAction(context);
                break;
                
            case 'openNutritionCalculator':
                this.handleNutritionCalculatorAction(context);
                break;
                
            case 'openHealthLogger':
                this.handleHealthLoggerAction(context);
                break;
                
            case 'openReports':
                this.handleReportsAction(context);
                break;
                
            case 'openPhotoUpload':
                this.handlePhotoUploadAction(context);
                break;
                
            default:
                console.warn(`Handler '${handlerName}' not implemented`);
                break;
        }
    }
    
    /**
     * Store dashboard context for return functionality
     */
    storeDashboardContext() {
        this.dashboardContext = {
            currentTab: this.getCurrentTab(),
            scrollPosition: window.scrollY,
            timestamp: Date.now()
        };
    }
    
    /**
     * Get current active tab
     */
    getCurrentTab() {
        const activeTab = document.querySelector('.nav-link.active');
        return activeTab ? activeTab.dataset.tab : 'dashboard';
    }
    
    /**
     * Handle Add Pet action with dashboard integration
     */
    handleAddPetAction(context) {
        if (this.modalManager && this.modalManager.showAddPet) {
            // Set loading state
            this.setActionLoading('add_pet', true);
            
            // Override the modal's close behavior to return to dashboard
            const originalCloseModal = this.modalManager.closeModal;
            const originalHandleAddPet = this.modalManager.handleAddPet;
            
            // Enhance the add pet handler to return to dashboard after success
            this.modalManager.handleAddPet = async (event) => {
                try {
                    const result = await originalHandleAddPet.call(this.modalManager, event);
                    
                    // Show success state
                    this.setActionSuccess('add_pet');
                    
                    // If we're not already on dashboard, return to it
                    if (this.dashboardContext && this.dashboardContext.currentTab !== 'dashboard') {
                        setTimeout(() => {
                            this.returnToDashboard();
                        }, 1000); // Give time for success notification
                    }
                    
                    return result;
                } catch (error) {
                    this.setActionLoading('add_pet', false);
                    throw error;
                }
            };
            
            this.modalManager.showAddPet();
            
            // Clear loading state when modal opens
            setTimeout(() => {
                this.setActionLoading('add_pet', false);
            }, 500);
            
            // Restore original handlers after modal is closed
            setTimeout(() => {
                this.modalManager.closeModal = originalCloseModal;
                this.modalManager.handleAddPet = originalHandleAddPet;
            }, 100);
        } else {
            console.warn('Add pet modal not available');
            this.showActionError({ label: 'Add Pet' }, new Error('Modal not available'));
        }
    }
    
    /**
     * Handle Meal Planner action with dashboard integration
     */
    async handleMealPlannerAction(context) {
        try {
            // Set loading state
            this.setActionLoading('plan_meal', true);
            
            // Ensure meal planner is loaded
            const ready = await this.ensureMealPlannerLoaded();
            if (!ready) {
                throw new Error('Failed to load meal planner component');
            }
            
            // Switch to nutrition tab first
            if (this.navigationManager && this.navigationManager.switchToTab) {
                this.navigationManager.switchToTab('nutrition');
            }
            
            // Use first pet as default if available
            const petId = this.pets.length > 0 ? this.pets[0].id : null;
            
            // Create meal plan with dashboard return context
            if (window.mealPlanner && window.mealPlanner.createMealPlan) {
                // Store original method and enhance it
                const originalCreateMealPlan = window.mealPlanner.createMealPlan;
                
                window.mealPlanner.createMealPlan = async (petIdParam) => {
                    const result = await originalCreateMealPlan.call(window.mealPlanner, petIdParam);
                    
                    // Add return to dashboard button if we came from dashboard
                    this.addReturnToDashboardButton('meal-planner-container');
                    
                    // Show success state
                    this.setActionSuccess('plan_meal');
                    
                    return result;
                };
                
                window.mealPlanner.createMealPlan(petId);
                
                // Clear loading state
                this.setActionLoading('plan_meal', false);
                
                // Restore original method after a delay
                setTimeout(() => {
                    window.mealPlanner.createMealPlan = originalCreateMealPlan;
                }, 1000);
            }
        } catch (error) {
            console.error('Error opening meal planner:', error);
            this.setActionLoading('plan_meal', false);
            this.showActionError({ label: 'Meal Planner' }, error);
        }
    }
    
    /**
     * Handle Nutrition Calculator action with dashboard integration
     */
    async handleNutritionCalculatorAction(context) {
        try {
            // Set loading state
            this.setActionLoading('calculate_nutrition', true);
            
            // Ensure nutrition calculator is loaded
            const ready = await this.ensureNutritionCalculatorLoaded();
            if (!ready) {
                throw new Error('Failed to load nutrition calculator component');
            }
            
            // Switch to nutrition tab first
            if (this.navigationManager && this.navigationManager.switchToTab) {
                this.navigationManager.switchToTab('nutrition');
            }
            
            // Open nutrition calculator with dashboard return context
            if (window.nutritionCalculator && window.nutritionCalculator.loadNutritionInterface) {
                // Store original method and enhance it
                const originalLoadInterface = window.nutritionCalculator.loadNutritionInterface;
                
                window.nutritionCalculator.loadNutritionInterface = async () => {
                    const result = await originalLoadInterface.call(window.nutritionCalculator);
                    
                    // Add return to dashboard button
                    this.addReturnToDashboardButton('nutrition-calculator-container');
                    
                    // Show success state
                    this.setActionSuccess('calculate_nutrition');
                    
                    return result;
                };
                
                window.nutritionCalculator.loadNutritionInterface();
                
                // Clear loading state
                this.setActionLoading('calculate_nutrition', false);
                
                // Restore original method after a delay
                setTimeout(() => {
                    window.nutritionCalculator.loadNutritionInterface = originalLoadInterface;
                }, 1000);
            }
        } catch (error) {
            console.error('Error opening nutrition calculator:', error);
            this.setActionLoading('calculate_nutrition', false);
            this.showActionError({ label: 'Nutrition Calculator' }, error);
        }
    }
    
    /**
     * Handle Health Logger action with dashboard integration
     */
    handleHealthLoggerAction(context) {
        if (this.navigationManager && this.navigationManager.switchToTab) {
            this.navigationManager.switchToTab('health');
            
            // Add return to dashboard button to health tab
            setTimeout(() => {
                this.addReturnToDashboardButton('health-tab');
            }, 500);
        }
    }
    
    /**
     * Handle Reports action with dashboard integration
     */
    handleReportsAction(context) {
        // For now, show coming soon message with return option
        if (this.modalManager && this.modalManager.showNotification) {
            this.modalManager.showNotification('Reports feature coming soon!', 'info');
        } else {
            alert('Reports feature coming soon!');
        }
    }
    
    /**
     * Handle Photo Upload action with dashboard integration
     */
    handlePhotoUploadAction(context) {
        if (this.navigationManager && this.navigationManager.switchToTab) {
            this.navigationManager.switchToTab('pets');
            
            // Add return to dashboard button to pets tab
            setTimeout(() => {
                this.addReturnToDashboardButton('pets-tab');
            }, 500);
        }
    }
    
    /**
     * Add return to dashboard button to a container
     */
    addReturnToDashboardButton(containerId) {
        const container = document.getElementById(containerId) || document.querySelector(`.${containerId}`);
        if (!container || this.dashboardContext?.currentTab === 'dashboard') {
            return; // Don't add button if already on dashboard
        }
        
        // Check if button already exists
        if (container.querySelector('.return-to-dashboard-btn')) {
            return;
        }
        
        const returnButton = document.createElement('div');
        returnButton.className = 'return-to-dashboard-container';
        returnButton.innerHTML = `
            <button class="btn btn-outline return-to-dashboard-btn" onclick="quickActions.returnToDashboard()">
                <i class="fas fa-arrow-left"></i>
                Return to Dashboard
            </button>
        `;
        
        // Add some styling
        returnButton.style.cssText = `
            margin-bottom: 20px;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        `;
        
        // Insert at the beginning of the container
        container.insertBefore(returnButton, container.firstChild);
    }
    
    /**
     * Return to dashboard with context restoration
     */
    returnToDashboard() {
        if (this.navigationManager && this.navigationManager.switchToTab) {
            this.navigationManager.switchToTab('dashboard');
            
            // Restore scroll position if available
            if (this.dashboardContext && this.dashboardContext.scrollPosition) {
                setTimeout(() => {
                    window.scrollTo(0, this.dashboardContext.scrollPosition);
                }, 100);
            }
            
            // Refresh dashboard data
            if (window.app && window.app.loadDashboardData) {
                window.app.loadDashboardData();
            }
            
            // Clear context
            this.dashboardContext = null;
        }
    }
    
    /**
     * Ensure meal planner component is loaded
     */
    async ensureMealPlannerLoaded() {
        if (window.mealPlanner) return true;
        
        try {
            // Use the global function if available
            if (typeof window.ensureMealPlannerLoaded === 'function') {
                return await window.ensureMealPlannerLoaded();
            }
            
            // Fallback: try to load the script
            await this.loadScript('/assets/js/components/meal-planner.js');
            return await this.waitForGlobal('mealPlanner', 3000);
        } catch (error) {
            console.error('Failed to load meal planner:', error);
            return false;
        }
    }
    
    /**
     * Ensure nutrition calculator component is loaded
     */
    async ensureNutritionCalculatorLoaded() {
        if (window.nutritionCalculator) return true;
        
        try {
            // Use the global function if available
            if (typeof window.ensureCalculatorLoaded === 'function') {
                return await window.ensureCalculatorLoaded();
            }
            
            // Fallback: try to load the script
            await this.loadScript('/assets/js/components/nutrition-calculator.js');
            return await this.waitForGlobal('nutritionCalculator', 3000);
        } catch (error) {
            console.error('Failed to load nutrition calculator:', error);
            return false;
        }
    }
    
    /**
     * Load a script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Wait for a global variable to be available
     */
    waitForGlobal(globalName, timeout = 3000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = 50;
            
            const check = () => {
                if (window[globalName]) {
                    resolve(true);
                    return;
                }
                
                if (Date.now() - startTime >= timeout) {
                    resolve(false);
                    return;
                }
                
                setTimeout(check, checkInterval);
            };
            
            check();
        });
    }
    
    /**
     * Update action availability based on current context
     */
    updateActionAvailability() {
        const hasPets = this.pets.length > 0;
        
        this.actions.forEach((action, name) => {
            const wasEnabled = action.enabled;
            action.enabled = !action.requiresPets || hasPets;
            
            // Re-render if availability changed
            if (wasEnabled !== action.enabled) {
                this.updateActionButton(name, action);
            }
        });
    }
    
    /**
     * Update a specific action button
     */
    updateActionButton(name, action) {
        const button = document.querySelector(`[data-quick-action="${name}"]`);
        if (button) {
            if (action.enabled) {
                button.classList.remove('disabled');
                button.removeAttribute('disabled');
                button.removeAttribute('aria-disabled');
                button.title = action.description;
                button.setAttribute('aria-label', action.label);
            } else {
                button.classList.add('disabled');
                button.setAttribute('disabled', 'true');
                button.setAttribute('aria-disabled', 'true');
                const disabledTitle = action.requiresPets ? 
                    'Add a pet first to use this feature' : 
                    'This feature is currently unavailable';
                button.title = disabledTitle;
                button.setAttribute('aria-label', `${action.label} (disabled)`);
            }
        }
    }
    
    /**
     * Set loading state for an action button
     */
    setActionLoading(actionName, loading = true) {
        const button = document.querySelector(`[data-quick-action="${actionName}"]`);
        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.setAttribute('aria-busy', 'true');
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-spinner';
                }
            } else {
                button.classList.remove('loading');
                button.removeAttribute('aria-busy');
                // Restore original icon
                const action = this.actions.get(actionName);
                if (action) {
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = action.icon;
                    }
                }
            }
        }
    }
    
    /**
     * Set success state for an action button
     */
    setActionSuccess(actionName, duration = 2000) {
        const button = document.querySelector(`[data-quick-action="${actionName}"]`);
        if (button) {
            button.classList.add('success');
            const icon = button.querySelector('i');
            if (icon) {
                const originalIcon = icon.className;
                icon.className = 'fas fa-check';
                
                setTimeout(() => {
                    button.classList.remove('success');
                    icon.className = originalIcon;
                }, duration);
            }
        }
    }
    
    /**
     * Load pet data
     */
    async loadPetData() {
        try {
            const response = await fetch('/api/pets.php', {
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.pets)) {
                    this.pets = data.pets;
                }
            }
        } catch (error) {
            console.warn('Failed to load pet data for quick actions:', error);
            this.pets = [];
        }
    }
    
    /**
     * Render quick actions
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            // Try to find the quick actions container in the dashboard
            const quickActionsCard = document.querySelector('.quick-actions');
            if (quickActionsCard) {
                this.renderInExistingContainer(quickActionsCard);
            }
            return;
        }
        
        const sortedActions = Array.from(this.actions.values())
            .filter(action => action.visible)
            .sort((a, b) => a.priority - b.priority);
        
        const html = sortedActions.map(action => this.renderActionButton(action)).join('');
        container.innerHTML = html;
        
        // Update availability after rendering
        this.updateActionAvailability();
    }
    
    /**
     * Render in existing quick actions container
     */
    renderInExistingContainer(container) {
        const actionsGrid = container.querySelector('.quick-actions') || 
                           container.querySelector('.actions-grid');
        
        if (actionsGrid) {
            const sortedActions = Array.from(this.actions.values())
                .filter(action => action.visible)
                .sort((a, b) => a.priority - b.priority);
            
            const html = sortedActions.map(action => this.renderActionCard(action)).join('');
            actionsGrid.innerHTML = html;
            
            // Update availability after rendering
            this.updateActionAvailability();
        }
    }
    
    /**
     * Render action button
     */
    renderActionButton(action) {
        const disabledTitle = action.requiresPets ? 
            'Add a pet first to use this feature' : 
            'This feature is currently unavailable';
            
        return `
            <button class="quick-action-btn ${action.enabled ? '' : 'disabled'}" 
                    data-quick-action="${action.name}"
                    data-priority="${action.priority}"
                    title="${action.enabled ? action.description : disabledTitle}"
                    aria-label="${action.label}${action.enabled ? '' : ' (disabled)'}"
                    ${action.enabled ? '' : 'disabled aria-disabled="true"'}>
                <i class="${action.icon}" aria-hidden="true"></i>
                <span>${action.label}</span>
            </button>
        `;
    }
    
    /**
     * Render action card (for existing dashboard layout)
     */
    renderActionCard(action) {
        const disabledTitle = action.requiresPets ? 
            'Add a pet first to use this feature' : 
            'This feature is currently unavailable';
            
        return `
            <button class="quick-action-btn ${action.enabled ? '' : 'disabled'}" 
                    data-quick-action="${action.name}"
                    data-priority="${action.priority}"
                    title="${action.enabled ? action.description : disabledTitle}"
                    aria-label="${action.label}${action.enabled ? '' : ' (disabled)'}"
                    ${action.enabled ? '' : 'disabled aria-disabled="true"'}>
                <i class="${action.icon}" aria-hidden="true"></i>
                <span>${action.label}</span>
            </button>
        `;
    }
    
    /**
     * Show action disabled message
     */
    showActionDisabledMessage(action) {
        const message = action.requiresPets ? 
            'Please add a pet first to use this feature.' :
            'This feature is currently unavailable.';
            
        if (this.modalManager && this.modalManager.showNotification) {
            this.modalManager.showNotification(message, 'info');
        } else {
            alert(message);
        }
    }
    
    /**
     * Show action error
     */
    showActionError(action, error) {
        const message = `Failed to execute ${action.label}: ${error.message}`;
        
        if (this.modalManager && this.modalManager.showNotification) {
            this.modalManager.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
    
    /**
     * Log action usage
     */
    logActionUsage(actionName) {
        // Simple analytics - could be enhanced
        console.log(`Quick action used: ${actionName}`);
        
        // Could send to analytics service
        try {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'quick_action_used', {
                    action_name: actionName
                });
            }
        } catch (error) {
            // Ignore analytics errors
        }
    }
    
    /**
     * Get action by name
     */
    getAction(name) {
        return this.actions.get(name);
    }
    
    /**
     * Get all actions
     */
    getAllActions() {
        return Array.from(this.actions.values());
    }
    
    /**
     * Enable/disable action
     */
    setActionEnabled(name, enabled) {
        const action = this.actions.get(name);
        if (action) {
            action.enabled = enabled;
            this.updateActionButton(name, action);
        }
    }
    
    /**
     * Show/hide action
     */
    setActionVisible(name, visible) {
        const action = this.actions.get(name);
        if (action) {
            action.visible = visible;
            this.render();
        }
    }
    
    /**
     * Remove action
     */
    removeAction(name) {
        if (this.actions.delete(name)) {
            this.render();
        }
    }
    
    /**
     * Refresh component
     */
    refresh() {
        this.loadPetData().then(() => {
            this.updateActionAvailability();
        });
    }
    
    /**
     * Destroy component
     */
    destroy() {
        this.actions.clear();
        this.pets = [];
    }
}

// Initialize quick actions when DOM is ready
let quickActions = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.dashboard-container')) {
            quickActions = new QuickActions();
            window.quickActions = quickActions;
        }
    });
} else {
    if (document.querySelector('.dashboard-container')) {
        quickActions = new QuickActions();
        window.quickActions = quickActions;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickActions;
}