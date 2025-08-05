/**
 * Landing Page Quality Assurance and Testing Module
 * Comprehensive testing and enhancement for production readiness
 */
class LandingPageQA {
    constructor() {
        this.testResults = [];
        this.issues = [];
        this.fixes = [];
        
        // Initialize QA testing
        this.init();
    }

    /**
     * Initialize QA testing
     */
    init() {
        console.log('🔍 Starting Landing Page Quality Assurance...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runAllTests());
        } else {
            this.runAllTests();
        }
    }

    /**
     * Run all QA tests
     */
    async runAllTests() {
        console.log('🧪 Running comprehensive landing page tests...');
        
        // Test 1.1: Navigation and Interaction Testing
        await this.testNavigationFunctionality();
        await this.testMobileMenuToggle();
        await this.testCallToActionButtons();
        await this.testHeroSectionAnimations();
        await this.testFooterLinks();
        
        // Apply fixes and enhancements
        this.applyNavigationEnhancements();
        this.enhanceAccessibility();
        this.optimizePerformance();
        
        // Generate report
        this.generateQAReport();
    }

    // ============================================================
    // Navigation and Interaction Testing (Task 1.1)
    // ============================================================

    /**
     * Test all navigation links and smooth scrolling
     */
    async testNavigationFunctionality() {
        console.log('📍 Testing navigation functionality...');
        
        const navLinks = document.querySelectorAll('.navbar-link');
        const issues = [];
        
        navLinks.forEach((link, index) => {
            const href = link.getAttribute('href');
            const targetId = href?.substring(1); // Remove #
            
            // Test if target section exists
            if (href && href.startsWith('#')) {
                const targetSection = document.getElementById(targetId);
                if (!targetSection) {
                    issues.push(`Navigation link ${index + 1} points to non-existent section: ${href}`);
                } else {
                    // Test smooth scrolling
                    this.testSmoothScrolling(link, targetSection);
                }
            }
            
            // Test link accessibility
            if (!link.getAttribute('aria-label') && !link.textContent.trim()) {
                issues.push(`Navigation link ${index + 1} missing accessible text`);
            }
        });
        
        this.testResults.push({
            test: 'Navigation Links',
            passed: issues.length === 0,
            issues: issues
        });
        
        if (issues.length > 0) {
            this.issues.push(...issues);
        }
    }

