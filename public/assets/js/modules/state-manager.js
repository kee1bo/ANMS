// State Management System
class StateManager extends EventEmitter {
    constructor() {
        super();
        this.state = {
            user: null,
            pets: [],
            currentPet: null,
            nutritionPlans: {},
            healthRecords: {},
            ui: {
                loading: false,
                activeModal: null,
                notifications: []
            }
        };
        this.subscribers = new Map();
    }

    // Get current state
    getState() {
        return { ...this.state };
    }

    // Get specific state slice
    getStateSlice(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    // Update state and notify subscribers
    setState(updates) {
        const previousState = { ...this.state };
        this.state = this.deepMerge(this.state, updates);
        
        // Notify subscribers of state changes
        this.notifySubscribers(previousState, this.state);
        this.emit('stateChanged', { previous: previousState, current: this.state });
    }

    // Subscribe to state changes
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);

        // Return unsubscribe function
        return () => {
            const pathSubscribers = this.subscribers.get(path);
            if (pathSubscribers) {
                pathSubscribers.delete(callback);
                if (pathSubscribers.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    // Notify subscribers of changes
    notifySubscribers(previousState, currentState) {
        this.subscribers.forEach((callbacks, path) => {
            const previousValue = this.getValueByPath(previousState, path);
            const currentValue = this.getValueByPath(currentState, path);
            
            if (JSON.stringify(previousValue) !== JSON.stringify(currentValue)) {
                callbacks.forEach(callback => {
                    callback(currentValue, previousValue);
                });
            }
        });
    }

    // Helper to get value by path
    getValueByPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Deep merge utility
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // Action creators for common state updates
    actions = {
        setUser: (user) => this.setState({ user }),
        setPets: (pets) => this.setState({ pets }),
        addPet: (pet) => {
            const pets = [...this.state.pets, pet];
            this.setState({ pets });
        },
        updatePet: (petId, updates) => {
            const pets = this.state.pets.map(pet => 
                pet.id === petId ? { ...pet, ...updates } : pet
            );
            this.setState({ pets });
        },
        setCurrentPet: (pet) => this.setState({ currentPet: pet }),
        setLoading: (loading) => this.setState({ ui: { ...this.state.ui, loading } }),
        addNotification: (notification) => {
            const notifications = [...this.state.ui.notifications, {
                id: Date.now(),
                timestamp: new Date(),
                ...notification
            }];
            this.setState({ ui: { ...this.state.ui, notifications } });
        },
        removeNotification: (id) => {
            const notifications = this.state.ui.notifications.filter(n => n.id !== id);
            this.setState({ ui: { ...this.state.ui, notifications } });
        }
    };
}

// Export for module use
window.StateManager = StateManager;