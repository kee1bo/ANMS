// Authentication Manager
class AuthManager extends EventEmitter {
    constructor(apiClient) {
        super();
        this.apiClient = apiClient;
        this.currentUser = null;
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;

        try {
            const response = await this.apiClient.get('/auth/me');
            this.currentUser = response.data.user;
            this.emit('authenticated', this.currentUser);
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    async login(credentials) {
        try {
            const response = await this.apiClient.post('/auth/login', credentials);
            
            this.apiClient.setToken(response.data.token);
            this.currentUser = response.data.user;
            
            // Store refresh token
            localStorage.setItem('refresh_token', response.data.refresh_token);
            
            this.emit('login', this.currentUser);
            return this.currentUser;
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async register(userData) {
        try {
            const response = await this.apiClient.post('/auth/register', userData);
            return response.data.user;
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    }

    logout() {
        this.apiClient.setToken(null);
        localStorage.removeItem('refresh_token');
        this.currentUser = null;
        this.emit('logout');
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            this.logout();
            return false;
        }

        try {
            const response = await this.apiClient.post('/auth/refresh', {
                refresh_token: refreshToken
            });
            
            this.apiClient.setToken(response.data.token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
            
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasRole(role) {
        return this.currentUser?.role === role;
    }
}