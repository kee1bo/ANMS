/**
 * Bundle Optimizer Utility
 * Provides lazy loading and code splitting for better performance
 */
class BundleOptimizer {
    constructor(options = {}) {
        this.options = {
            enableLazyLoading: options.enableLazyLoading !== false,
            enablePreloading: options.enablePreloading !== false,
            chunkSize: options.chunkSize || 50000, // 50KB chunks
            preloadDelay: options.preloadDelay || 2000, // 2 seconds
            ...options
        };
        
        this.loadedModules = new Set();
        this.loadingModules = new Map();
        this.preloadQueue = [];
        this.intersectionObserver = null;
        
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupPreloading();
        this.optimizeExistingScripts();
    }
    
    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        if (!window.IntersectionObserver || !this.options.enableLazyLoading) return;
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const module = element.dataset.lazyModule;
                    
                    if (module && !this.loadedModules.has(module)) {
                        this.loadModule(module);
                        this.intersectionObserver.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
    }
    
    /**
     * Setup preloading for better performance
     */
    setupPreloading() {
        if (!this.options.enablePreloading) return;
        
        // Preload critical modules after initial load
        setTimeout(() => {
            this.preloadCriticalModules();
        }, this.options.preloadDelay);
        
        // Preload on user interaction
        ['mousedown', 'touchstart'].forEach(event => {
            document.addEventListener(event, this.handleUserInteraction.bind(this), {
                once: true,
                passive: true
            });
        });
    }
    
    /**
     * Handle user interaction for preloading
     */
    handleUserInteraction() {
        this.preloadInteractiveModules();
    }
    
