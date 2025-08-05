/**
 * API Client for PetNutri Application
 * Handles all communication with the backend PHP API
 */
class APIClient {
    constructor() {
        this.baseURL = '/api.php';
        this.token = this.getSecureToken();
        this.refreshToken = this.getSecureRefreshToken();
        this.user = null;
        this.tokenExpirationTimer = null;
        
        // Load user from secure storage if available
        const storedUser = this.getSecureUserData();
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
            } catch (e) {
                console.error('Error parsing stored user data:', e);
                this.clearStorage();
            }
        }

        // Set up token expiration monitoring
        this.setupTokenExpirationMonitoring();
    }

    /**
     * Get secure token from storage
     * @returns {string|null} Token or null
     */
    getSecureToken() {
        try {
            const token = localStorage.getItem('petnutri_token');
            if (token && this.isTokenValid(token)) {
                return token;
            }
            return null;
        } catch (error) {
            console.error('Error retrieving token:', error);
            return null;
        }
    }

    /**
     * Get secure refresh token from storage
     * @returns {string|null} Refresh token or null
     */
    getSecureRefreshToken() {
        try {
            return localStorage.getItem('petnutri_refresh_token');
        } catch (error) {
            console.error('Error retrieving refresh token:', error);
            return null;
        }
    }

    /**
     * Get secure user data from storage
     * @returns {string|null} User data or null
     */
    getSecureUserData() {
        try {
            return localStorage.getItem('petnutri_user');
        } catch (error) {
            console.error('Error retrieving user data:', error);
            return null;
        }
    }

    /**
     * Validate token format and expiration
     * @param {string} token - JWT token
     * @returns {boolean} Token validity
     */
    isTokenValid(token) {
        if (!token) return false;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            
            // Check if token is expired (with 30 second buffer)
            if (payload.exp && payload.exp < (now + 30)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    /**
     * Setup token expiration monitoring
     */
    setupTokenExpirationMonitoring() {
        if (this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }

        if (!this.token) return;

        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            if (payload.exp) {
                const expirationTime = payload.exp * 1000;
                const timeUntilExpiration = expirationTime - Date.now();
                
                // Set timer to refresh token 5 minutes before expiration
                const refreshTime = Math.max(0, timeUntilExpiration - (5 * 60 * 1000));
                
                this.tokenExpirationTimer = setTimeout(() => {
                    this.attemptTokenRefresh();
                }, refreshTime);
            }
        } catch (error) {
            console.error('Error setting up token expiration monitoring:', error);
        }
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     * @param {string} refreshToken - Refresh token
     */
    setToken(token, refreshToken = null) {
        this.token = token;
        if (token) {
            localStorage.setItem('petnutri_token', token);
            localStorage.setItem('petnutri_login_time', Date.now().toString());
            // Setup monitoring for the new token
            this.setupTokenExpirationMonitoring();
        } else {
            localStorage.removeItem('petnutri_token');
            localStorage.removeItem('petnutri_login_time');
            // Clear monitoring timer
            if (this.tokenExpirationTimer) {
                clearTimeout(this.tokenExpirationTimer);
                this.tokenExpirationTimer = null;
            }
        }
        
        if (refreshToken) {
            this.refreshToken = refreshToken;
            localStorage.setItem('petnutri_refresh_token', refreshToken);
        } else if (refreshToken === null) {
            // Explicitly clear refresh token
            this.refreshToken = null;
            localStorage.removeItem('petnutri_refresh_token');
        }
    }

    /**
     * Set current user data
     * @param {Object} user - User object
     */
    setUser(user) {
        this.user = user;
        if (user) {
            localStorage.setItem('petnutri_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('petnutri_user');
        }
    }

    /**
     * Get current user
     * @returns {Object|null} User object or null
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!(this.token && this.user);
    }

    /**
     * Clear all stored authentication data
     */
    clearStorage() {
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        localStorage.removeItem('petnutri_token');
        localStorage.removeItem('petnutri_refresh_token');
        localStorage.removeItem('petnutri_user');
    }

    /**
     * Make HTTP request to API
     * @param {string} action - API action/endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async request(action, options = {}) {
        const url = `${this.baseURL}?action=${action}`;
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Handle form data or JSON body
        if (config.body && !(config.body instanceof FormData)) {
            if (typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }
        }

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                // Try to parse as JSON, fallback to text
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text };
                }
            }

            // Handle authentication errors
            if (response.status === 401 && this.refreshToken) {
                // Try to refresh token
                const refreshed = await this.attemptTokenRefresh();
                if (refreshed) {
                    // Retry original request with new token
                    config.headers.Authorization = `Bearer ${this.token}`;
                    const retryResponse = await fetch(url, config);
                    return await retryResponse.json();
                } else {
                    // Refresh failed, clear auth and redirect to login
                    this.clearStorage();
                    window.location.reload();
                    throw new Error('Session expired. Please log in again.');
                }
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Attempt to refresh the authentication token
     * @returns {Promise<boolean>} Success status
     */
    async attemptTokenRefresh() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}?action=refresh_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.token, data.refresh_token);
                this.setUser(data.user);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        return false;
    }

    // ============================================================
    // Authentication Methods
    // ============================================================

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
        const response = await this.request('auth', {
            method: 'POST',
            body: {
                action: 'register',
                ...userData
            }
        });

        if (response.user && response.token) {
            this.setToken(response.token, response.refresh_token);
            this.setUser(response.user);
        }

        return response;
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response
     */
    async login(email, password) {
        const response = await this.request('auth', {
            method: 'POST',
            body: {
                action: 'login',
                email,
                password
            }
        });

        if (response.user && response.token) {
            this.setToken(response.token, response.refresh_token);
            this.setUser(response.user);
        }

        return response;
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await this.request('auth', {
                method: 'POST',
                body: { action: 'logout' }
            });
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            this.clearStorage();
        }
    }

    /**
     * Get current user profile
     * @returns {Promise<Object>} User profile
     */
    async getProfile() {
        return await this.request('auth', {
            method: 'POST',
            body: { action: 'profile' }
        });
    }

    // ============================================================
    // Pet Management Methods
    // ============================================================

    /**
     * Get all pets for current user
     * @returns {Promise<Array>} Array of pet objects
     */
    async getPets() {
        const response = await this.request('get_pets');
        return response.pets || [];
    }

    /**
     * Get single pet by ID
     * @param {number} petId - Pet ID
     * @returns {Promise<Object>} Pet object
     */
    async getPet(petId) {
        const response = await this.request('get_pets', {
            method: 'POST',
            body: { pet_id: petId }
        });
        return response.pet;
    }

    /**
     * Add new pet
     * @param {Object} petData - Pet data
     * @returns {Promise<Object>} Created pet object
     */
    async addPet(petData) {
        return await this.request('add_pet', {
            method: 'POST',
            body: petData
        });
    }

    /**
     * Update existing pet
     * @param {number} petId - Pet ID
     * @param {Object} petData - Updated pet data
     * @returns {Promise<Object>} Updated pet object
     */
    async updatePet(petId, petData) {
        return await this.request('update_pet', {
            method: 'POST',
            body: {
                pet_id: petId,
                ...petData
            }
        });
    }

    /**
     * Delete pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Object>} Success response
     */
    async deletePet(petId) {
        return await this.request('delete_pet', {
            method: 'POST',
            body: { pet_id: petId }
        });
    }

    /**
     * Upload pet photo
     * @param {number} petId - Pet ID
     * @param {File} photoFile - Photo file
     * @returns {Promise<Object>} Upload response
     */
    async uploadPetPhoto(petId, photoFile) {
        const formData = new FormData();
        formData.append('pet_id', petId);
        formData.append('photo', photoFile);

        return await this.request('upload_pet_photo', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type for FormData
        });
    }

    // ============================================================
    // Nutrition Management Methods
    // ============================================================

    /**
     * Generate nutrition plan for pet
     * @param {number} petId - Pet ID
     * @param {Object} preferences - Nutrition preferences
     * @returns {Promise<Object>} Nutrition plan
     */
    async generateNutritionPlan(petId, preferences) {
        return await this.request('diet_plan', {
            method: 'POST',
            body: {
                pet_id: petId,
                ...preferences
            }
        });
    }

    /**
     * Get nutrition plan for pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Object>} Nutrition plan
     */
    async getNutritionPlan(petId) {
        return await this.request('get_nutrition_plan', {
            method: 'POST',
            body: { pet_id: petId }
        });
    }

    /**
     * Save nutrition plan
     * @param {number} petId - Pet ID
     * @param {Object} planData - Nutrition plan data
     * @returns {Promise<Object>} Save response
     */
    async saveNutritionPlan(petId, planData) {
        return await this.request('save_nutrition_plan', {
            method: 'POST',
            body: {
                pet_id: petId,
                ...planData
            }
        });
    }

    // ============================================================
    // Health Tracking Methods
    // ============================================================

    /**
     * Log pet weight
     * @param {number} petId - Pet ID
     * @param {Object} weightData - Weight data
     * @returns {Promise<Object>} Log response
     */
    async logWeight(petId, weightData) {
        return await this.request('log_weight', {
            method: 'POST',
            body: {
                pet_id: petId,
                ...weightData
            }
        });
    }

    /**
     * Get weight history for pet
     * @param {number} petId - Pet ID
     * @param {number} days - Number of days to fetch (default: 90)
     * @returns {Promise<Array>} Weight history
     */
    async getWeightHistory(petId, days = 90) {
        return await this.request('get_weight_history', {
            method: 'POST',
            body: {
                pet_id: petId,
                days
            }
        });
    }

    /**
     * Log health record
     * @param {number} petId - Pet ID
     * @param {Object} healthData - Health record data
     * @returns {Promise<Object>} Log response
     */
    async logHealthRecord(petId, healthData) {
        return await this.request('log_health_record', {
            method: 'POST',
            body: {
                pet_id: petId,
                ...healthData
            }
        });
    }

    /**
     * Get health records for pet
     * @param {number} petId - Pet ID
     * @returns {Promise<Array>} Health records
     */
    async getHealthRecords(petId) {
        return await this.request('get_health_records', {
            method: 'POST',
            body: { pet_id: petId }
        });
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        return await this.request('health');
    }

    /**
     * Get application statistics
     * @returns {Promise<Object>} App statistics
     */
    async getStats() {
        return await this.request('stats');
    }

    /**
     * Send contact form
     * @param {Object} contactData - Contact form data
     * @returns {Promise<Object>} Send response
     */
    async sendContact(contactData) {
        return await this.request('contact', {
            method: 'POST',
            body: contactData
        });
    }
}

// Export for use in other modules
window.APIClient = APIClient;