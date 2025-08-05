// Notification System Component
class NotificationManager {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
            maxNotifications: options.maxNotifications || 5,
            defaultDuration: options.defaultDuration || 5000,
            animationDuration: options.animationDuration || 300,
            ...options
        };
        
        this.notifications = new Map();
        this.container = null;
        this.nextId = 1;
    }

    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = `notification-container notification-container--${this.options.position}`;
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'false');
        
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        this.init();

        const notification = this.createNotification(message, type, options);
        
        // Remove oldest if at max capacity
        if (this.notifications.size >= this.options.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }

        this.notifications.set(notification.id, notification);
        this.container.appendChild(notification.element);

        // Animate in
        requestAnimationFrame(() => {
            notification.element.classList.add('notification--show');
        });

        // Auto-hide if duration is set
        if (notification.duration > 0) {
            notification.timeout = setTimeout(() => {
                this.hide(notification.id);
            }, notification.duration);
        }

        // Dispatch event
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: { id: notification.id, message, type }
        }));

        return notification.id;
    }

    createNotification(message, type, options) {
        const id = this.nextId++;
        const duration = options.duration !== undefined ? options.duration : this.options.defaultDuration;
        const closable = options.closable !== false;
        const icon = options.icon || this.getDefaultIcon(type);
        const title = options.title || '';

        const element = document.createElement('div');
        element.className = `notification notification--${type}`;
        element.setAttribute('role', type === 'error' ? 'alert' : 'status');
        element.dataset.id = id;

        element.innerHTML = `
            <div class="notification__content">
                ${icon ? `<div class="notification__icon">${icon}</div>` : ''}
                <div class="notification__body">
                    ${title ? `<div class="notification__title">${title}</div>` : ''}
                    <div class="notification__message">${message}</div>
                </div>
                ${closable ? `
                    <button class="notification__close" aria-label="Close notification">
                        <span aria-hidden="true">&times;</span>
                    </button>
                ` : ''}
            </div>
            ${duration > 0 ? `<div class="notification__progress"></div>` : ''}
        `;

        // Setup event listeners
        if (closable) {
            const closeBtn = element.querySelector('.notification__close');
            closeBtn.addEventListener('click', () => this.hide(id));
        }

        // Progress bar animation
        if (duration > 0) {
            const progressBar = element.querySelector('.notification__progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
            }
        }

        return {
            id,
            element,
            type,
            message,
            duration,
            timeout: null
        };
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        // Clear timeout
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }

        // Animate out
        notification.element.classList.remove('notification--show');
        notification.element.classList.add('notification--hide');

        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);

            // Dispatch event
            document.dispatchEvent(new CustomEvent('notification:hide', {
                detail: { id, message: notification.message, type: notification.type }
            }));
        }, this.options.animationDuration);
    }

    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    getDefaultIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || '';
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', { duration: 8000, ...options });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', { duration: 6000, ...options });
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Static instance for global use
    static instance = null;

    static getInstance(options = {}) {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager(options);
        }
        return NotificationManager.instance;
    }
}

// Toast notification - simpler API
class Toast {
    static show(message, type = 'info', duration = 5000) {
        const manager = NotificationManager.getInstance();
        return manager.show(message, type, { duration });
    }

    static success(message, duration = 5000) {
        return Toast.show(message, 'success', duration);
    }

    static error(message, duration = 8000) {
        return Toast.show(message, 'error', duration);
    }

    static warning(message, duration = 6000) {
        return Toast.show(message, 'warning', duration);
    }

    static info(message, duration = 5000) {
        return Toast.show(message, 'info', duration);
    }
}

// Export for module use
window.NotificationManager = NotificationManager;
window.Toast = Toast;