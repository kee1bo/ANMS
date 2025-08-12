/**
 * Cache Manager Component
 * Provides comprehensive caching functionality for offline support
 */
class CacheManager {
    constructor(options = {}) {
        this.options = {
            defaultTTL: options.defaultTTL || 3600000, // 1 hour
            maxCacheSize: options.maxCacheSize || 50 * 1024 * 1024, // 50MB
            enableCompression: options.enableCompression !== false,
            enableEncryption: options.enableEncryption || false,
            storagePrefix: options.storagePrefix || 'anms_cache_',
            cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
            ...options
        };
        
        this.storage = this.getStorageEngine();
        this.compressionWorker = null;
        this.cleanupTimer = null;
        
        this.init();
    }
    
    init() {
        this.startCleanupTimer();
        this.setupStorageEventListeners();
        this.initializeCompressionWorker();
    }
    
    /**
     * Get appropriate storage engine
     */
    getStorageEngine() {
        // Try IndexedDB first, fallback to localStorage
        if (this.isIndexedDBSupported()) {
            return new IndexedDBStorage(this.options);
        } else if (this.isLocalStorageSupported()) {
            return new LocalStorageEngine(this.options);
        } else {
            return new MemoryStorage(this.options);
        }
    }
    
    /**
     * Cache data with automatic expiration
     */
    async set(key, data, ttl = null) {
        try {
            const cacheKey = this.getCacheKey(key);
            const expiresAt = Date.now() + (ttl || this.options.defaultTTL);
            
            let processedData = data;
            
            // Compress data if enabled
            if (this.options.enableCompression && this.shouldCompress(data)) {
                processedData = await this.compress(data);
            }
            
            // Encrypt data if enabled
            if (this.options.enableEncryption) {
                processedData = await this.encrypt(processedData);
            }
            
            const cacheEntry = {
                key: cacheKey,
                data: processedData,
                timestamp: Date.now(),
                expiresAt,
                compressed: this.options.enableCompression && this.shouldCompress(data),
                encrypted: this.options.enableEncryption,
                size: this.calculateSize(processedData)
            };
            
            // Check cache size limits
            await this.ensureCacheSpace(cacheEntry.size);
            
            // Store the data
            await this.storage.setItem(cacheKey, cacheEntry);
            
            // Update cache metadata
            await this.updateCacheMetadata(cacheKey, cacheEntry);
            
            return true;
            
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }
    
    /**
     * Retrieve cached data
     */
    async get(key) {
        try {
            const cacheKey = this.getCacheKey(key);
            const cacheEntry = await this.storage.getItem(cacheKey);
            
            if (!cacheEntry) {
                return null;
            }
            
            // Check if expired
            if (Date.now() > cacheEntry.expiresAt) {
                await this.delete(key);
                return null;
            }
            
            let data = cacheEntry.data;
            
            // Decrypt if needed
            if (cacheEntry.encrypted) {
                data = await this.decrypt(data);
            }
            
            // Decompress if needed
            if (cacheEntry.compressed) {
                data = await this.decompress(data);
            }
            
            // Update access time for LRU
            await this.updateAccessTime(cacheKey);
            
            return data;
            
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    /**
     * Check if key exists and is not expired
     */
    async has(key) {
        try {
            const cacheKey = this.getCacheKey(key);
            const cacheEntry = await this.storage.getItem(cacheKey);
            
            if (!cacheEntry) {
                return false;
            }
            
            // Check if expired
            if (Date.now() > cacheEntry.expiresAt) {
                await this.delete(key);
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('Cache has error:', error);
            return false;
        }
    }
    
    /**
     * Delete cached item
     */
    async delete(key) {
        try {
            const cacheKey = this.getCacheKey(key);
            await this.storage.removeItem(cacheKey);
            await this.removeCacheMetadata(cacheKey);
            return true;
            
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }
    
    /**
     * Clear all cached data
     */
    async clear() {
        try {
            const keys = await this.getAllKeys();
            
            for (const key of keys) {
                await this.storage.removeItem(key);
            }
            
            await this.clearCacheMetadata();
            return true;
            
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }
    
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const metadata = await this.getCacheMetadata();
            const keys = await this.getAllKeys();
            
            let totalSize = 0;
            let expiredCount = 0;
            const now = Date.now();
            
            for (const key of keys) {
                const entry = await this.storage.getItem(key);
                if (entry) {
                    totalSize += entry.size || 0;
                    if (now > entry.expiresAt) {
                        expiredCount++;
                    }
                }
            }
            
            return {
                totalItems: keys.length,
                totalSize,
                expiredItems: expiredCount,
                hitRate: metadata.hitRate || 0,
                lastCleanup: metadata.lastCleanup || 0,
                storageEngine: this.storage.constructor.name
            };
            
        } catch (error) {
            console.error('Cache stats error:', error);
            return {
                totalItems: 0,
                totalSize: 0,
                expiredItems: 0,
                hitRate: 0,
                lastCleanup: 0,
                storageEngine: 'unknown'
            };
        }
    }
    
    /**
     * Cache dashboard statistics
     */
    async cacheDashboardStats(stats) {
        return await this.set('dashboard_stats', stats, 300000); // 5 minutes
    }
    
    /**
     * Get cached dashboard statistics
     */
    async getCachedDashboardStats() {
        return await this.get('dashboard_stats');
    }
    
    /**
     * Cache pet data
     */
    async cachePetData(pets) {
        return await this.set('pet_data', pets, 600000); // 10 minutes
    }
    
    /**
     * Get cached pet data
     */
    async getCachedPetData() {
        return await this.get('pet_data');
    }
    
    /**
     * Cache activity feed
     */
    async cacheActivityFeed(activities) {
        return await this.set('activity_feed', activities, 60000); // 1 minute
    }
    
    /**
     * Get cached activity feed
     */
    async getCachedActivityFeed() {
        return await this.get('activity_feed');
    }
    
    /**
     * Cache API response
     */
    async cacheApiResponse(url, response, ttl = null) {
        const key = `api_${this.hashString(url)}`;
        return await this.set(key, response, ttl);
    }
    
    /**
     * Get cached API response
     */
    async getCachedApiResponse(url) {
        const key = `api_${this.hashString(url)}`;
        return await this.get(key);
    }
    
    /**
     * Cleanup expired entries
     */
    async cleanup() {
        try {
            const keys = await this.getAllKeys();
            const now = Date.now();
            let cleanedCount = 0;
            
            for (const key of keys) {
                const entry = await this.storage.getItem(key);
                if (entry && now > entry.expiresAt) {
                    await this.storage.removeItem(key);
                    cleanedCount++;
                }
            }
            
            // Update metadata
            await this.updateCacheMetadata('lastCleanup', now);
            
            console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
            return cleanedCount;
            
        } catch (error) {
            console.error('Cache cleanup error:', error);
            return 0;
        }
    }
    
    /**
     * Ensure cache space by removing old entries if needed
     */
    async ensureCacheSpace(requiredSize) {
        const stats = await this.getStats();
        
        if (stats.totalSize + requiredSize > this.options.maxCacheSize) {
            // Remove expired entries first
            await this.cleanup();
            
            // If still not enough space, remove oldest entries (LRU)
            const updatedStats = await this.getStats();
            if (updatedStats.totalSize + requiredSize > this.options.maxCacheSize) {
                await this.evictOldestEntries(requiredSize);
            }
        }
    }
    
    /**
     * Evict oldest entries to make space
     */
    async evictOldestEntries(requiredSize) {
        try {
            const keys = await this.getAllKeys();
            const entries = [];
            
            // Get all entries with their access times
            for (const key of keys) {
                const entry = await this.storage.getItem(key);
                if (entry) {
                    entries.push({ key, entry });
                }
            }
            
            // Sort by access time (oldest first)
            entries.sort((a, b) => (a.entry.lastAccessed || a.entry.timestamp) - (b.entry.lastAccessed || b.entry.timestamp));
            
            let freedSpace = 0;
            let evictedCount = 0;
            
            for (const { key, entry } of entries) {
                if (freedSpace >= requiredSize) {
                    break;
                }
                
                await this.storage.removeItem(key);
                freedSpace += entry.size || 0;
                evictedCount++;
            }
            
            console.log(`Cache eviction: removed ${evictedCount} entries, freed ${freedSpace} bytes`);
            
        } catch (error) {
            console.error('Cache eviction error:', error);
        }
    }
    
    /**
     * Utility methods
     */
    getCacheKey(key) {
        return `${this.options.storagePrefix}${key}`;
    }
    
    shouldCompress(data) {
        const size = this.calculateSize(data);
        return size > 1024; // Compress if larger than 1KB
    }
    
    calculateSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    async compress(data) {
        if (this.compressionWorker) {
            return new Promise((resolve, reject) => {
                this.compressionWorker.postMessage({ action: 'compress', data });
                this.compressionWorker.onmessage = (e) => {
                    if (e.data.error) {
                        reject(new Error(e.data.error));
                    } else {
                        resolve(e.data.result);
                    }
                };
            });
        }
        
        // Fallback: simple JSON compression
        return JSON.stringify(data);
    }
    
    async decompress(data) {
        if (this.compressionWorker) {
            return new Promise((resolve, reject) => {
                this.compressionWorker.postMessage({ action: 'decompress', data });
                this.compressionWorker.onmessage = (e) => {
                    if (e.data.error) {
                        reject(new Error(e.data.error));
                    } else {
                        resolve(e.data.result);
                    }
                };
            });
        }
        
        // Fallback: simple JSON decompression
        return JSON.parse(data);
    }
    
    async encrypt(data) {
        // Simple encryption implementation
        // In production, use proper encryption
        return btoa(JSON.stringify(data));
    }
    
    async decrypt(data) {
        // Simple decryption implementation
        // In production, use proper decryption
        return JSON.parse(atob(data));
    }
    
    async getAllKeys() {
        return await this.storage.getAllKeys();
    }
    
    async getCacheMetadata() {
        const metadata = await this.storage.getItem(`${this.options.storagePrefix}metadata`);
        return metadata || {};
    }
    
    async updateCacheMetadata(key, value) {
        const metadata = await this.getCacheMetadata();
        metadata[key] = value;
        await this.storage.setItem(`${this.options.storagePrefix}metadata`, metadata);
    }
    
    async removeCacheMetadata(key) {
        const metadata = await this.getCacheMetadata();
        delete metadata[key];
        await this.storage.setItem(`${this.options.storagePrefix}metadata`, metadata);
    }
    
    async clearCacheMetadata() {
        await this.storage.removeItem(`${this.options.storagePrefix}metadata`);
    }
    
    async updateAccessTime(key) {
        const entry = await this.storage.getItem(key);
        if (entry) {
            entry.lastAccessed = Date.now();
            await this.storage.setItem(key, entry);
        }
    }
    
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.cleanupInterval);
    }
    
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    
    setupStorageEventListeners() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.options.storagePrefix)) {
                // Handle cache invalidation from other tabs
                console.log('Cache invalidated from another tab:', e.key);
            }
        });
    }
    
    initializeCompressionWorker() {
        if (typeof Worker !== 'undefined' && this.options.enableCompression) {
            try {
                // Create compression worker if supported
                const workerCode = `
                    self.onmessage = function(e) {
                        const { action, data } = e.data;
                        try {
                            if (action === 'compress') {
                                // Simple compression using JSON
                                const result = JSON.stringify(data);
                                self.postMessage({ result });
                            } else if (action === 'decompress') {
                                const result = JSON.parse(data);
                                self.postMessage({ result });
                            }
                        } catch (error) {
                            self.postMessage({ error: error.message });
                        }
                    };
                `;
                
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                this.compressionWorker = new Worker(URL.createObjectURL(blob));
                
            } catch (error) {
                console.warn('Failed to create compression worker:', error);
            }
        }
    }
    
    isIndexedDBSupported() {
        return typeof indexedDB !== 'undefined';
    }
    
    isLocalStorageSupported() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Public API methods
     */
    async invalidatePattern(pattern) {
        const keys = await this.getAllKeys();
        const regex = new RegExp(pattern);
        
        for (const key of keys) {
            if (regex.test(key)) {
                await this.storage.removeItem(key);
            }
        }
    }
    
    async getSize() {
        const stats = await this.getStats();
        return stats.totalSize;
    }
    
    async export() {
        const keys = await this.getAllKeys();
        const exportData = {};
        
        for (const key of keys) {
            const entry = await this.storage.getItem(key);
            if (entry) {
                exportData[key] = entry;
            }
        }
        
        return exportData;
    }
    
    async import(data) {
        for (const [key, entry] of Object.entries(data)) {
            await this.storage.setItem(key, entry);
        }
    }
    
    destroy() {
        this.stopCleanupTimer();
        
        if (this.compressionWorker) {
            this.compressionWorker.terminate();
            this.compressionWorker = null;
        }
    }
}

