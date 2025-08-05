// Modal Component with Accessibility Features
class Modal {
    constructor(options = {}) {
        this.options = {
            title: options.title || '',
            content: options.content || '',
            size: options.size || 'medium', // small, medium, large
            closable: options.closable !== false,
            backdrop: options.backdrop !== false,
            keyboard: options.keyboard !== false,
            focus: options.focus !== false,
            onShow: options.onShow || null,
            onHide: options.onHide || null,
            ...options
        };
        
        this.element = null;
        this.isVisible = false;
        this.previousFocus = null;
    }

    create() {
        if (this.element) return this.element;

        this.element = document.createElement('div');
        this.element.className = `modal modal--${this.options.size}`;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('tabindex', '-1');
        
        if (this.options.title) {
            this.element.setAttribute('aria-labelledby', 'modal-title');
        }

        this.element.innerHTML = `
            ${this.options.backdrop ? '<div class="modal__backdrop"></div>' : ''}
            <div class="modal__container">
                <div class="modal__header">
                    <h2 id="modal-title" class="modal__title">${this.options.title}</h2>
                    ${this.options.closable ? `
                        <button class="modal__close" aria-label="Close modal">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    ` : ''}
                </div>
                <div class="modal__body">
                    ${this.options.content}
                </div>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        if (!this.element) return;

        // Close button
        const closeBtn = this.element.querySelector('.modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Backdrop click
        if (this.options.backdrop) {
            const backdrop = this.element.querySelector('.modal__backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => this.hide());
            }
        }

        // Keyboard events
        if (this.options.keyboard) {
            this.element.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hide();
                }
                
                // Trap focus within modal
                if (e.key === 'Tab') {
                    this.trapFocus(e);
                }
            });
        }
    }

    trapFocus(e) {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    show() {
        if (this.isVisible) return;

        if (!this.element) {
            this.create();
        }

        // Store current focus
        this.previousFocus = document.activeElement;

        // Add to DOM
        document.body.appendChild(this.element);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management
        if (this.options.focus) {
            const firstFocusable = this.element.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
                firstFocusable.focus();
            } else {
                this.element.focus();
            }
        }

        this.isVisible = true;

        // Callback
        if (this.options.onShow) {
            this.options.onShow(this);
        }

        // Dispatch event
        this.element.dispatchEvent(new CustomEvent('modal:show', { detail: this }));
    }

    hide() {
        if (!this.isVisible) return;

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        // Restore focus
        if (this.previousFocus) {
            this.previousFocus.focus();
        }

        this.isVisible = false;

        // Callback
        if (this.options.onHide) {
            this.options.onHide(this);
        }

        // Dispatch event
        if (this.element) {
            this.element.dispatchEvent(new CustomEvent('modal:hide', { detail: this }));
        }
    }

    updateContent(content) {
        if (!this.element) return;
        
        const body = this.element.querySelector('.modal__body');
        if (body) {
            body.innerHTML = content;
        }
    }

    updateTitle(title) {
        if (!this.element) return;
        
        const titleElement = this.element.querySelector('.modal__title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    destroy() {
        this.hide();
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    // Static methods for convenience
    static show(options) {
        const modal = new Modal(options);
        modal.show();
        return modal;
    }

    static confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `
                    <div class="modal-confirm">
                        <p class="modal-confirm__message">${message}</p>
                        <div class="modal-confirm__actions">
                            <button class="btn btn--secondary" data-action="cancel">Cancel</button>
                            <button class="btn btn--primary" data-action="confirm">Confirm</button>
                        </div>
                    </div>
                `,
                size: 'small',
                onShow: (modal) => {
                    const confirmBtn = modal.element.querySelector('[data-action="confirm"]');
                    const cancelBtn = modal.element.querySelector('[data-action="cancel"]');
                    
                    confirmBtn.addEventListener('click', () => {
                        modal.hide();
                        resolve(true);
                    });
                    
                    cancelBtn.addEventListener('click', () => {
                        modal.hide();
                        resolve(false);
                    });
                }
            });
            modal.show();
        });
    }

    static alert(message, title = 'Alert') {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `
                    <div class="modal-alert">
                        <p class="modal-alert__message">${message}</p>
                        <div class="modal-alert__actions">
                            <button class="btn btn--primary" data-action="ok">OK</button>
                        </div>
                    </div>
                `,
                size: 'small',
                onShow: (modal) => {
                    const okBtn = modal.element.querySelector('[data-action="ok"]');
                    okBtn.addEventListener('click', () => {
                        modal.hide();
                        resolve();
                    });
                }
            });
            modal.show();
        });
    }
}

// Export for module use
window.Modal = Modal;