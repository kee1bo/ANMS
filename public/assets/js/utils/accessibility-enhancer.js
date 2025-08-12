/**
 * Accessibility Enhancer Utility
 * Improves accessibility features for the dashboard
 */
class AccessibilityEnhancer {
    constructor(options = {}) {
        this.options = {
            enableKeyboardNavigation: options.enableKeyboardNavigation !== false,
            enableScreenReaderSupport: options.enableScreenReaderSupport !== false,
            enableFocusManagement: options.enableFocusManagement !== false,
            enableAnnouncements: options.enableAnnouncements !== false,
            announceDelay: options.announceDelay || 100,
            ...options
        };
        
        this.focusHistory = [];
        this.announcer = null;
        this.keyboardNavigation = null;
        
        this.init();
    }
    
    init() {
        this.setupScreenReaderSupport();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupAnnouncements();
        this.enhanceExistingElements();
    }
    
    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        if (!this.options.enableScreenReaderSupport) return;
        
        // Add skip links
        this.addSkipLinks();
        
        // Add ARIA landmarks
        this.addLandmarks();
        
        // Enhance form labels
        this.enhanceFormLabels();
        
        // Add ARIA descriptions
        this.addAriaDescriptions();
        
        // Setup live regions
        this.setupLiveRegions();
    }
    
    /**
     * Add skip navigation links
     */
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#dashboard-stats" class="skip-link">Skip to statistics</a>
            <a href="#quick-actions" class="skip-link">Skip to quick actions</a>
            <a href="#recent-activity" class="skip-link">Skip to recent activity</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }
    
    /**
     * Add ARIA landmarks
     */
    addLandmarks() {
        // Main content area
        const mainContent = document.querySelector('.dashboard-container') || 
                           document.querySelector('main') ||
                           document.querySelector('.main-content');
        
        if (mainContent && !mainContent.getAttribute('role')) {
            mainContent.setAttribute('role', 'main');
            mainContent.setAttribute('aria-label', 'Pet Management Dashboard');
            mainContent.id = mainContent.id || 'main-content';
        }
        
        // Navigation areas
        const navElements = document.querySelectorAll('.dashboard-nav, .tab-navigation, .breadcrumb');
        navElements.forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });
        
        // Complementary content
        const sidebar = document.querySelector('.dashboard-sidebar, .activity-feed');
        if (sidebar && !sidebar.getAttribute('role')) {
            sidebar.setAttribute('role', 'complementary');
            sidebar.setAttribute('aria-label', 'Dashboard sidebar');
        }
        
        // Banner/header
        const header = document.querySelector('.dashboard-header, header');
        if (header && !header.getAttribute('role')) {
            header.setAttribute('role', 'banner');
        }
    }
    
    /**
     * Enhance form labels and inputs
     */
    enhanceFormLabels() {
        // Associate labels with inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                const label = document.querySelector(`label[for="${input.id}"]`) ||
                             input.closest('.form-group')?.querySelector('label') ||
                             input.previousElementSibling?.tagName === 'LABEL' ? input.previousElementSibling : null;
                
                if (label) {
                    if (!input.id) {
                        input.id = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    }
                    label.setAttribute('for', input.id);
                } else {
                    // Add aria-label based on placeholder or nearby text
                    const placeholder = input.getAttribute('placeholder');
                    if (placeholder) {
                        input.setAttribute('aria-label', placeholder);
                    }
                }
            }
            
            // Add required indicator
            if (input.hasAttribute('required') && !input.getAttribute('aria-required')) {
                input.setAttribute('aria-required', 'true');
            }
            
            // Add invalid state
            if (input.classList.contains('invalid') || input.classList.contains('error')) {
                input.setAttribute('aria-invalid', 'true');
            }
        });
    }
    
    /**
     * Add ARIA descriptions to elements
     */
    addAriaDescriptions() {
        // Statistics cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            if (!card.getAttribute('aria-describedby')) {
                const value = card.querySelector('.stat-value')?.textContent;
                const label = card.querySelector('.stat-label')?.textContent;
                const change = card.querySelector('.stat-change')?.textContent;
                
                if (value && label) {
                    let description = `${label}: ${value}`;
                    if (change) {
                        description += `. ${change}`;
                    }
                    
                    card.setAttribute('aria-label', description);
                    card.setAttribute('role', 'img');
                }
            }
        });
        
        // Quick action buttons
        const quickActions = document.querySelectorAll('.quick-action-btn');
        quickActions.forEach(btn => {
            if (!btn.getAttribute('aria-describedby')) {
                const label = btn.querySelector('.quick-action-label')?.textContent;
                const description = btn.querySelector('.quick-action-description')?.textContent;
                
                if (label) {
                    let ariaLabel = label;
                    if (description) {
                        ariaLabel += `. ${description}`;
                    }
                    btn.setAttribute('aria-label', ariaLabel);
                }
            }
        });
        
        // Activity items
        const activityItems = document.querySelectorAll('.activity-item');
        activityItems.forEach(item => {
            if (!item.getAttribute('aria-label')) {
                const text = item.querySelector('.activity-text')?.textContent;
                const time = item.querySelector('.activity-time')?.textContent;
                const pet = item.querySelector('.activity-pet')?.textContent;
                
                if (text) {
                    let ariaLabel = text;
                    if (pet) ariaLabel += ` for ${pet}`;
                    if (time) ariaLabel += `, ${time}`;
                    
                    item.setAttribute('aria-label', ariaLabel);
                }
            }
        });
    }
    
    /**
     * Setup live regions for announcements
     */
    setupLiveRegions() {
        // Create polite announcer
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only';
        this.announcer.id = 'announcer';
        document.body.appendChild(this.announcer);
        
        // Create assertive announcer for urgent messages
        this.urgentAnnouncer = document.createElement('div');
        this.urgentAnnouncer.setAttribute('aria-live', 'assertive');
        this.urgentAnnouncer.setAttribute('aria-atomic', 'true');
        this.urgentAnnouncer.className = 'sr-only';
        this.urgentAnnouncer.id = 'urgent-announcer';
        document.body.appendChild(this.urgentAnnouncer);
        
        // Status region for loading states
        this.statusRegion = document.createElement('div');
        this.statusRegion.setAttribute('aria-live', 'polite');
        this.statusRegion.setAttribute('role', 'status');
        this.statusRegion.className = 'sr-only';
        this.statusRegion.id = 'status-region';
        document.body.appendChild(this.statusRegion);
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        if (!this.options.enableKeyboardNavigation) return;
        
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        // Add tabindex to interactive elements that need it
        this.enhanceTabNavigation();
        
        // Setup roving tabindex for groups
        this.setupRovingTabindex();
    }
    
    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        const { key, ctrlKey, altKey, shiftKey } = event;
        
        // Skip if user is typing in an input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
            return;
        }
        
        switch (key) {
            case 'Escape':
                this.handleEscape(event);
                break;
                
            case 'Tab':
                this.handleTab(event);
                break;
                
            case 'Enter':
            case ' ':
                this.handleActivation(event);
                break;
                
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.handleArrowNavigation(event);
                break;
                
            case 'Home':
            case 'End':
                this.handleHomeEnd(event);
                break;
        }
        
        // Keyboard shortcuts
        if (ctrlKey || altKey) {
            this.handleKeyboardShortcuts(event);
        }
    }
    
    /**
     * Handle escape key
     */
    handleEscape(event) {
        // Close modals
        const modal = document.querySelector('.modal-overlay:not([style*="display: none"])');
        if (modal && typeof closeModal === 'function') {
            closeModal();
            event.preventDefault();
            return;
        }
        
        // Clear focus from current element
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
            event.preventDefault();
        }
    }
    
    /**
     * Handle tab navigation
     */
    handleTab(event) {
        // Track focus history
        this.focusHistory.push(document.activeElement);
        if (this.focusHistory.length > 10) {
            this.focusHistory.shift();
        }
        
        // Trap focus in modals
        const modal = document.querySelector('.modal-overlay:not([style*="display: none"])');\n        if (modal) {\n            this.trapFocusInModal(event, modal);\n        }\n    }\n    \n    /**\n     * Trap focus within modal\n     */\n    trapFocusInModal(event, modal) {\n        const focusableElements = modal.querySelectorAll(\n            'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'\n        );\n        \n        const firstElement = focusableElements[0];\n        const lastElement = focusableElements[focusableElements.length - 1];\n        \n        if (event.shiftKey) {\n            if (document.activeElement === firstElement) {\n                lastElement.focus();\n                event.preventDefault();\n            }\n        } else {\n            if (document.activeElement === lastElement) {\n                firstElement.focus();\n                event.preventDefault();\n            }\n        }\n    }\n    \n    /**\n     * Handle activation (Enter/Space)\n     */\n    handleActivation(event) {\n        const target = event.target;\n        \n        // Handle custom interactive elements\n        if (target.classList.contains('activity-item') || \n            target.classList.contains('stat-card') ||\n            target.classList.contains('quick-action-btn')) {\n            \n            if (target.onclick) {\n                target.onclick(event);\n            } else {\n                target.click();\n            }\n            event.preventDefault();\n        }\n    }\n    \n    /**\n     * Handle arrow navigation\n     */\n    handleArrowNavigation(event) {\n        const target = event.target;\n        const parent = target.closest('.dashboard-stats, .quick-actions, .activity-feed');\n        \n        if (!parent) return;\n        \n        const items = Array.from(parent.querySelectorAll('[tabindex=\"0\"], [tabindex=\"-1\"]'));\n        const currentIndex = items.indexOf(target);\n        \n        if (currentIndex === -1) return;\n        \n        let nextIndex;\n        \n        switch (event.key) {\n            case 'ArrowUp':\n                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;\n                break;\n            case 'ArrowDown':\n                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;\n                break;\n            case 'ArrowLeft':\n                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;\n                break;\n            case 'ArrowRight':\n                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;\n                break;\n        }\n        \n        if (nextIndex !== undefined) {\n            items[nextIndex].focus();\n            event.preventDefault();\n        }\n    }\n    \n    /**\n     * Handle Home/End keys\n     */\n    handleHomeEnd(event) {\n        const target = event.target;\n        const parent = target.closest('.dashboard-stats, .quick-actions, .activity-feed');\n        \n        if (!parent) return;\n        \n        const items = Array.from(parent.querySelectorAll('[tabindex=\"0\"], [tabindex=\"-1\"]'));\n        \n        if (event.key === 'Home') {\n            items[0]?.focus();\n        } else if (event.key === 'End') {\n            items[items.length - 1]?.focus();\n        }\n        \n        event.preventDefault();\n    }\n    \n    /**\n     * Handle keyboard shortcuts\n     */\n    handleKeyboardShortcuts(event) {\n        const { key, ctrlKey, altKey } = event;\n        \n        // Alt + number for quick actions\n        if (altKey && /^[1-9]$/.test(key)) {\n            const quickActions = document.querySelectorAll('.quick-action-btn');\n            const index = parseInt(key) - 1;\n            \n            if (quickActions[index]) {\n                quickActions[index].click();\n                event.preventDefault();\n            }\n        }\n        \n        // Ctrl + shortcuts\n        if (ctrlKey) {\n            switch (key) {\n                case 'r':\n                    // Refresh dashboard\n                    if (typeof refreshDashboard === 'function') {\n                        refreshDashboard();\n                        event.preventDefault();\n                    }\n                    break;\n                    \n                case 'h':\n                    // Go to home/dashboard\n                    if (typeof goToDashboard === 'function') {\n                        goToDashboard();\n                        event.preventDefault();\n                    }\n                    break;\n            }\n        }\n    }\n    \n    /**\n     * Enhance tab navigation\n     */\n    enhanceTabNavigation() {\n        // Make interactive elements focusable\n        const interactiveElements = document.querySelectorAll(\n            '.stat-card, .quick-action-btn, .activity-item'\n        );\n        \n        interactiveElements.forEach(element => {\n            if (!element.hasAttribute('tabindex')) {\n                element.setAttribute('tabindex', '0');\n            }\n        });\n    }\n    \n    /**\n     * Setup roving tabindex for groups\n     */\n    setupRovingTabindex() {\n        const groups = document.querySelectorAll('.dashboard-stats, .quick-actions');\n        \n        groups.forEach(group => {\n            const items = group.querySelectorAll('[tabindex]');\n            \n            if (items.length === 0) return;\n            \n            // Set first item as focusable, others as not\n            items.forEach((item, index) => {\n                item.setAttribute('tabindex', index === 0 ? '0' : '-1');\n            });\n            \n            // Handle focus events\n            group.addEventListener('focusin', (event) => {\n                // Remove tabindex from all items\n                items.forEach(item => item.setAttribute('tabindex', '-1'));\n                // Set current item as focusable\n                event.target.setAttribute('tabindex', '0');\n            });\n        });\n    }\n    \n    /**\n     * Setup focus management\n     */\n    setupFocusManagement() {\n        if (!this.options.enableFocusManagement) return;\n        \n        // Focus management for dynamic content\n        this.observeContentChanges();\n        \n        // Focus restoration\n        this.setupFocusRestoration();\n    }\n    \n    /**\n     * Observe content changes for focus management\n     */\n    observeContentChanges() {\n        const observer = new MutationObserver((mutations) => {\n            mutations.forEach(mutation => {\n                if (mutation.type === 'childList') {\n                    mutation.addedNodes.forEach(node => {\n                        if (node.nodeType === Node.ELEMENT_NODE) {\n                            this.enhanceNewContent(node);\n                        }\n                    });\n                }\n            });\n        });\n        \n        observer.observe(document.body, {\n            childList: true,\n            subtree: true\n        });\n    }\n    \n    /**\n     * Enhance newly added content\n     */\n    enhanceNewContent(element) {\n        // Add accessibility attributes to new elements\n        this.enhanceFormLabels();\n        this.addAriaDescriptions();\n        this.enhanceTabNavigation();\n        \n        // Focus new modal content\n        if (element.classList?.contains('modal-overlay')) {\n            setTimeout(() => {\n                const firstFocusable = element.querySelector(\n                    'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'\n                );\n                if (firstFocusable) {\n                    firstFocusable.focus();\n                }\n            }, 100);\n        }\n    }\n    \n    /**\n     * Setup focus restoration\n     */\n    setupFocusRestoration() {\n        // Store focus before modal opens\n        document.addEventListener('modalOpened', () => {\n            this.focusHistory.push(document.activeElement);\n        });\n        \n        // Restore focus when modal closes\n        document.addEventListener('modalClosed', () => {\n            const previousFocus = this.focusHistory.pop();\n            if (previousFocus && previousFocus.focus) {\n                setTimeout(() => {\n                    previousFocus.focus();\n                }, 100);\n            }\n        });\n    }\n    \n    /**\n     * Announce message to screen readers\n     */\n    announce(message, urgent = false) {\n        if (!this.options.enableAnnouncements) return;\n        \n        const announcer = urgent ? this.urgentAnnouncer : this.announcer;\n        \n        // Clear previous message\n        announcer.textContent = '';\n        \n        // Add new message after a brief delay\n        setTimeout(() => {\n            announcer.textContent = message;\n        }, this.options.announceDelay);\n        \n        // Clear message after announcement\n        setTimeout(() => {\n            announcer.textContent = '';\n        }, this.options.announceDelay + 3000);\n    }\n    \n    /**\n     * Update status region\n     */\n    updateStatus(status) {\n        if (this.statusRegion) {\n            this.statusRegion.textContent = status;\n        }\n    }\n    \n    /**\n     * Enhance existing elements\n     */\n    enhanceExistingElements() {\n        // Add role and aria-label to buttons without them\n        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');\n        buttons.forEach(button => {\n            const text = button.textContent.trim() || button.title || button.alt;\n            if (text) {\n                button.setAttribute('aria-label', text);\n            }\n        });\n        \n        // Enhance images\n        const images = document.querySelectorAll('img:not([alt])');\n        images.forEach(img => {\n            img.setAttribute('alt', img.title || 'Image');\n        });\n        \n        // Add headings structure\n        this.improveHeadingStructure();\n    }\n    \n    /**\n     * Improve heading structure\n     */\n    improveHeadingStructure() {\n        // Ensure proper heading hierarchy\n        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');\n        let currentLevel = 0;\n        \n        headings.forEach(heading => {\n            const level = parseInt(heading.tagName.charAt(1));\n            \n            // Skip if heading level is appropriate\n            if (level <= currentLevel + 1) {\n                currentLevel = level;\n                return;\n            }\n            \n            // Fix heading level if it skips levels\n            const correctLevel = Math.min(level, currentLevel + 1);\n            if (correctLevel !== level) {\n                const newHeading = document.createElement(`h${correctLevel}`);\n                newHeading.innerHTML = heading.innerHTML;\n                newHeading.className = heading.className;\n                heading.parentNode.replaceChild(newHeading, heading);\n            }\n            \n            currentLevel = correctLevel;\n        });\n    }\n    \n    /**\n     * Get accessibility report\n     */\n    getAccessibilityReport() {\n        const report = {\n            skipLinks: document.querySelectorAll('.skip-link').length,\n            landmarks: document.querySelectorAll('[role=\"main\"], [role=\"navigation\"], [role=\"banner\"], [role=\"complementary\"]').length,\n            headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,\n            images: {\n                total: document.querySelectorAll('img').length,\n                withAlt: document.querySelectorAll('img[alt]').length\n            },\n            forms: {\n                inputs: document.querySelectorAll('input, select, textarea').length,\n                labeled: document.querySelectorAll('input[aria-label], input[aria-labelledby], select[aria-label], select[aria-labelledby], textarea[aria-label], textarea[aria-labelledby]').length\n            },\n            interactive: {\n                total: document.querySelectorAll('button, a, [tabindex]').length,\n                focusable: document.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex=\"-1\"])').length\n            },\n            liveRegions: document.querySelectorAll('[aria-live]').length\n        };\n        \n        return report;\n    }\n    \n    /**\n     * Destroy accessibility enhancer\n     */\n    destroy() {\n        // Remove event listeners\n        document.removeEventListener('keydown', this.handleKeyboardNavigation);\n        \n        // Remove added elements\n        if (this.announcer) {\n            this.announcer.remove();\n        }\n        if (this.urgentAnnouncer) {\n            this.urgentAnnouncer.remove();\n        }\n        if (this.statusRegion) {\n            this.statusRegion.remove();\n        }\n        \n        // Clear data\n        this.focusHistory = [];\n    }\n}\n\n// Create global accessibility enhancer instance\nlet accessibilityEnhancer = null;\n\nif (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', () => {\n        accessibilityEnhancer = new AccessibilityEnhancer();\n        window.accessibilityEnhancer = accessibilityEnhancer;\n    });\n} else {\n    accessibilityEnhancer = new AccessibilityEnhancer();\n    window.accessibilityEnhancer = accessibilityEnhancer;\n}\n\n// Export for module systems\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = AccessibilityEnhancer;\n}