    /**
     * Optimize existing scripts
     */
    optimizeExistingScripts() {
        // Add loading attributes to existing scripts
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (!script.hasAttribute('async') && !script.hasAttribute('defer')) {
                // Add defer to non-critical scripts
                if (!this.isCriticalScript(script.src)) {
                    script.defer = true;
                }
            }
        });
    }
    
    /**
     * Check if script is critical
     */
    isCriticalScript(src) {
        const criticalPatterns = [
            /loading-manager/,
            /retry-manager/,
            /network-monitor/,
            /performance-monitor/,
            /app\.js$/
        ];
        
        return criticalPatterns.some(pattern => pattern.test(src));
    }
    
    /**
     * Load module dynamically
     */
    async loadModule(moduleName, options = {}) {
        if (this.loadedModules.has(moduleName)) {
            return Promise.resolve();
        }
        
        if (this.loadingModules.has(moduleName)) {
            return this.loadingModules.get(moduleName);
        }
        
        const loadPromise = this.performModuleLoad(moduleName, options);
        this.loadingModules.set(moduleName, loadPromise);
        
        try {
            await loadPromise;
            this.loadedModules.add(moduleName);
            this.loadingModules.delete(moduleName);
            
            // Trigger module loaded event
            document.dispatchEvent(new CustomEvent('moduleLoaded', {
                detail: { moduleName, options }
            }));
            
        } catch (error) {
            this.loadingModules.delete(moduleName);
            console.error(`Failed to load module ${moduleName}:`, error);
            throw error;
        }
        
        return loadPromise;
    }
    
    /**
     * Perform actual module loading
     */
    async performModuleLoad(moduleName, options) {
        const moduleConfig = this.getModuleConfig(moduleName);
        
        if (!moduleConfig) {
            throw new Error(`Module configuration not found: ${moduleName}`);
        }
        
        // Load dependencies first
        if (moduleConfig.dependencies) {
            await Promise.all(
                moduleConfig.dependencies.map(dep => this.loadModule(dep))
            );
        }
        
        // Load CSS if specified
        if (moduleConfig.css) {
            await this.loadCSS(moduleConfig.css);
        }
        
        // Load JavaScript
        if (moduleConfig.js) {
            await this.loadScript(moduleConfig.js, options);
        }
        
        // Initialize module if specified
        if (moduleConfig.init && typeof window[moduleConfig.init] === 'function') {
            window[moduleConfig.init](options);
        }
    }
    
    /**
     * Get module configuration
     */
    getModuleConfig(moduleName) {
        const moduleConfigs = {
            'nutrition-calculator': {
                js: '/assets/js/components/nutrition-calculator.js',
                css: '/assets/css/nutrition-calculator.css',
                dependencies: ['pet-form-validator'],
                init: 'initNutritionCalculator'
            },
            'meal-planner': {
                js: '/assets/js/components/meal-planner.js',
                css: '/assets/css/meal-planner.css',
                dependencies: ['nutrition-calculator'],
                init: 'initMealPlanner'
            },
            'photo-gallery': {
                js: '/assets/js/components/photo-gallery.js',
                css: '/assets/css/photo-gallery.css',
                init: 'initPhotoGallery'
            },
            'photo-upload': {
                js: '/assets/js/components/photo-upload.js',
                css: '/assets/css/photo-upload.css',
                init: 'initPhotoUpload'
            },
            'pet-registration': {
                js: '/assets/js/components/pet-registration-form.js',
                css: '/assets/css/pet-registration-form.css',
                dependencies: ['pet-form-validator'],
                init: 'initPetRegistration'
            },
            'pet-profile': {
                js: '/assets/js/components/pet-profile.js',
                css: '/assets/css/pet-profile.css',
                init: 'initPetProfile'
            },
            'health-conditions': {
                js: '/assets/js/components/health-conditions.js',
                css: '/assets/css/health-conditions.css',
                init: 'initHealthConditions'
            },
            'allergies-management': {
                js: '/assets/js/components/allergies-management.js',
                css: '/assets/css/allergies-management.css',
                init: 'initAllergiesManagement'
            },
            'pet-form-validator': {
                js: '/assets/js/components/pet-form-validator.js'
            },
            'filter-sort-interface': {
                js: '/assets/js/components/filter-sort-interface.js',
                css: '/assets/css/filter-sort-interface.css'
            }
        };
        
        return moduleConfigs[moduleName];
    }
    
    /**
     * Load CSS file
     */
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Load JavaScript file
     */
    loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            if (options.defer) {
                script.defer = true;
            }
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Preload critical modules
     */
    preloadCriticalModules() {
        const criticalModules = [
            'nutrition-calculator',
            'pet-registration',
            'photo-upload'
        ];
        
        criticalModules.forEach(module => {
            this.preloadModule(module);
        });
    }
    
    /**
     * Preload interactive modules
     */
    preloadInteractiveModules() {
        const interactiveModules = [
            'meal-planner',
            'photo-gallery',
            'pet-profile',
            'health-conditions'
        ];
        
        interactiveModules.forEach(module => {
            this.preloadModule(module);
        });
    }
    
    /**
     * Preload module (fetch without executing)
     */
    preloadModule(moduleName) {
        const moduleConfig = this.getModuleConfig(moduleName);
        if (!moduleConfig) return;
        
        // Preload JavaScript
        if (moduleConfig.js) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = moduleConfig.js;
            link.as = 'script';
            document.head.appendChild(link);
        }
        
        // Preload CSS
        if (moduleConfig.css) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = moduleConfig.css;
            link.as = 'style';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Setup lazy loading for elements
     */
    setupLazyLoading(selector, moduleName) {
        if (!this.intersectionObserver) return;
        
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.dataset.lazyModule = moduleName;
            this.intersectionObserver.observe(element);
        });
    }
    
    /**
     * Load module on demand (for user interactions)
     */
    async loadOnDemand(moduleName, options = {}) {
        try {
            // Show loading indicator if specified
            if (options.showLoading && window.loadingManager) {
                window.loadingManager.showGlobalLoading({
                    message: `Loading ${moduleName}...`
                });
            }
            
            await this.loadModule(moduleName, options);
            
            // Hide loading indicator
            if (options.showLoading && window.loadingManager) {
                window.loadingManager.hideGlobalLoading();
            }
            
            return true;
            
        } catch (error) {
            // Hide loading indicator on error
            if (options.showLoading && window.loadingManager) {
                window.loadingManager.hideGlobalLoading();
            }
            
            console.error(`Failed to load module on demand: ${moduleName}`, error);
            
            // Show error message
            if (options.showError !== false) {
                alert(`Failed to load ${moduleName}. Please try again.`);
            }
            
            return false;
        }
    }
    
    /**
     * Get loading status
     */
    getLoadingStatus() {
        return {
            loaded: Array.from(this.loadedModules),
            loading: Array.from(this.loadingModules.keys()),
            total: Object.keys(this.getModuleConfig()).length
        };
    }
    
    /**
     * Prefetch resources for better performance
     */
    prefetchResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        this.loadedModules.clear();
        this.loadingModules.clear();
        this.preloadQueue = [];
    }
}

// Create global bundle optimizer instance
let bundleOptimizer = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bundleOptimizer = new BundleOptimizer();
        window.bundleOptimizer = bundleOptimizer;
    });
} else {
    bundleOptimizer = new BundleOptimizer();
    window.bundleOptimizer = bundleOptimizer;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BundleOptimizer;
}