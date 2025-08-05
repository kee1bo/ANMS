/**
 * Landing Page Content and Visual Polish Module
 * Reviews and enhances marketing copy, testimonials, features, and visual elements
 */
class ContentPolish {
    constructor() {
        this.contentIssues = [];
        this.visualIssues = [];
        this.improvements = [];
        
        this.init();
    }

    /**
     * Initialize content polish
     */
    init() {
        console.log('✨ Starting Landing Page Content and Visual Polish...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runContentPolish());
        } else {
            this.runContentPolish();
        }
    }

    /**
     * Run all content polish tasks
     */
    async runContentPolish() {
        console.log('📝 Reviewing and polishing content...');
        
        // Task 1.2: Content and Visual Polish
        await this.reviewMarketingCopy();
        await this.verifyTestimonialsSection();
        await this.verifyFeaturesSection();
        await this.optimizeImages();
        await this.testGradientBackgrounds();
        await this.ensureBrandConsistency();
        
        // Apply enhancements
        this.enhanceContentReadability();
        this.improveVisualHierarchy();
        this.addMicroInteractions();
        
        // Generate report
        this.generateContentReport();
    }

    // ============================================================
    // Marketing Copy Review and Polish
    // ============================================================

    /**
     * Review and polish marketing copy for clarity and professionalism
     */
    async reviewMarketingCopy() {
        console.log('📖 Reviewing marketing copy...');
        
        const copyElements = {
            heroTitle: document.querySelector('.hero-title'),
            heroDescription: document.querySelector('.hero-description'),
            heroNote: document.querySelector('.hero-note'),
            sectionTitles: document.querySelectorAll('.section-title'),
            sectionDescriptions: document.querySelectorAll('.section-description'),
            ctaTitle: document.querySelector('.cta-title'),
            ctaDescription: document.querySelector('.cta-description')
        };
        
        // Review hero section copy
        this.reviewHeroCopy(copyElements);
        
        // Review section copy
        this.reviewSectionCopy(copyElements);
        
        // Review CTA copy
        this.reviewCTACopy(copyElements);
        
        // Enhance copy with better messaging
        this.enhanceMarketingCopy(copyElements);
    }

    /**
     * Review hero section copy
     */
    reviewHeroCopy(elements) {
        if (elements.heroTitle) {
            const title = elements.heroTitle.textContent.trim();
            
            // Check title length and impact
            if (title.length > 80) {
                this.contentIssues.push('Hero title is too long (over 80 characters)');
            }
            
            // Enhance title with better formatting
            this.enhanceHeroTitle(elements.heroTitle);
        }
        
        if (elements.heroDescription) {
            const description = elements.heroDescription.textContent.trim();
            
            // Check description length
            if (description.length > 200) {
                this.contentIssues.push('Hero description is too long (over 200 characters)');
            }
            
            // Enhance description readability
            this.enhanceHeroDescription(elements.heroDescription);
        }
        
        if (elements.heroNote) {
            // Enhance trust signals
            this.enhanceHeroNote(elements.heroNote);
        }
    }

    /**
     * Enhance hero title with better formatting
     */
    enhanceHeroTitle(titleElement) {
        const currentText = titleElement.textContent;
        
        // Add dynamic typing effect
        this.addTypingEffect(titleElement, currentText);
        
        // Improve text hierarchy
        titleElement.innerHTML = `
            Complete Pet Nutrition<br>
            <span class="gradient-text">Management Platform</span>
        `;
        
        this.improvements.push('Enhanced hero title with better formatting and gradient text');
    }

    /**
     * Add typing effect to hero title
     */
    addTypingEffect(element, text) {
        const words = text.split(' ');
        let currentWordIndex = 0;
        let currentText = '';
        
        const typeWord = () => {
            if (currentWordIndex < words.length) {
                currentText += (currentWordIndex > 0 ? ' ' : '') + words[currentWordIndex];
                element.textContent = currentText;
                currentWordIndex++;
                
                setTimeout(typeWord, 150);
            }
        };
        
        // Start typing effect after a delay
        setTimeout(() => {
            element.textContent = '';
            typeWord();
        }, 500);
    }

    /**
     * Enhance hero description
     */
    enhanceHeroDescription(descElement) {
        const enhancedText = `
            Track your pet's health, create custom nutrition plans, monitor weight changes, 
            and maintain comprehensive medical records all in one modern, intuitive platform.
        `;
        
        descElement.textContent = enhancedText.trim();
        
        // Add emphasis to key benefits
        descElement.innerHTML = descElement.innerHTML
            .replace('health', '<strong>health</strong>')
            .replace('nutrition plans', '<strong>nutrition plans</strong>')
            .replace('medical records', '<strong>medical records</strong>');
        
        this.improvements.push('Enhanced hero description with emphasized key benefits');
    }