/**
 * IndexedDB Storage Engine
 */
class IndexedDBStorage {
    constructor(options) {
        this.dbName = options.storagePrefix + 'db';
        this.dbVersion = 1;
        this.storeName = 'cache';
        this.db = null;
    }
    
    async init() {
        if (this.db) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
        });
    }
    
    async getItem(key) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    
    async setItem(key, value) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ key, ...value });
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    
    async removeItem(key) {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    
    async getAllKeys() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

/**
 * LocalStorage Engine
 */
class LocalStorageEngine {
    constructor(options) {
        this.prefix = options.storagePrefix;
    }
    
    async getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('LocalStorage getItem error:', error);
            return null;
        }
    }
    
    async setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('LocalStorage setItem error:', error);
            throw error;
        }
    }
    
    async removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('LocalStorage removeItem error:', error);
        }
    }
    
    async getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }
}

/**
 * Memory Storage Engine (fallback)
 */
class MemoryStorage {
    constructor(options) {
        this.data = new Map();
        this.prefix = options.storagePrefix;
    }
    
    async getItem(key) {
        return this.data.get(key) || null;
    }
    
    async setItem(key, value) {
        this.data.set(key, value);
    }
    
    async removeItem(key) {
        this.data.delete(key);
    }
    
    async getAllKeys() {
        return Array.from(this.data.keys()).filter(key => key.startsWith(this.prefix));
    }
}

// Initialize global cache manager
let cacheManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cacheManager = new CacheManager();
        window.cacheManager = cacheManager;
    });
} else {
    cacheManager = new CacheManager();
    window.cacheManager = cacheManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}