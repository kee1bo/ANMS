/**
 * Service Worker for ANMS Dashboard
 * Provides offline functionality and asset caching
 */

const CACHE_NAME = 'anms-dashboard-v1';
const STATIC_CACHE_NAME = 'anms-static-v1';
const DYNAMIC_CACHE_NAME = 'anms-dynamic-v1';

// Critical assets to cache immediately for performance
const CRITICAL_ASSETS = [
    '/',
    '/working-dashboard.html',
    '/assets/css/app.css',
    '/assets/css/dashboard.css',
    '/assets/js/app.js',
    '/assets/js/components/loading-manager.js',
    '/assets/js/utils/retry-manager.js',
    '/assets/js/utils/network-monitor.js',
    '/assets/js/utils/performance-monitor.js'
];

// Non-critical assets to cache lazily
const STATIC_ASSETS = [
    '/index.html',
    '/assets/css/professional-modal.css',
    '/assets/js/components/dashboard-statistics.js',
    '/assets/js/components/activity-feed.js',
    '/assets/js/components/quick-actions.js',
    '/assets/js/components/error-handler.js',
    '/assets/js/components/cache-manager.js',
    '/assets/js/components/health-metrics.js',
    '/assets/js/components/nutrition-insights.js',
    '/assets/js/components/checkup-reminders.js',
    '/assets/js/components/photo-gallery-quick-access.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// API endpoints to cache with different strategies
const API_CACHE_STRATEGIES = {
    '/api/dashboard.php': 'networkFirst',
    '/api/pets.php': 'networkFirst',
    '/api/photos.php': 'cacheFirst',
    '/api/health-conditions.php': 'networkFirst',
    '/api/checkup-reminders.php': 'networkFirst'
};

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    api: 5 * 60 * 1000, // 5 minutes
    images: 30 * 24 * 60 * 60 * 1000 // 30 days
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('anms-')) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(url)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isApiRequest(url)) {
        event.respondWith(handleApiRequest(request));
    } else if (isImageRequest(url)) {
        event.respondWith(handleImageRequest(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

/**
 * Handle static assets (CSS, JS, fonts)
 */
async function handleStaticAsset(request) {
    try {
        // Cache first strategy for static assets
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch and cache
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.error('Static asset fetch failed:', error);
        
        // Return cached version if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback
        return new Response('Asset not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Handle API requests
 */
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const strategy = getApiCacheStrategy(url.pathname);
    
    switch (strategy) {
        case 'networkFirst':
            return handleNetworkFirst(request);
        case 'cacheFirst':
            return handleCacheFirst(request);
        case 'networkOnly':
            return handleNetworkOnly(request);
        default:
            return handleNetworkFirst(request);
    }
}

/**
 * Network first strategy
 */
async function handleNetworkFirst(request) {
    try {
        // Try network first
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return createOfflineResponse(request);
    }
}

/**
 * Cache first strategy
 */
async function handleCacheFirst(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse && !isCacheExpired(cachedResponse)) {
            return cachedResponse;
        }
        
        // Fallback to network
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        // Return cached version even if expired
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return createOfflineResponse(request);
    }
}

/**
 * Network only strategy
 */
async function handleNetworkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        return createOfflineResponse(request);
    }
}

/**
 * Handle image requests
 */
async function handleImageRequest(request) {
    try {
        // Cache first for images
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fetch and cache
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        // Return placeholder image or cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return placeholder image
        return new Response('', {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
}

/**
 * Handle other requests
 */
async function handleOtherRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        // Try to return cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match('/working-dashboard.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        
        return new Response('Not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Utility functions
 */
function isStaticAsset(url) {
    return url.pathname.match(/\.(css|js|woff|woff2|ttf|eot|ico)$/);
}

function isApiRequest(url) {
    return url.pathname.startsWith('/api/');
}

function isImageRequest(url) {
    return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
}

function getApiCacheStrategy(pathname) {
    for (const [path, strategy] of Object.entries(API_CACHE_STRATEGIES)) {
        if (pathname.startsWith(path)) {
            return strategy;
        }
    }
    return 'networkFirst';
}

function isCacheExpired(response) {
    const cacheDate = response.headers.get('sw-cache-date');
    if (!cacheDate) return false;
    
    const age = Date.now() - new Date(cacheDate).getTime();
    return age > CACHE_DURATIONS.api;
}

function createOfflineResponse(request) {
    const url = new URL(request.url);
    
    if (isApiRequest(url)) {
        // Return appropriate offline API response
        return new Response(JSON.stringify({
            success: false,
            error: 'Offline - data not available',
            offline: true
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    
    return new Response('Not available offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

/**
 * Background sync for queued requests
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(processQueuedRequests());
    }
});

async function processQueuedRequests() {
    // Process any queued requests when back online
    console.log('Processing queued requests...');
    
    // This would integrate with the cache manager's retry queue
    // For now, just log that sync is working
    
    try {
        // Notify clients that sync is happening
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                payload: { status: 'processing' }
            });
        });
        
        // Process actual queued requests here
        // This would involve reading from IndexedDB or another storage
        
        console.log('Background sync completed');
        
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'New notification from ANMS',
        icon: '/assets/images/icon-192.png',
        badge: '/assets/images/badge-72.png',
        tag: data.tag || 'anms-notification',
        data: data.data || {},
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'ANMS', options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const data = event.notification.data;
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Try to focus existing window
                for (const client of clientList) {
                    if (client.url.includes('dashboard') && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow('/working-dashboard.html');
                }
            })
    );
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(cacheUrls(payload.urls));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearCache(payload.cacheName));
            break;
            
        case 'GET_CACHE_SIZE':
            event.waitUntil(getCacheSize().then(size => {
                event.ports[0].postMessage({ size });
            }));
            break;
    }
});

async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    return cache.addAll(urls);
}

async function clearCache(cacheName) {
    return caches.delete(cacheName || DYNAMIC_CACHE_NAME);
}

async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}