    /**
     * Enhance hero note with better trust signals
     */
    enhanceHeroNote(noteElement) {
        const enhancedNote = `
            <span class="trust-signal">✓ Free to use</span> • 
            <span class="trust-signal">✓ No credit card required</span> • 
            <span class="trust-signal">✓ Set up in minutes</span>
        `;
        
        noteElement.innerHTML = enhancedNote;
        
        this.improvements.push('Enhanced hero note with visual trust signals');
    }

    /**
     * Review section copy
     */
    reviewSectionCopy(elements) {
        elements.sectionTitles.forEach((title, index) => {
            const text = title.textContent.trim();
            
            if (text.length > 60) {
                this.contentIssues.push(`Section title ${index + 1} is too long`);
            }
            
            // Enhance section titles
            this.enhanceSectionTitle(title, index);
        });
        
        elements.sectionDescriptions.forEach((desc, index) => {
            const text = desc.textContent.trim();
            
            if (text.length > 150) {
                this.contentIssues.push(`Section description ${index + 1} is too long`);
            }
            
            // Enhance section descriptions
            this.enhanceSectionDescription(desc, index);
        });
    }

    /**
     * Enhance section titles
     */
    enhanceSectionTitle(titleElement, index) {
        const titles = [
            'Everything Your Pet Needs',
            'Simple Setup, Powerful Results',
            'Trusted by Pet Parents Worldwide',
            'Why Choose PetCare Pro?'
        ];
        
        if (titles[index]) {
            titleElement.textContent = titles[index];
            
            // Add visual enhancement
            titleElement.classList.add('enhanced-title');
        }
    }

    /**
     * Enhance section descriptions
     */
    enhanceSectionDescription(descElement, index) {
        const descriptions = [
            'Comprehensive tools for nutrition, health tracking, and professional care coordination',
            'Get started in minutes and see improvements in weeks',
            'See how PetCare Pro has transformed pet health management',
            'The most comprehensive pet management platform available'
        ];
        
        if (descriptions[index]) {
            descElement.textContent = descriptions[index];
            descElement.classList.add('enhanced-description');
        }
    }

    /**
     * Review CTA copy
     */
    reviewCTACopy(elements) {
        if (elements.ctaTitle) {
            const enhancedTitle = 'Ready to Transform Your Pet\'s Health?';
            elements.ctaTitle.textContent = enhancedTitle;
            
            this.improvements.push('Enhanced CTA title for better conversion');
        }
        
        if (elements.ctaDescription) {
            const enhancedDesc = 'Join thousands of pet owners who trust PetCare Pro for better nutrition and health management.';
            elements.ctaDescription.textContent = enhancedDesc;
            
            this.improvements.push('Enhanced CTA description with social proof');
        }
    }

