// Service Worker for All-In Chat Poker Enhanced Pages
const CACHE_NAME = 'allinchatpoker-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index-enhanced.html',
    '/about-enhanced.html',
    '/help-enhanced.html',
    '/contact-enhanced.html',
    '/store-enhanced.html',
    '/setup-enhanced.html',
    '/profile-enhanced.html',
    '/admin-enhanced.html',
    '/overlay-editor-enhanced.html',
    '/welcome-enhanced.html',
    '/component-demo.html',
    '/theme-demo.html',
    '/style-enhanced-common.css',
    '/js-enhanced-common.js',
    '/theme-manager.js',
    '/components.js',
    '/performance-optimizer.js',
    '/ai-help-integration.js',
    '/logo.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and external requests
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(response => {
                // Return cached response if available
                if (response) {
                    console.log('Service Worker: Serving from cache:', request.url);
                    return response;
                }
                
                // Try network
                return fetch(request)
                    .then(response => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    console.log('Service Worker: Caching dynamic resource:', request.url);
                                    cache.put(request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Network failed, try to serve from cache
                        console.log('Service Worker: Network failed, trying cache fallback');
                        return caches.match(request)
                            .then(cachedResponse => {
                                if (cachedResponse) {
                                    return cachedResponse;
                                }
                                
                                // Return offline page for HTML requests
                                if (request.headers.get('accept').includes('text/html')) {
                                    return caches.match('/offline.html');
                                }
                                
                                // Return error for other requests
                                return new Response('Network error', {
                                    status: 408,
                                    statusText: 'Network error'
                                });
                            });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle background sync tasks
    try {
        // Sync any pending data
        const pendingData = await getPendingData();
        for (const data of pendingData) {
            await syncData(data);
        }
        console.log('Service Worker: Background sync completed');
    } catch (error) {
        console.error('Service Worker: Background sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore this new content',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close notification',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('All-In Chat Poker', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app to relevant content
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    } else if (event.action === 'close') {
        // Just close the notification
        event.notification.close();
    } else {
        // Default: open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CACHE_UPDATE':
            updateCache(data);
            break;
        case 'CLEAR_CACHE':
            clearCache();
            break;
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});

// Cache management functions
async function updateCache(data) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(data.url, data.response);
        console.log('Service Worker: Cache updated for:', data.url);
    } catch (error) {
        console.error('Service Worker: Cache update failed:', error);
    }
}

async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Cache clear failed:', error);
    }
}

// Data synchronization helpers
async function getPendingData() {
    // Get pending data from IndexedDB or localStorage
    // This is a placeholder implementation
    return [];
}

async function syncData(data) {
    // Sync data with server
    // This is a placeholder implementation
    console.log('Service Worker: Syncing data:', data);
    return true;
}

// Periodic cache cleanup
self.addEventListener('activate', (event) => {
    // Clean up old caches periodically
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Keep only the two main caches
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Network status monitoring
self.addEventListener('online', () => {
    console.log('Service Worker: Network is online');
    // Trigger any pending syncs
    self.registration.sync.register('background-sync');
});

self.addEventListener('offline', () => {
    console.log('Service Worker: Network is offline');
});

// Performance monitoring
self.addEventListener('fetch', (event) => {
    // Monitor fetch performance
    const start = performance.now();
    
    event.respondWith(
        fetch(event.request).then(response => {
            const duration = performance.now() - start;
            
            // Log slow requests
            if (duration > 1000) {
                console.warn('Service Worker: Slow request detected:', {
                    url: event.request.url,
                    duration: duration
                });
            }
            
            return response;
        })
    );
});

// Cache strategy helpers
const cacheStrategies = {
    // Cache first, falling back to network
    cacheFirst: (request) => {
        return caches.match(request)
            .then(response => {
                return response || fetch(request);
            });
    },
    
    // Network first, falling back to cache
    networkFirst: (request) => {
        return fetch(request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.put(request, responseClone));
                return response;
            })
            .catch(() => {
                return caches.match(request);
            });
    },
    
    // Stale while revalidate
    staleWhileRevalidate: (request) => {
        return caches.match(request)
            .then(response => {
                const fetchPromise = fetch(request)
                    .then(networkResponse => {
                        const networkResponseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, networkResponseClone));
                        return networkResponse;
                    });
                
                return response || fetchPromise;
            });
    }
};

// Dynamic cache strategy selection
function getCacheStrategy(request) {
    const url = new URL(request.url);
    
    // Use different strategies based on request type
    if (url.pathname.includes('/api/')) {
        return cacheStrategies.networkFirst;
    } else if (url.pathname.includes('/static/')) {
        return cacheStrategies.cacheFirst;
    } else {
        return cacheStrategies.staleWhileRevalidate;
    }
}

// Enhanced fetch with cache strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and external requests
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }
    
    // Use appropriate cache strategy
    const strategy = getCacheStrategy(request);
    
    event.respondWith(
        strategy(request)
            .catch(error => {
                console.error('Service Worker: Cache strategy failed:', error);
                return new Response('Service worker error', {
                    status: 500,
                    statusText: 'Service worker error'
                });
            })
    );
});

console.log('Service Worker: Loaded');
