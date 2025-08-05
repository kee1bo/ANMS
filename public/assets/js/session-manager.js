/**
 * Enhanced Session Manager
 * Handles JWT token refresh, session timeout, and security features
 */
class SessionManager {
    constructor(apiClient, authManager) {
        this.apiClient = apiClient;
        this.authManager = authManager;
        
        // Session configuration
        this.config = {
            tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
            sessionTimeoutWarning: 10 * 60 * 1000, // 10 minutes warning
            sessionTimeout: 30 * 60 * 1000, // 30 minutes timeout
            maxInactivityTime: 15 * 60 * 1000, // 15 minutes inactivity
            heartbeatInterval: 60 * 1000, // 1 minute heartbeat
            maxRefreshAttempts: 3
        };

        // Session state
        this.lastActivity = Date.now();
        this.sessionStartTime = Date.now();
        this.refreshAttempts = 0;
        this.isRefreshing = false;
        this.warningShown = false;
        
        // Timers
        this.heartbeatTimer = null;
        this.inactivityTimer = null;
        this.sessionTimer = null;
        this.refreshTimer = null;
        
        // Event listeners
        this.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        this.init();
    }

    init() {
        this.setupActivityTracking();
        this.startHeartbeat();
        this.scheduleTokenRefresh();
        this.startSessionTimer();
        
        // Listen for auth state changes
        this.authManager.on('login', () => this.onLogin());
        this.authManager.on('logout', () => this.onLogout());
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Listen for storage changes (multiple tabs)
        window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }

    /**
     * Setup activity tracking
     */
    setupActivityTracking() {
        this.activityEvents.forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), { passive: true });
        });
    }

    /**
     * Update last activity timestamp
     */
    updateActivity() {
        this.lastActivity = Date.now();
        this.warningShown = false;
        
        // Reset inactivity timer
        this.resetInactivityTimer();
    }

    /**
     * Start heartbeat to keep session alive
     */
    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        this.heartbeatTimer = setInterval(() => {
            if (this.authManager.isAuthenticated()) {
                this.sendHeartbeat();
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Send heartbeat to server
     */
    async sendHeartbeat() {
        try {
            await this.apiClient.request('heartbeat', { method: 'POST' });
        } catch (error) {
            console.warn('Heartbeat failed:', error);
            // Don't throw error for heartbeat failures
        }
    }

    /**
     * Schedule token refresh
     */
    scheduleTokenRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const token = this.apiClient.token;
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000;
            const refreshTime = expirationTime - this.config.tokenRefreshThreshold;
            const timeUntilRefresh = refreshTime - Date.now();

            if (timeUntilRefresh > 0) {
                this.refreshTimer = setTimeout(() => {
                    this.refreshTokenIfNeeded();
                }, timeUntilRefresh);
            } else {
                // Token is already close to expiry, refresh immediately
                this.refreshTokenIfNeeded();
            }
        } catch (error) {
            console.error('Error parsing token for refresh scheduling:', error);
        }
    }

    /**
     * Refresh token if needed
     */
    async refreshTokenIfNeeded() {
        if (this.isRefreshing || !this.authManager.isAuthenticated()) {
            return;
        }

        this.isRefreshing = true;

        try {
            const success = await this.apiClient.attemptTokenRefresh();
            
            if (success) {
                this.refreshAttempts = 0;
                this.scheduleTokenRefresh();
                console.log('Token refreshed successfully');
            } else {
                this.refreshAttempts++;
                
                if (this.refreshAttempts >= this.config.maxRefreshAttempts) {
                    this.handleSessionExpired('Token refresh failed after maximum attempts');
                } else {
                    // Retry after a delay
                    setTimeout(() => {
                        this.refreshTokenIfNeeded();
                    }, 5000 * this.refreshAttempts);
                }
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.refreshAttempts++;
            
            if (this.refreshAttempts >= this.config.maxRefreshAttempts) {
                this.handleSessionExpired('Token refresh failed: ' + error.message);
            }
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Start session timer
     */
    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        // Warning timer
        const warningTime = this.config.sessionTimeout - this.config.sessionTimeoutWarning;
        setTimeout(() => {
            if (this.authManager.isAuthenticated() && !this.warningShown) {
                this.showSessionWarning();
            }
        }, warningTime);

        // Session timeout timer
        this.sessionTimer = setTimeout(() => {
            if (this.authManager.isAuthenticated()) {
                this.handleSessionTimeout();
            }
        }, this.config.sessionTimeout);
    }

    /**
     * Reset inactivity timer
     */
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        this.inactivityTimer = setTimeout(() => {
            if (this.authManager.isAuthenticated()) {
                this.handleInactivityTimeout();
            }
        }, this.config.maxInactivityTime);
    }

    /**
     * Show session warning
     */
    showSessionWarning() {
        if (this.warningShown) return;
        
        this.warningShown = true;
        const remainingTime = Math.ceil(this.config.sessionTimeoutWarning / 60000);

        const warningModal = this.createWarningModal(
            'Session Expiring Soon',
            `Your session will expire in ${remainingTime} minutes due to inactivity. Would you like to extend your session?`,
            [
                {
                    text: 'Extend Session',
                    action: () => this.extendSession(),
                    primary: true
                },
                {
                    text: 'Logout Now',
                    action: () => this.authManager.logout(),
                    secondary: true
                }
            ]
        );

        document.body.appendChild(warningModal);
    }

    /**
     * Create warning modal
     */
    createWarningModal(title, message, buttons) {
        const modal = document.createElement('div');
        modal.className = 'session-warning-modal';
        modal.innerHTML = `
            <div class="session-warning-backdrop"></div>
            <div class="session-warning-container">
                <div class="session-warning-header">
                    <h3>${title}</h3>
                </div>
                <div class="session-warning-body">
                    <p>${message}</p>
                </div>
                <div class="session-warning-actions">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.primary ? 'btn--primary' : 'btn--secondary'}" 
                                data-action="${btn.action.name}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        buttons.forEach(btn => {
            const buttonEl = modal.querySelector(`[data-action="${btn.action.name}"]`);
            if (buttonEl) {
                buttonEl.addEventListener('click', () => {
                    btn.action();
                    this.closeWarningModal(modal);
                });
            }
        });

        return modal;
    }

    /**
     * Close warning modal
     */
    closeWarningModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    /**
     * Extend session
     */
    async extendSession() {
        try {
            this.updateActivity();
            this.sessionStartTime = Date.now();
            this.startSessionTimer();
            
            // Send heartbeat to server
            await this.sendHeartbeat();
            
            // Show success message
            if (window.petNutriApp && window.petNutriApp.ui) {
                window.petNutriApp.ui.showSuccess('Session extended successfully');
            }
        } catch (error) {
            console.error('Failed to extend session:', error);
            if (window.petNutriApp && window.petNutriApp.ui) {
                window.petNutriApp.ui.showError('Failed to extend session');
            }
        }
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        this.handleSessionExpired('Session timed out due to inactivity');
    }

    /**
     * Handle inactivity timeout
     */
    handleInactivityTimeout() {
        if (!this.warningShown) {
            this.showSessionWarning();
        }
    }

    /**
     * Handle session expired
     */
    handleSessionExpired(reason) {
        console.log('Session expired:', reason);
        
        // Clear all timers
        this.clearAllTimers();
        
        // Show expiration message
        if (window.petNutriApp && window.petNutriApp.ui) {
            window.petNutriApp.ui.showWarning('Your session has expired. Please log in again.');
        }
        
        // Force logout
        setTimeout(() => {
            this.authManager.forceLogout();
        }, 2000);
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, reduce activity
            this.pauseTimers();
        } else {
            // Page is visible again, resume activity
            this.resumeTimers();
            this.updateActivity();
        }
    }

    /**
     * Handle storage changes (multiple tabs)
     */
    handleStorageChange(event) {
        if (event.key === 'petnutri_token') {
            if (!event.newValue && this.authManager.isAuthenticated()) {
                // Token was removed in another tab, logout here too
                this.authManager.forceLogout();
            }
        }
    }

    /**
     * Pause timers when page is hidden
     */
    pauseTimers() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Resume timers when page is visible
     */
    resumeTimers() {
        this.startHeartbeat();
    }

    /**
     * Clear all timers
     */
    clearAllTimers() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Handle login event
     */
    onLogin() {
        this.sessionStartTime = Date.now();
        this.lastActivity = Date.now();
        this.refreshAttempts = 0;
        this.warningShown = false;
        
        this.startHeartbeat();
        this.scheduleTokenRefresh();
        this.startSessionTimer();
        this.resetInactivityTimer();
    }

    /**
     * Handle logout event
     */
    onLogout() {
        this.clearAllTimers();
    }

    /**
     * Get session info
     */
    getSessionInfo() {
        return {
            sessionStartTime: this.sessionStartTime,
            lastActivity: this.lastActivity,
            isActive: Date.now() - this.lastActivity < this.config.maxInactivityTime,
            timeUntilTimeout: Math.max(0, this.config.sessionTimeout - (Date.now() - this.sessionStartTime)),
            timeUntilInactivity: Math.max(0, this.config.maxInactivityTime - (Date.now() - this.lastActivity))
        };
    }

    /**
     * Destroy session manager
     */
    destroy() {
        this.clearAllTimers();
        
        // Remove event listeners
        this.activityEvents.forEach(event => {
            document.removeEventListener(event, this.updateActivity);
        });
        
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('storage', this.handleStorageChange);
    }
}

// Export for use in other modules
window.SessionManager = SessionManager;