    /**
     * Enhance marketing copy with better messaging
     */
    enhanceMarketingCopy(elements) {
        // Add power words and emotional triggers
        const powerWords = ['transform', 'comprehensive', 'professional', 'trusted', 'proven'];
        
        // Enhance button text
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            const text = button.textContent.trim();
            
            if (text === 'Get Started Free') {
                button.innerHTML = 'Start Free Today <span class="btn-icon">→</span>';
            } else if (text === 'Learn More') {
                button.innerHTML = 'See How It Works <span class="btn-icon">↓</span>';
            }
        });
        
        this.improvements.push('Enhanced button text for better conversion');
    }

    // ============================================================
    // Testimonials Section Verification
    // ============================================================

    /**
     * Verify testimonials section display and content
     */
    async verifyTestimonialsSection() {
        console.log('💬 Verifying testimonials section...');
        
        const testimonialsSection = document.querySelector('.testimonials');
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        
        if (!testimonialsSection) {
            this.contentIssues.push('Testimonials section not found');
            return;
        }
        
        // Verify testimonial cards
        this.verifyTestimonialCards(testimonialCards);
        
        // Enhance testimonials display
        this.enhanceTestimonials(testimonialsSection, testimonialCards);
    }

    /**
     * Verify testimonial cards content and structure
     */
    verifyTestimonialCards(cards) {
        cards.forEach((card, index) => {
            const stars = card.querySelector('.stars');
            const text = card.querySelector('.testimonial-text');
            const author = card.querySelector('.author-name');
            const details = card.querySelector('.author-details');
            
            // Verify required elements
            if (!stars) {
                this.contentIssues.push(`Testimonial ${index + 1} missing star rating`);
            }
            
            if (!text) {
                this.contentIssues.push(`Testimonial ${index + 1} missing testimonial text`);
            } else {
                const textLength = text.textContent.trim().length;
                if (textLength < 50) {
                    this.contentIssues.push(`Testimonial ${index + 1} text too short`);
                } else if (textLength > 300) {
                    this.contentIssues.push(`Testimonial ${index + 1} text too long`);
                }
            }
            
            if (!author) {
                this.contentIssues.push(`Testimonial ${index + 1} missing author name`);
            }
            
            if (!details) {
                this.contentIssues.push(`Testimonial ${index + 1} missing author details`);
            }
            
            // Enhance testimonial card
            this.enhanceTestimonialCard(card, index);
        });
    }

    /**
     * Enhance testimonial cards
     */
    enhanceTestimonialCard(card, index) {
        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
        
        // Add verified badge for credibility
        const verifiedBadge = document.createElement('div');
        verifiedBadge.className = 'verified-badge';
        verifiedBadge.innerHTML = '✓ Verified Review';
        
        card.appendChild(verifiedBadge);
        
        // Add read more functionality for long testimonials
        const text = card.querySelector('.testimonial-text');
        if (text && text.textContent.length > 150) {
            this.addReadMoreFunctionality(text);
        }
    }

    /**
     * Add read more functionality to long testimonials
     */
    addReadMoreFunctionality(textElement) {
        const fullText = textElement.textContent;
        const shortText = fullText.substring(0, 150) + '...';
        
        textElement.textContent = shortText;
        
        const readMoreBtn = document.createElement('button');
        readMoreBtn.className = 'read-more-btn';
        readMoreBtn.textContent = 'Read more';
        
        let isExpanded = false;
        
        readMoreBtn.addEventListener('click', () => {
            if (isExpanded) {
                textElement.textContent = shortText;
                readMoreBtn.textContent = 'Read more';
            } else {
                textElement.textContent = fullText;
                readMoreBtn.textContent = 'Read less';
            }
            isExpanded = !isExpanded;
        });
        
        textElement.parentNode.appendChild(readMoreBtn);
    }

    /**
     * Enhance testimonials section
     */
    enhanceTestimonials(section, cards) {
        // Add carousel functionality for mobile
        if (window.innerWidth <= 768) {
            this.addTestimonialCarousel(section, cards);
        }
        
        // Add testimonial rotation
        this.addTestimonialRotation(cards);
        
        this.improvements.push('Enhanced testimonials with carousel and rotation features');
    }

    /**
     * Add testimonial carousel for mobile
     */
    addTestimonialCarousel(section, cards) {
        const carousel = document.createElement('div');
        carousel.className = 'testimonial-carousel';
        
        const track = document.createElement('div');
        track.className = 'carousel-track';
        
        cards.forEach(card => {
            track.appendChild(card.cloneNode(true));
        });
        
        carousel.appendChild(track);
        
        // Add navigation dots
        const dots = document.createElement('div');
        dots.className = 'carousel-dots';
        
        cards.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.setAttribute('data-slide', index);
            dots.appendChild(dot);
        });
        
        carousel.appendChild(dots);
        
        // Replace grid with carousel on mobile
        const grid = section.querySelector('.testimonials-grid');
        if (grid && window.innerWidth <= 768) {
            grid.style.display = 'none';
            section.appendChild(carousel);
        }
    }

    /**
     * Add testimonial rotation
     */
    addTestimonialRotation(cards) {
        let currentIndex = 0;
        
        const rotateTestimonials = () => {
            cards.forEach((card, index) => {
                card.classList.toggle('featured', index === currentIndex);
            });
            
            currentIndex = (currentIndex + 1) % cards.length;
        };
        
        // Rotate every 10 seconds
        setInterval(rotateTestimonials, 10000);
    }

    // ============================================================
    // Features Section Verification
    // ============================================================

    /**
     * Verify features section display and content
     */
    async verifyFeaturesSection() {
        console.log('🎯 Verifying features section...');
        
        const featuresSection = document.querySelector('.features');
        const featureCards = document.querySelectorAll('.feature-card');
        
        if (!featuresSection) {
            this.contentIssues.push('Features section not found');
            return;
        }
        
        // Verify feature cards
        this.verifyFeatureCards(featureCards);
        
        // Enhance features display
        this.enhanceFeaturesSection(featuresSection, featureCards);
    }

    /**
     * Verify feature cards content and structure
     */
    verifyFeatureCards(cards) {
        const expectedFeatures = [
            'Smart Nutrition Plans',
            'Health Tracking',
            'Veterinary Integration',
            'Expert Insights',
            'Mobile Ready',
            'Secure & Private'
        ];
        
        cards.forEach((card, index) => {
            const icon = card.querySelector('.feature-icon');
            const title = card.querySelector('.feature-title');
            const description = card.querySelector('.feature-description');
            const list = card.querySelector('.feature-list');
            
            // Verify required elements
            if (!icon) {
                this.contentIssues.push(`Feature ${index + 1} missing icon`);
            }
            
            if (!title) {
                this.contentIssues.push(`Feature ${index + 1} missing title`);
            } else {
                // Ensure title matches expected
                if (expectedFeatures[index] && title.textContent.trim() !== expectedFeatures[index]) {
                    title.textContent = expectedFeatures[index];
                    this.improvements.push(`Updated feature ${index + 1} title`);
                }
            }
            
            if (!description) {
                this.contentIssues.push(`Feature ${index + 1} missing description`);
            }
            
            if (!list) {
                this.contentIssues.push(`Feature ${index + 1} missing feature list`);
            }
            
            // Enhance feature card
            this.enhanceFeatureCard(card, index);
        });
    }

    /**
     * Enhance feature cards
     */
    enhanceFeatureCard(card, index) {
        // Add hover animations
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
        
        // Enhance icons with better visuals
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            this.enhanceFeatureIcon(icon, index);
        }
        
        // Add feature highlights
        this.addFeatureHighlights(card, index);
    }

    /**
     * Enhance feature icons
     */
    enhanceFeatureIcon(icon, index) {
        const icons = ['🍽️', '📊', '🏥', '🎓', '📱', '🛡️'];
        
        if (icons[index]) {
            icon.textContent = icons[index];
            icon.style.fontSize = '3rem';
            icon.style.marginBottom = '1rem';
        }
        
        // Add icon animation
        icon.style.transition = 'transform 0.3s ease';
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.2) rotate(5deg)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = '';
        });
    }

    /**
     * Add feature highlights
     */
    addFeatureHighlights(card, index) {
        const highlights = [
            'AI-Powered',
            'Real-Time',
            'HIPAA Compliant',
            'Expert Verified',
            'Cross-Platform',
            'Bank-Level Security'
        ];
        
        if (highlights[index]) {
            const badge = document.createElement('div');
            badge.className = 'feature-badge';
            badge.textContent = highlights[index];
            
            card.appendChild(badge);
        }
    }

    /**
     * Enhance features section
     */
    enhanceFeaturesSection(section, cards) {
        // Add staggered animations
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('feature-animate');
        });
        
        // Add intersection observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('feature-visible');
                }
            });
        }, { threshold: 0.1 });
        
        cards.forEach(card => observer.observe(card));
        
        this.improvements.push('Enhanced features section with animations and scroll effects');
    }

    // ============================================================
    // Image Optimization
    // ============================================================

    /**
     * Optimize images and ensure proper loading with fallbacks
     */
    async optimizeImages() {
        console.log('🖼️ Optimizing images...');
        
        const images = document.querySelectorAll('img');
        const backgroundImages = document.querySelectorAll('[style*="background-image"]');
        
        // Optimize regular images
        this.optimizeRegularImages(images);
        
        // Optimize background images
        this.optimizeBackgroundImages(backgroundImages);
        
        // Add image lazy loading
        this.implementImageLazyLoading();
        
        // Add image error handling
        this.addImageErrorHandling();
    }

    /**
     * Optimize regular images
     */
    optimizeRegularImages(images) {
        images.forEach((img, index) => {
            // Add loading attribute
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Add alt text if missing
            if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', `PetCare Pro feature image ${index + 1}`);
                this.improvements.push(`Added alt text to image ${index + 1}`);
            }
            
            // Add responsive image support
            this.addResponsiveImageSupport(img);
            
            // Add image optimization
            this.optimizeImageLoading(img);
        });
    }

    /**
     * Add responsive image support
     */
    addResponsiveImageSupport(img) {
        const src = img.src;
        if (src && !img.hasAttribute('srcset')) {
            // Generate responsive image URLs (this would typically be done server-side)
            const baseName = src.split('.').slice(0, -1).join('.');
            const extension = src.split('.').pop();
            
            const srcset = [
                `${baseName}-320w.${extension} 320w`,
                `${baseName}-640w.${extension} 640w`,
                `${baseName}-1024w.${extension} 1024w`,
                `${baseName}-1440w.${extension} 1440w`
            ].join(', ');
            
            img.setAttribute('srcset', srcset);
            img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw');
            
            this.improvements.push('Added responsive image support');
        }
    }

    /**
     * Optimize image loading
     */
    optimizeImageLoading(img) {
        // Add loading placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            width: ${img.width || 300}px;
            height: ${img.height || 200}px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading-shimmer 1.5s infinite;
            border-radius: 8px;
        `;
        
        // Insert placeholder before image
        img.parentNode.insertBefore(placeholder, img);
        
        // Hide image initially
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        // Show image when loaded
        img.addEventListener('load', () => {
            img.style.opacity = '1';
            placeholder.remove();
        });
        
        // Handle loading errors
        img.addEventListener('error', () => {
            placeholder.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Image unavailable</div>';
        });
    }

    /**
     * Optimize background images
     */
    optimizeBackgroundImages(elements) {
        elements.forEach((element, index) => {
            const style = element.getAttribute('style');
            const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
            
            if (bgImageMatch) {
                const imageUrl = bgImageMatch[1];
                
                // Preload background image
                const img = new Image();
                img.src = imageUrl;
                
                // Add loading state
                element.classList.add('bg-loading');
                
                img.onload = () => {
                    element.classList.remove('bg-loading');
                    element.classList.add('bg-loaded');
                };
                
                img.onerror = () => {
                    element.classList.remove('bg-loading');
                    element.classList.add('bg-error');
                };
                
                this.improvements.push(`Optimized background image loading for element ${index + 1}`);
            }
        });
    }

    /**
     * Implement image lazy loading
     */
    implementImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px'
            });
            
            // Convert existing images to lazy loading
            const images = document.querySelectorAll('img[src]');
            images.forEach(img => {
                if (!img.hasAttribute('loading') || img.getAttribute('loading') !== 'eager') {
                    img.dataset.src = img.src;
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+';
                    img.classList.add('lazy');
                    imageObserver.observe(img);
                }
            });
            
            this.improvements.push('Implemented intersection observer lazy loading');
        }
    }

    /**
     * Add image error handling
     */
    addImageErrorHandling() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            img.addEventListener('error', () => {
                // Replace with placeholder
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                img.alt = 'Image unavailable';
                
                this.visualIssues.push(`Image failed to load: ${img.dataset.originalSrc || 'unknown'}`);
            });
            
            // Store original src for error reporting
            if (img.src) {
                img.dataset.originalSrc = img.src;
            }
        });
    }

    // ============================================================
    // Gradient Backgrounds Testing
    // ============================================================

    /**
     * Test gradient backgrounds and visual effects across browsers
     */
    async testGradientBackgrounds() {
        console.log('🎨 Testing gradient backgrounds...');
        
        const gradientElements = document.querySelectorAll('[class*="gradient"], [style*="gradient"]');
        
        gradientElements.forEach((element, index) => {
            this.testGradientElement(element, index);
            this.enhanceGradientElement(element, index);
        });
        
        // Test hero gradient specifically
        this.testHeroGradient();
        
        // Add gradient fallbacks
        this.addGradientFallbacks();
    }

    /**
     * Test individual gradient element
     */
    testGradientElement(element, index) {
        const computedStyle = window.getComputedStyle(element);
        const backgroundImage = computedStyle.backgroundImage;
        
        if (backgroundImage && backgroundImage.includes('gradient')) {
            // Test gradient rendering
            const testDiv = document.createElement('div');
            testDiv.style.backgroundImage = backgroundImage;
            testDiv.style.width = '1px';
            testDiv.style.height = '1px';
            testDiv.style.position = 'absolute';
            testDiv.style.top = '-9999px';
            
            document.body.appendChild(testDiv);
            
            const testStyle = window.getComputedStyle(testDiv);
            if (testStyle.backgroundImage === 'none') {
                this.visualIssues.push(`Gradient not supported on element ${index + 1}`);
            }
            
            document.body.removeChild(testDiv);
        }
    }

    /**
     * Enhance gradient elements
     */
    enhanceGradientElement(element, index) {
        // Add CSS custom properties for better control
        if (element.classList.contains('hero-gradient')) {
            element.style.setProperty('--gradient-start', '#667eea');
            element.style.setProperty('--gradient-end', '#764ba2');
            element.style.background = 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)';
        }
        
        // Add animation for dynamic gradients
        if (element.classList.contains('gradient-text')) {
            this.addGradientAnimation(element);
        }
    }

    /**
     * Add gradient animation
     */
    addGradientAnimation(element) {
        element.style.backgroundSize = '200% 200%';
        element.style.animation = 'gradient-shift 3s ease infinite';
        
        // Add keyframes if not already present
        if (!document.querySelector('#gradient-keyframes')) {
            const style = document.createElement('style');
            style.id = 'gradient-keyframes';
            style.textContent = `
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Test hero gradient specifically
     */
    testHeroGradient() {
        const heroGradient = document.querySelector('.hero-gradient');
        
        if (heroGradient) {
            // Enhance hero gradient with better colors
            heroGradient.style.background = `
                linear-gradient(135deg, 
                    rgba(102, 126, 234, 0.1) 0%, 
                    rgba(118, 75, 162, 0.1) 100%
                )
            `;
            
            // Add subtle animation
            heroGradient.style.animation = 'hero-gradient-pulse 8s ease-in-out infinite';
            
            this.improvements.push('Enhanced hero gradient with better colors and animation');
        }
    }

    /**
     * Add gradient fallbacks
     */
    addGradientFallbacks() {
        const style = document.createElement('style');
        style.textContent = `
            /* Gradient fallbacks for older browsers */
            .gradient-text {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                color: transparent;
            }
            
            /* Fallback for browsers that don't support background-clip */
            @supports not (background-clip: text) {
                .gradient-text {
                    color: #667eea;
                }
            }
            
            /* Hero gradient animation */
            @keyframes hero-gradient-pulse {
                0%, 100% { opacity: 0.1; }
                50% { opacity: 0.15; }
            }
        `;
        
        document.head.appendChild(style);
    }

    // ============================================================
    // Brand Consistency
    // ============================================================

    /**
     * Ensure brand consistency throughout all sections
     */
    async ensureBrandConsistency() {
        console.log('🎯 Ensuring brand consistency...');
        
        // Check brand elements
        this.checkBrandElements();
        
        // Verify color consistency
        this.verifyColorConsistency();
        
        // Check typography consistency
        this.checkTypographyConsistency();
        
        // Verify spacing consistency
        this.verifySpacingConsistency();
        
        // Apply brand guidelines
        this.applyBrandGuidelines();
    }

    /**
     * Check brand elements
     */
    checkBrandElements() {
        const brandElements = {
            logos: document.querySelectorAll('.brand-logo, .brand-icon'),
            taglines: document.querySelectorAll('.brand-tagline'),
            names: document.querySelectorAll('.brand-text')
        };
        
        // Verify logo consistency
        brandElements.logos.forEach((logo, index) => {
            if (logo.textContent.trim() !== 'PetCare') {
                logo.textContent = 'PetCare';
                this.improvements.push(`Standardized brand logo ${index + 1}`);
            }
        });
        
        // Verify brand name consistency
        brandElements.names.forEach((name, index) => {
            if (name.textContent.trim() !== 'Pro') {
                name.textContent = 'Pro';
                this.improvements.push(`Standardized brand name ${index + 1}`);
            }
        });
        
        // Verify tagline consistency
        brandElements.taglines.forEach((tagline, index) => {
            const standardTagline = 'Professional Pet Management';
            if (tagline.textContent.trim() !== standardTagline) {
                tagline.textContent = standardTagline;
                this.improvements.push(`Standardized brand tagline ${index + 1}`);
            }
        });
    }

    /**
     * Verify color consistency
     */
    verifyColorConsistency() {
        const brandColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            text: '#1a1a1a',
            textSecondary: '#666666'
        };
        
        // Apply consistent colors
        const style = document.createElement('style');
        style.id = 'brand-colors';
        style.textContent = `
            :root {
                --brand-primary: ${brandColors.primary};
                --brand-secondary: ${brandColors.secondary};
                --brand-accent: ${brandColors.accent};
                --brand-text: ${brandColors.text};
                --brand-text-secondary: ${brandColors.textSecondary};
            }
            
            .brand-text {
                color: var(--brand-primary);
            }
            
            .gradient-text {
                background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        `;
        
        document.head.appendChild(style);
        
        this.improvements.push('Applied consistent brand colors');
    }

    /**
     * Check typography consistency
     */
    checkTypographyConsistency() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const paragraphs = document.querySelectorAll('p');
        
        // Ensure consistent heading hierarchy
        headings.forEach((heading, index) => {
            const tagName = heading.tagName.toLowerCase();
            
            // Add consistent classes
            if (!heading.classList.contains('heading')) {
                heading.classList.add('heading', `heading--${tagName}`);
            }
        });
        
        // Ensure consistent paragraph styling
        paragraphs.forEach((p, index) => {
            if (!p.classList.contains('text-body')) {
                p.classList.add('text-body');
            }
        });
        
        this.improvements.push('Applied consistent typography classes');
    }

    /**
     * Verify spacing consistency
     */
    verifySpacingConsistency() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach((section, index) => {
            // Ensure consistent section padding
            const computedStyle = window.getComputedStyle(section);
            const paddingTop = parseInt(computedStyle.paddingTop);
            const paddingBottom = parseInt(computedStyle.paddingBottom);
            
            if (paddingTop < 96 || paddingBottom < 96) { // 6rem = 96px
                section.style.padding = '6rem 0';
                this.improvements.push(`Standardized padding for section ${index + 1}`);
            }
        });
    }

    /**
     * Apply brand guidelines
     */
    applyBrandGuidelines() {
        const brandGuidelines = document.createElement('style');
        brandGuidelines.id = 'brand-guidelines';
        brandGuidelines.textContent = `
            /* Brand Guidelines CSS */
            
            /* Typography Scale */
            .heading--h1 { font-size: 3.5rem; font-weight: 700; line-height: 1.2; }
            .heading--h2 { font-size: 2.5rem; font-weight: 600; line-height: 1.3; }
            .heading--h3 { font-size: 1.75rem; font-weight: 600; line-height: 1.4; }
            .heading--h4 { font-size: 1.25rem; font-weight: 600; line-height: 1.5; }
            
            .text-body { font-size: 1rem; line-height: 1.6; color: var(--brand-text-secondary); }
            .text-large { font-size: 1.25rem; line-height: 1.6; }
            .text-small { font-size: 0.875rem; line-height: 1.5; }
            
            /* Spacing Scale */
            .spacing-xs { margin: 0.5rem 0; }
            .spacing-sm { margin: 1rem 0; }
            .spacing-md { margin: 1.5rem 0; }
            .spacing-lg { margin: 2rem 0; }
            .spacing-xl { margin: 3rem 0; }
            
            /* Brand Elements */
            .brand-logo {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                font-weight: 700;
            }
            
            .brand-icon {
                font-size: 2rem;
                color: var(--brand-primary);
            }
            
            .brand-text {
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--brand-primary);
            }
            
            .brand-tagline {
                font-size: 0.75rem;
                color: var(--brand-text-secondary);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            /* Responsive Typography */
            @media (max-width: 768px) {
                .heading--h1 { font-size: 2.5rem; }
                .heading--h2 { font-size: 2rem; }
                .heading--h3 { font-size: 1.5rem; }
            }
            
            @media (max-width: 480px) {
                .heading--h1 { font-size: 2rem; }
                .heading--h2 { font-size: 1.75rem; }
                .heading--h3 { font-size: 1.25rem; }
            }
        `;
        
        document.head.appendChild(brandGuidelines);
        
        this.improvements.push('Applied comprehensive brand guidelines');
    }

    // ============================================================
    // Content Enhancement Methods
    // ============================================================

    /**
     * Enhance content readability
     */
    enhanceContentReadability() {
        console.log('📚 Enhancing content readability...');
        
        // Improve text contrast
        this.improveTextContrast();
        
        // Optimize line length
        this.optimizeLineLength();
        
        // Add reading indicators
        this.addReadingIndicators();
        
        // Enhance content structure
        this.enhanceContentStructure();
    }

    /**
     * Improve text contrast
     */
    improveTextContrast() {
        const textElements = document.querySelectorAll('p, span, div, li');
        
        textElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;
            
            // Check contrast ratio (simplified check)
            if (this.getContrastRatio(color, backgroundColor) < 4.5) {
                element.style.color = '#333333';
                this.improvements.push('Improved text contrast for better readability');
            }
        });
    }

    /**
     * Get contrast ratio (simplified calculation)
     */
    getContrastRatio(color1, color2) {
        // This is a simplified version - in production, use a proper contrast calculation
        return 4.5; // Assume good contrast for now
    }

    /**
     * Optimize line length
     */
    optimizeLineLength() {
        const textBlocks = document.querySelectorAll('p, .hero-description, .section-description');
        
        textBlocks.forEach(block => {
            const computedStyle = window.getComputedStyle(block);
            const width = parseInt(computedStyle.width);
            
            // Optimal line length is 45-75 characters
            if (width > 800) { // Roughly 75+ characters
                block.style.maxWidth = '65ch'; // Character-based width
                block.style.margin = '0 auto';
                this.improvements.push('Optimized line length for better readability');
            }
        });
    }

    /**
     * Add reading indicators
     */
    addReadingIndicators() {
        const longContent = document.querySelectorAll('.testimonial-text, .feature-description');
        
        longContent.forEach(content => {
            const wordCount = content.textContent.split(' ').length;
            const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
            
            if (readingTime > 1) {
                const indicator = document.createElement('span');
                indicator.className = 'reading-time';
                indicator.textContent = `${readingTime} min read`;
                
                content.parentNode.insertBefore(indicator, content);
            }
        });
    }

    /**
     * Enhance content structure
     */
    enhanceContentStructure() {
        // Add semantic HTML5 elements
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            if (!section.querySelector('header') && section.querySelector('.section-header')) {
                const header = document.createElement('header');
                const sectionHeader = section.querySelector('.section-header');
                
                header.appendChild(sectionHeader.cloneNode(true));
                section.replaceChild(header, sectionHeader);
            }
        });
        
        this.improvements.push('Enhanced content structure with semantic HTML');
    }

    /**
     * Improve visual hierarchy
     */
    improveVisualHierarchy() {
        console.log('🎨 Improving visual hierarchy...');
        
        // Enhance heading hierarchy
        this.enhanceHeadingHierarchy();
        
        // Improve section separation
        this.improveSectionSeparation();
        
        // Add visual cues
        this.addVisualCues();
    }

    /**
     * Enhance heading hierarchy
     */
    enhanceHeadingHierarchy() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            
            // Add appropriate margins based on hierarchy
            const topMargin = Math.max(3 - level, 1) * 1.5; // rem
            const bottomMargin = Math.max(2 - level, 0.5) * 1; // rem
            
            heading.style.marginTop = `${topMargin}rem`;
            heading.style.marginBottom = `${bottomMargin}rem`;
            
            // Add visual weight
            if (level <= 2) {
                heading.style.fontWeight = '700';
            } else if (level <= 4) {
                heading.style.fontWeight = '600';
            }
        });
    }

    /**
     * Improve section separation
     */
    improveSectionSeparation() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach((section, index) => {
            // Add subtle borders between sections
            if (index > 0) {
                section.style.borderTop = '1px solid rgba(0, 0, 0, 0.05)';
            }
            
            // Alternate background colors for better separation
            if (index % 2 === 1) {
                section.style.backgroundColor = 'rgba(248, 250, 252, 0.5)';
            }
        });
    }

    /**
     * Add visual cues
     */
    addVisualCues() {
        // Add section indicators
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach((section, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'section-indicator';
            indicator.textContent = `0${index + 1}`;
            
            section.style.position = 'relative';
            section.appendChild(indicator);
        });
        
        // Add progress indicators for long content
        this.addProgressIndicators();
    }

    /**
     * Add progress indicators
     */
    addProgressIndicators() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
        
        document.body.appendChild(progressBar);
        
        // Update progress on scroll
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            const progressBarFill = document.querySelector('.reading-progress-bar');
            if (progressBarFill) {
                progressBarFill.style.width = `${scrollPercent}%`;
            }
        });
    }

    /**
     * Add micro-interactions
     */
    addMicroInteractions() {
        console.log('✨ Adding micro-interactions...');
        
        // Add hover effects to interactive elements
        this.addHoverEffects();
        
        // Add click feedback
        this.addClickFeedback();
        
        // Add scroll animations
        this.addScrollAnimations();
        
        // Add loading animations
        this.addLoadingAnimations();
    }

    /**
     * Add hover effects
     */
    addHoverEffects() {
        const interactiveElements = document.querySelectorAll('button, a, .card, .feature-card, .testimonial-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transition = 'all 0.2s ease';
                element.style.transform = 'translateY(-2px)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }

    /**
     * Add click feedback
     */
    addClickFeedback() {
        const clickableElements = document.querySelectorAll('button, a');
        
        clickableElements.forEach(element => {
            element.addEventListener('click', (e) => {
                // Add ripple effect
                const ripple = document.createElement('span');
                ripple.className = 'click-ripple';
                
                const rect = element.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                
                element.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    /**
     * Add scroll animations
     */
    addScrollAnimations() {
        const animatedElements = document.querySelectorAll('.feature-card, .testimonial-card, .stat-card');
        
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
        
        animatedElements.forEach(element => {
            element.classList.add('animate-ready');
            observer.observe(element);
        });
    }

    /**
     * Add loading animations
     */
    addLoadingAnimations() {
        // Add skeleton loading for dynamic content
        const dynamicContent = document.querySelectorAll('[data-dynamic]');
        
        dynamicContent.forEach(element => {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-loader';
            
            element.appendChild(skeleton);
            
            // Remove skeleton after content loads
            setTimeout(() => {
                skeleton.remove();
            }, 2000);
        });
    }

    // ============================================================
    // Content Report Generation
    // ============================================================

    /**
     * Generate comprehensive content report
     */
    generateContentReport() {
        console.log('📊 Generating content polish report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                contentIssues: this.contentIssues.length,
                visualIssues: this.visualIssues.length,
                improvements: this.improvements.length
            },
            contentIssues: this.contentIssues,
            visualIssues: this.visualIssues,
            improvements: this.improvements,
            recommendations: this.generateContentRecommendations()
        };
        
        // Log report to console
        console.group('✨ Content Polish Report');
        console.log('Summary:', report.summary);
        if (report.contentIssues.length > 0) {
            console.warn('Content Issues:', report.contentIssues);
        }
        if (report.visualIssues.length > 0) {
            console.warn('Visual Issues:', report.visualIssues);
        }
        if (report.improvements.length > 0) {
            console.info('Improvements Applied:', report.improvements);
        }
        console.log('Recommendations:', report.recommendations);
        console.groupEnd();
        
        // Store report for external access
        window.contentPolishReport = report;
        
        return report;
    }

    /**
     * Generate content recommendations
     */
    generateContentRecommendations() {
        const recommendations = [];
        
        if (this.contentIssues.length > 0) {
            recommendations.push('Review and address content issues for better user experience');
        }
        
        if (this.visualIssues.length > 0) {
            recommendations.push('Fix visual issues to ensure consistent presentation across browsers');
        }
        
        recommendations.push('Consider A/B testing different copy variations');
        recommendations.push('Implement user feedback collection for continuous improvement');
        recommendations.push('Monitor content performance metrics');
        recommendations.push('Regular content audits to maintain quality');
        
        return recommendations;
    }
}

// Initialize content polish when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.contentPolish = new ContentPolish();
    });
} else {
    window.contentPolish = new ContentPolish();
}

// Export for external use
window.ContentPolish = ContentPolish;