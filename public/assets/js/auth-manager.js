/**
 * Authentication Manager for PetNutri Application
 * Handles user authentication, session management, and auth state
 */
class AuthManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.listeners = new Map();
        this.isCheckingAuth = false;
        
        // Bind methods to maintain context
        this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
        
        // Check authentication status on initialization
        this.checkAuthStatus();
    }

    /**
     * Add event listener for authentication events
     * @param {string} event - Event name ('login', 'logout', 'auth-change')
     * @param {function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit authentication event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Check current authentication status
     * @returns {Promise<boolean>} Authentication status
     */
    async checkAuthStatus() {
        if (this.isCheckingAuth) return this.isAuthenticated();
        
        this.isCheckingAuth = true;
        
        try {
            // If we have a token, verify it's still valid
            if (this.apiClient.token) {
                try {
                    const profile = await this.apiClient.getProfile();
                    if (profile && profile.user) {
                        this.apiClient.setUser(profile.user);
                        this.handleAuthStateChange(true);
                        return true;
                    }
                } catch (error) {
                    // Token is invalid, clear it
                    console.warn('Invalid token, clearing authentication:', error);
                    this.apiClient.clearStorage();
                }
            }
            
            this.handleAuthStateChange(false);
            return false;
            
        } catch (error) {
            console.error('Auth status check failed:', error);
            this.handleAuthStateChange(false);
            return false;
        } finally {
            this.isCheckingAuth = false;
        }
    }

    /**
     * Get current authentication status
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.apiClient.isAuthenticated();
    }

    /**
     * Get current user
     * @returns {Object|null} Current user object
     */
    getCurrentUser() {
        return this.apiClient.getCurrentUser();
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async register(userData) {
        try {
            // Validate required fields
            this.validateRegistrationData(userData);
            
            const response = await this.apiClient.register(userData);
            
            if (response.user) {
                this.handleAuthStateChange(true);
                this.emit('login', response.user);
                return { success: true, user: response.user, message: response.message };
            }
            
            throw new Error(response.message || 'Registration failed');
            
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result
     */
    async login(email, password) {
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            const response = await this.apiClient.login(email, password);
            
            if (response.user) {
                this.handleAuthStateChange(true);
                this.emit('login', response.user);
                return { success: true, user: response.user, message: 'Login successful' };
            }
            
            throw new Error(response.message || 'Login failed');
            
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await this.apiClient.logout();
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            this.handleAuthStateChange(false);
            this.emit('logout');
        }
    }

    /**
     * Handle authentication state changes
     * @param {boolean} isAuthenticated - New authentication status
     */
    handleAuthStateChange(isAuthenticated) {
        this.emit('auth-change', {
            isAuthenticated,
            user: this.getCurrentUser()
        });
    }

    /**
     * Validate registration data
     * @param {Object} userData - User data to validate
     * @throws {Error} Validation error
     */
    validateRegistrationData(userData) {
        const required = ['first_name', 'last_name', 'email', 'password'];
        const missing = required.filter(field => !userData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (!this.isValidEmail(userData.email)) {
            throw new Error('Please enter a valid email address');
        }

        if (userData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (userData.password_confirmation && userData.password !== userData.password_confirmation) {
            throw new Error('Passwords do not match');
        }
    }

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} Valid status
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>} Update result
     */
    async updateProfile(profileData) {
        try {
            const response = await this.apiClient.updateProfile(profileData);
            
            if (response.user) {
                this.apiClient.setUser(response.user);
                this.emit('profile-updated', response.user);
                return { success: true, user: response.user };
            }
            
            throw new Error(response.message || 'Profile update failed');
            
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    }

    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Change result
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!currentPassword || !newPassword) {
                throw new Error('Current and new passwords are required');
            }

            if (newPassword.length < 8) {
                throw new Error('New password must be at least 8 characters long');
            }

            const response = await this.apiClient.changePassword(currentPassword, newPassword);
            
            return { success: true, message: response.message || 'Password changed successfully' };
            
        } catch (error) {
            console.error('Password change failed:', error);
            throw error;
        }
    }

    /**
     * Request password reset
     * @param {string} email - Email address
     * @returns {Promise<Object>} Reset result
     */
    async requestPasswordReset(email) {
        try {
            if (!email) {
                throw new Error('Email address is required');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            const response = await this.apiClient.requestPasswordReset(email);
            
            return { 
                success: true, 
                message: response.message || 'If the email exists, a reset link has been sent' 
            };
            
        } catch (error) {
            console.error('Password reset request failed:', error);
            throw error;
        }
    }

    /**
     * Enable two-factor authentication
     * @returns {Promise<Object>} 2FA setup data
     */
    async enableTwoFactor() {
        try {
            const response = await this.apiClient.enableTwoFactor();
            return { 
                success: true, 
                secret: response.secret,
                qrCodeUrl: response.qr_code_url
            };
        } catch (error) {
            console.error('2FA enable failed:', error);
            throw error;
        }
    }

    /**
     * Disable two-factor authentication
     * @returns {Promise<Object>} Disable result
     */
    async disableTwoFactor() {
        try {
            const response = await this.apiClient.disableTwoFactor();
            return { success: true, message: response.message };
        } catch (error) {
            console.error('2FA disable failed:', error);
            throw error;
        }
    }

    /**
     * Verify two-factor authentication code
     * @param {string} code - 2FA code
     * @returns {Promise<Object>} Verification result
     */
    async verifyTwoFactor(code) {
        try {
            if (!code) {
                throw new Error('Verification code is required');
            }

            const response = await this.apiClient.verifyTwoFactor(code);
            return { success: true, message: response.message };
        } catch (error) {
            console.error('2FA verification failed:', error);
            throw error;
        }
    }

    /**
     * Refresh authentication token
     * @returns {Promise<boolean>} Refresh success
     */
    async refreshToken() {
        try {
            const success = await this.apiClient.attemptTokenRefresh();
            if (success) {
                this.handleAuthStateChange(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Get user session information
     * @returns {Object} Session info
     */
    getSessionInfo() {
        const user = this.getCurrentUser();
        return {
            isAuthenticated: this.isAuthenticated(),
            user: user,
            loginTime: user ? localStorage.getItem('petnutri_login_time') : null,
            expiresAt: this.apiClient.token ? this.getTokenExpiration() : null
        };
    }

    /**
     * Get token expiration time
     * @returns {Date|null} Expiration date
     */
    getTokenExpiration() {
        if (!this.apiClient.token) return null;
        
        try {
            // JWT tokens have base64-encoded payload
            const payload = JSON.parse(atob(this.apiClient.token.split('.')[1]));
            return payload.exp ? new Date(payload.exp * 1000) : null;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    /**
     * Check if token is about to expire (within 5 minutes)
     * @returns {boolean} Near expiration status
     */
    isTokenNearExpiration() {
        const expiration = this.getTokenExpiration();
        if (!expiration) return false;
        
        const fiveMinutes = 5 * 60 * 1000;
        return (expiration.getTime() - Date.now()) < fiveMinutes;
    }

    /**
     * Auto-refresh token if near expiration
     * @returns {Promise<void>}
     */
    async autoRefreshToken() {
        if (this.isTokenNearExpiration()) {
            await this.refreshToken();
        }
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        // Check every minute
        setInterval(() => {
            if (this.isAuthenticated()) {
                this.autoRefreshToken();
            }
        }, 60000);
    }

    /**
     * Clear all authentication data and redirect to login
     */
    forceLogout() {
        this.apiClient.clearStorage();
        this.handleAuthStateChange(false);
        this.emit('logout');
        
        // Optionally redirect to login page
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }
}

// Export for use in other modules
window.AuthManager = AuthManager;