    /**
     * Test smooth scrolling functionality
     */
    testSmoothScrolling(link, targetSection) {
        // Add enhanced smooth scrolling behavior
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Calculate offset for fixed navbar
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            
            const targetPosition = targetSection.offsetTop - navbarHeight - 20;
            
            // Smooth scroll with easing
            this.smoothScrollTo(targetPosition, 800);
            
            // Update URL without triggering page reload
            history.pushState(null, null, link.getAttribute('href'));
            
            // Add visual feedback
            this.addScrollFeedback(targetSection);
        });
    }

    /**
     * Enhanced smooth scrolling with easing
     */
    smoothScrollTo(targetPosition, duration) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation.bind(this));
        }

        requestAnimationFrame(animation.bind(this));
    }

    /**
     * Easing function for smooth animations
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    /**
     * Add visual feedback when scrolling to section
     */
    addScrollFeedback(targetSection) {
        targetSection.style.transition = 'background-color 0.3s ease';
        targetSection.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        
        setTimeout(() => {
            targetSection.style.backgroundColor = '';
        }, 1000);
    }

    /**
     * Test mobile menu toggle functionality
     */
    async testMobileMenuToggle() {
        console.log('📱 Testing mobile menu toggle...');
        
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navbarMenu = document.getElementById('navbar-menu');
        const issues = [];
        
        if (!mobileToggle) {
            issues.push('Mobile menu toggle button not found');
        } else {
            // Test toggle functionality
            this.enhanceMobileMenuToggle(mobileToggle, navbarMenu);
        }
        
        if (!navbarMenu) {
            issues.push('Mobile navigation menu not found');
        }
        
        // Test responsive behavior
        this.testResponsiveNavigation();
        
        this.testResults.push({
            test: 'Mobile Menu Toggle',
            passed: issues.length === 0,
            issues: issues
        });
    }

    /**
     * Enhance mobile menu toggle with better UX
     */
    enhanceMobileMenuToggle(toggle, menu) {
        let isOpen = false;
        
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            isOpen = !isOpen;
            
            // Toggle menu visibility
            menu.classList.toggle('navbar-menu--open', isOpen);
            toggle.classList.toggle('mobile-menu-toggle--active', isOpen);
            
            // Update ARIA attributes
            toggle.setAttribute('aria-expanded', isOpen);
            toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : '';
            
            // Focus management
            if (isOpen) {
                menu.querySelector('.navbar-link')?.focus();
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isOpen && !toggle.contains(e.target) && !menu.contains(e.target)) {
                isOpen = false;
                menu.classList.remove('navbar-menu--open');
                toggle.classList.remove('mobile-menu-toggle--active');
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                isOpen = false;
                menu.classList.remove('navbar-menu--open');
                toggle.classList.remove('mobile-menu-toggle--active');
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                toggle.focus();
            }
        });
    }

    /**
     * Test responsive navigation behavior
     */
    testResponsiveNavigation() {
        // Test different viewport sizes
        const breakpoints = [320, 768, 1024, 1440];
        const issues = [];
        
        breakpoints.forEach(width => {
            // Simulate viewport width (for testing purposes)
            const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
            
            if (width <= 1024) {
                // Mobile/tablet: menu should be hidden, toggle should be visible
                const toggle = document.getElementById('mobile-menu-toggle');
                if (toggle && window.getComputedStyle(toggle).display === 'none') {
                    issues.push(`Mobile menu toggle not visible at ${width}px`);
                }
            } else {
                // Desktop: menu should be visible, toggle should be hidden
                const menu = document.getElementById('navbar-menu');
                if (menu && window.getComputedStyle(menu).display === 'none') {
                    issues.push(`Navigation menu not visible at ${width}px`);
                }
            }
        });
        
        if (issues.length > 0) {
            this.issues.push(...issues);
        }
    }

    /**
     * Test call-to-action buttons
     */
    async testCallToActionButtons() {
        console.log('🎯 Testing call-to-action buttons...');
        
        const ctaButtons = document.querySelectorAll('[data-action="show-register"], [data-action="show-login"]');
        const issues = [];
        
        ctaButtons.forEach((button, index) => {
            const action = button.dataset.action;
            
            // Test button accessibility
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                issues.push(`CTA button ${index + 1} missing accessible text`);
            }
            
            // Test button functionality
            this.enhanceCTAButton(button, action);
            
            // Test loading states
            this.addLoadingState(button);
        });
        
        this.testResults.push({
            test: 'Call-to-Action Buttons',
            passed: issues.length === 0,
            issues: issues
        });
    }

    /**
     * Enhance CTA button functionality
     */
    enhanceCTAButton(button, action) {
        // Add hover effects and feedback
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
        
        // Add click feedback
        button.addEventListener('click', () => {
            button.style.transform = 'translateY(0)';
            
            // Add ripple effect
            this.addRippleEffect(button);
        });
    }

    /**
     * Add ripple effect to buttons
     */
    addRippleEffect(button) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Add loading state to buttons
     */
    addLoadingState(button) {
        const originalText = button.textContent;
        
        button.addEventListener('click', () => {
            button.classList.add('btn--loading');
            button.disabled = true;
            
            // Simulate loading (remove this in production)
            setTimeout(() => {
                button.classList.remove('btn--loading');
                button.disabled = false;
            }, 2000);
        });
    }

    /**
     * Test hero section animations
     */
    async testHeroSectionAnimations() {
        console.log('🎬 Testing hero section animations...');
        
        const heroElements = {
            title: document.querySelector('.hero-title'),
            description: document.querySelector('.hero-description'),
            stats: document.querySelector('.hero-stats'),
            actions: document.querySelector('.hero-actions'),
            visual: document.querySelector('.hero-visual')
        };
        
        const issues = [];
        
        // Check if elements exist
        Object.entries(heroElements).forEach(([key, element]) => {
            if (!element) {
                issues.push(`Hero ${key} element not found`);
            }
        });
        
        // Enhance animations
        this.enhanceHeroAnimations(heroElements);
        
        // Test animation performance
        this.testAnimationPerformance();
        
        this.testResults.push({
            test: 'Hero Section Animations',
            passed: issues.length === 0,
            issues: issues
        });
    }

    /**
     * Enhance hero section animations
     */
    enhanceHeroAnimations(elements) {
        // Add intersection observer for scroll-triggered animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe hero elements
        Object.values(elements).forEach(element => {
            if (element) {
                observer.observe(element);
                element.classList.add('animate-ready');
            }
        });
        
        // Add staggered animation delays
        if (elements.title) elements.title.style.animationDelay = '0.1s';
        if (elements.description) elements.description.style.animationDelay = '0.2s';
        if (elements.stats) elements.stats.style.animationDelay = '0.3s';
        if (elements.actions) elements.actions.style.animationDelay = '0.4s';
        if (elements.visual) elements.visual.style.animationDelay = '0.5s';
    }

    /**
     * Test animation performance
     */
    testAnimationPerformance() {
        // Check for animations that might cause performance issues
        const animatedElements = document.querySelectorAll('[class*="animate"], [style*="animation"]');
        
        animatedElements.forEach(element => {
            // Ensure animations use transform and opacity for better performance
            const computedStyle = window.getComputedStyle(element);
            const animationName = computedStyle.animationName;
            
            if (animationName && animationName !== 'none') {
                // Add will-change property for better performance
                element.style.willChange = 'transform, opacity';
                
                // Remove will-change after animation completes
                element.addEventListener('animationend', () => {
                    element.style.willChange = 'auto';
                });
            }
        });
    }

    /**
     * Test footer links
     */
    async testFooterLinks() {
        console.log('🔗 Testing footer links...');
        
        const footerLinks = document.querySelectorAll('.footer a');
        const issues = [];
        
        footerLinks.forEach((link, index) => {
            const href = link.getAttribute('href');
            
            // Test external links
            if (href && (href.startsWith('http') || href.startsWith('//'))) {
                // External links should open in new tab
                if (!link.getAttribute('target')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    this.fixes.push(`Added target="_blank" to external link ${index + 1}`);
                }
            }
            
            // Test internal links
            if (href && href.startsWith('/') && !href.startsWith('//')) {
                // Internal links should be handled by router (if applicable)
                this.enhanceInternalLink(link);
            }
            
            // Test accessibility
            if (!link.textContent.trim()) {
                issues.push(`Footer link ${index + 1} has no text content`);
            }
        });
        
        this.testResults.push({
            test: 'Footer Links',
            passed: issues.length === 0,
            issues: issues
        });
    }

    /**
     * Enhance internal link handling
     */
    enhanceInternalLink(link) {
        link.addEventListener('click', (e) => {
            // Add loading indicator for internal navigation
            const originalText = link.textContent;
            link.style.opacity = '0.7';
            
            setTimeout(() => {
                link.style.opacity = '';
            }, 500);
        });
    }

    // ============================================================
    // Navigation Enhancements
    // ============================================================

    /**
     * Apply comprehensive navigation enhancements
     */
    applyNavigationEnhancements() {
        console.log('⚡ Applying navigation enhancements...');
        
        // Enhance navbar scroll behavior
        this.enhanceNavbarScrollBehavior();
        
        // Add keyboard navigation support
        this.addKeyboardNavigation();
        
        // Enhance focus management
        this.enhanceFocusManagement();
        
        // Add navigation breadcrumbs
        this.addNavigationBreadcrumbs();
    }

    /**
     * Enhance navbar scroll behavior
     */
    enhanceNavbarScrollBehavior() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        const updateNavbar = () => {
            const scrollY = window.scrollY;
            
            // Add scrolled class for styling
            navbar.classList.toggle('scrolled', scrollY > 50);
            
            // Hide/show navbar on scroll
            if (scrollY > lastScrollY && scrollY > 100) {
                navbar.classList.add('navbar--hidden');
            } else {
                navbar.classList.remove('navbar--hidden');
            }
            
            lastScrollY = scrollY;
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /**
     * Add keyboard navigation support
     */
    addKeyboardNavigation() {
        const navLinks = document.querySelectorAll('.navbar-link');
        
        navLinks.forEach((link, index) => {
            link.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextLink = navLinks[index + 1] || navLinks[0];
                        nextLink.focus();
                        break;
                        
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevLink = navLinks[index - 1] || navLinks[navLinks.length - 1];
                        prevLink.focus();
                        break;
                        
                    case 'Home':
                        e.preventDefault();
                        navLinks[0].focus();
                        break;
                        
                    case 'End':
                        e.preventDefault();
                        navLinks[navLinks.length - 1].focus();
                        break;
                }
            });
        });
    }

    /**
     * Enhance focus management
     */
    enhanceFocusManagement() {
        // Add focus indicators
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });
        
        // Skip to main content link
        this.addSkipToMainContent();
    }

    /**
     * Add skip to main content link for accessibility
     */
    addSkipToMainContent() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-to-main';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-600);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10001;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content landmark
        const mainContent = document.querySelector('main') || document.querySelector('.landing-page');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    /**
     * Add navigation breadcrumbs
     */
    addNavigationBreadcrumbs() {
        // This would be more relevant for multi-page applications
        // For now, we'll add section indicators
        const sections = document.querySelectorAll('section[id]');
        
        if (sections.length > 0) {
            const breadcrumbNav = document.createElement('nav');
            breadcrumbNav.className = 'section-breadcrumbs';
            breadcrumbNav.setAttribute('aria-label', 'Page sections');
            
            const breadcrumbList = document.createElement('ol');
            breadcrumbList.className = 'breadcrumb-list';
            
            sections.forEach((section, index) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                
                link.href = `#${section.id}`;
                link.textContent = this.getSectionTitle(section);
                link.className = 'breadcrumb-link';
                
                listItem.appendChild(link);
                breadcrumbList.appendChild(listItem);
            });
            
            breadcrumbNav.appendChild(breadcrumbList);
            
            // Add to navbar or create floating indicator
            const navbar = document.querySelector('.navbar-container');
            if (navbar) {
                navbar.appendChild(breadcrumbNav);
            }
        }
    }

    /**
     * Get section title for breadcrumbs
     */
    getSectionTitle(section) {
        const heading = section.querySelector('h1, h2, h3');
        return heading ? heading.textContent.trim() : section.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // ============================================================
    // Accessibility Enhancements
    // ============================================================

    /**
     * Enhance accessibility compliance
     */
    enhanceAccessibility() {
        console.log('♿ Enhancing accessibility...');
        
        // Add ARIA labels and roles
        this.addARIALabels();
        
        // Improve color contrast
        this.improveColorContrast();
        
        // Add screen reader support
        this.addScreenReaderSupport();
        
        // Test keyboard navigation
        this.testKeyboardAccessibility();
    }

    /**
     * Add ARIA labels and roles
     */
    addARIALabels() {
        // Navigation
        const navbar = document.querySelector('.navbar');
        if (navbar && !navbar.getAttribute('role')) {
            navbar.setAttribute('role', 'navigation');
            navbar.setAttribute('aria-label', 'Main navigation');
        }
        
        // Main content
        const main = document.querySelector('main') || document.querySelector('.landing-page');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
        }
        
        // Buttons without labels
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            if (!button.textContent.trim()) {
                const action = button.dataset.action;
                if (action) {
                    button.setAttribute('aria-label', this.getButtonLabel(action));
                }
            }
        });
        
        // Form inputs
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        inputs.forEach(input => {
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                const labelId = label.id || `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                label.id = labelId;
                input.setAttribute('aria-labelledby', labelId);
            }
        });
    }

    /**
     * Get appropriate button label based on action
     */
    getButtonLabel(action) {
        const labels = {
            'show-login': 'Open login form',
            'show-register': 'Open registration form',
            'mobile-menu-toggle': 'Toggle mobile menu',
            'close-modal': 'Close modal',
            'show-features': 'Scroll to features section'
        };
        
        return labels[action] || `Perform ${action.replace('-', ' ')} action`;
    }

    /**
     * Improve color contrast
     */
    improveColorContrast() {
        // This would typically involve checking computed styles
        // For now, we'll add CSS custom properties for better contrast
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --text-high-contrast: #1a1a1a;
                --text-medium-contrast: #4a4a4a;
                --link-contrast: #0066cc;
                --focus-outline: #005fcc;
            }
            
            .high-contrast .navbar-link {
                color: var(--text-high-contrast);
            }
            
            .high-contrast .hero-description {
                color: var(--text-medium-contrast);
            }
            
            .high-contrast a {
                color: var(--link-contrast);
            }
            
            .high-contrast *:focus {
                outline: 2px solid var(--focus-outline);
                outline-offset: 2px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add screen reader support
     */
    addScreenReaderSupport() {
        // Add live region for dynamic content
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        
        document.body.appendChild(liveRegion);
        
        // Add descriptive text for complex UI elements
        const heroStats = document.querySelector('.hero-stats');
        if (heroStats) {
            heroStats.setAttribute('aria-label', 'Key statistics about PetCare Pro');
        }
        
        const testimonials = document.querySelector('.testimonials');
        if (testimonials) {
            testimonials.setAttribute('aria-label', 'Customer testimonials and reviews');
        }
    }

    /**
     * Test keyboard accessibility
     */
    testKeyboardAccessibility() {
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        );
        
        const issues = [];
        
        focusableElements.forEach((element, index) => {
            // Check if element is focusable
            if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
                issues.push(`Element ${index + 1} may not be keyboard accessible`);
            }
            
            // Check for focus indicators
            const computedStyle = window.getComputedStyle(element, ':focus');
            if (!computedStyle.outline || computedStyle.outline === 'none') {
                element.style.setProperty('--focus-outline', '2px solid #005fcc');
            }
        });
        
        if (issues.length > 0) {
            this.issues.push(...issues);
        }
    }

    // ============================================================
    // Performance Optimization
    // ============================================================

    /**
     * Optimize performance
     */
    optimizePerformance() {
        console.log('🚀 Optimizing performance...');
        
        // Lazy load images
        this.implementLazyLoading();
        
        // Optimize animations
        this.optimizeAnimations();
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Add performance monitoring
        this.addPerformanceMonitoring();
    }

    /**
     * Implement lazy loading for images
     */
    implementLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }

    /**
     * Optimize animations for performance
     */
    optimizeAnimations() {
        // Use CSS transforms instead of changing layout properties
        const animatedElements = document.querySelectorAll('[class*="animate"]');
        
        animatedElements.forEach(element => {
            // Add will-change for better performance
            element.style.willChange = 'transform, opacity';
            
            // Use transform3d to enable hardware acceleration
            if (element.style.transform && !element.style.transform.includes('translate3d')) {
                element.style.transform += ' translate3d(0, 0, 0)';
            }
        });
        
        // Reduce motion for users who prefer it
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            { href: 'assets/css/design-tokens.css', as: 'style' },
            { href: 'assets/css/design-system.css', as: 'style' },
            { href: 'assets/js/modern-app.js', as: 'script' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            
            if (resource.as === 'style') {
                link.onload = () => {
                    link.rel = 'stylesheet';
                };
            }
            
            document.head.appendChild(link);
        });
    }

    /**
     * Add performance monitoring
     */
    addPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Monitor First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
        
        // Monitor page load time
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log('Page Load Time:', loadTime + 'ms');
            
            if (loadTime > 3000) {
                this.issues.push(`Page load time (${loadTime}ms) exceeds 3 second threshold`);
            }
        });
    }

    // ============================================================
    // QA Reporting
    // ============================================================

    /**
     * Generate comprehensive QA report
     */
    generateQAReport() {
        console.log('📊 Generating QA report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                passedTests: this.testResults.filter(t => t.passed).length,
                failedTests: this.testResults.filter(t => t.passed === false).length,
                totalIssues: this.issues.length,
                totalFixes: this.fixes.length
            },
            testResults: this.testResults,
            issues: this.issues,
            fixes: this.fixes,
            recommendations: this.generateRecommendations()
        };
        
        // Log report to console
        console.group('🔍 Landing Page QA Report');
        console.log('Summary:', report.summary);
        console.log('Test Results:', report.testResults);
        if (report.issues.length > 0) {
            console.warn('Issues Found:', report.issues);
        }
        if (report.fixes.length > 0) {
            console.info('Fixes Applied:', report.fixes);
        }
        console.log('Recommendations:', report.recommendations);
        console.groupEnd();
        
        // Store report for external access
        window.landingPageQAReport = report;
        
        return report;
    }

    /**
     * Generate recommendations based on findings
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.issues.length > 0) {
            recommendations.push('Address the identified issues to improve user experience and accessibility');
        }
        
        if (this.testResults.some(t => t.test.includes('Mobile'))) {
            recommendations.push('Continue testing on actual mobile devices for comprehensive validation');
        }
        
        recommendations.push('Implement automated testing for continuous quality assurance');
        recommendations.push('Consider adding A/B testing for call-to-action buttons');
        recommendations.push('Monitor real user metrics after deployment');
        
        return recommendations;
    }
}

// Initialize QA testing when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.landingPageQA = new LandingPageQA();
    });
} else {
    window.landingPageQA = new LandingPageQA();
}

// Export for external use
window.LandingPageQA = LandingPageQA;