/**
 * CalorieAI Service Worker
 * Handles offline functionality, caching, and background sync
 */

const CACHE_NAME = 'calorieai-v1.0.0';
const STATIC_CACHE = 'calorieai-static-v1.0.0';
const DATA_CACHE = 'calorieai-data-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/navigation.js',
    './js/storage.js',
    './js/audio.js',
    './js/ai.js',
    './js/indexeddb.js', // Will be created next
    './js/pwa.js'        // Will be created next
];

// API endpoints that can be cached
const API_CACHE_PATTERNS = [
    // Add AI service endpoints here when implemented
];

// Install event - cache static resources
self.addEventListener('install', event => {
    console.log('CalorieAI Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then(cache => {
                console.log('CalorieAI Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            }),
            
            // Cache data storage
            caches.open(DATA_CACHE).then(cache => {
                console.log('CalorieAI Service Worker: Data cache initialized');
                return cache;
            })
        ]).then(() => {
            console.log('CalorieAI Service Worker: Installation complete');
            // Force activation of new service worker
            return self.skipWaiting();
        }).catch(error => {
            console.error('CalorieAI Service Worker: Installation failed', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('CalorieAI Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DATA_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('CalorieAI Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('CalorieAI Service Worker: Activation complete');
        }).catch(error => {
            console.error('CalorieAI Service Worker: Activation failed', error);
        })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-HTTP(S) requests (chrome-extension, etc.)
    if (!['http:', 'https:'].includes(url.protocol)) {
        return;
    }
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (isStaticAsset(url)) {
            // Static assets - cache first strategy
            event.respondWith(handleStaticAsset(request));
        } else if (isAPIRequest(url)) {
            // API requests - network first with cache fallback
            event.respondWith(handleAPIRequest(request));
        } else {
            // Other requests - network first
            event.respondWith(handleNetworkFirst(request));
        }
    } else if (request.method === 'POST' && isAPIRequest(url)) {
        // Handle POST requests (AI service calls)
        event.respondWith(handleAPIPost(request));
    }
});

// Background sync for offline AI requests
self.addEventListener('sync', event => {
    console.log('CalorieAI Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'ai-request-sync') {
        event.waitUntil(processOfflineAIRequests());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('CalorieAI Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Time to log your meal!',
        icon: './assets/icon-192x192.png',
        badge: './assets/icon-72x72.png',
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Open CalorieAI'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('CalorieAI', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('CalorieAI Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Check if app is already open
                for (let client of clientList) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if not already open
                if (clients.openWindow) {
                    return clients.openWindow('./index.html');
                }
            })
        );
    }
});

// Helper functions

function isStaticAsset(url) {
    const pathname = url.pathname;
    return pathname.endsWith('.html') ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.json') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.ico') ||
           pathname === '/' ||
           pathname === './';
}

function isAPIRequest(url) {
    // Check if this is an AI service request
    return API_CACHE_PATTERNS.some(pattern => url.href.includes(pattern)) ||
           url.pathname.includes('/api/') ||
           url.hostname !== self.location.hostname;
}

async function handleStaticAsset(request) {
    try {
        // Skip non-HTTP(S) requests (chrome-extension, etc.)
        const url = new URL(request.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
            return fetch(request);
        }
        
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('CalorieAI Service Worker: Failed to handle static asset', error);
        
        // Return offline page if available
        if (request.destination === 'document') {
            const cache = await caches.open(STATIC_CACHE);
            return cache.match('./index.html');
        }
        
        throw error;
    }
}

async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DATA_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('CalorieAI Service Worker: Network failed, trying cache', error);
        
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'Request queued for when online'
            }),
            {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

async function handleNetworkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        // Try cache as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

async function handleAPIPost(request) {
    try {
        // Try to send the request
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('CalorieAI Service Worker: POST failed, queueing for sync');
        
        // Queue the request for background sync
        await queueRequestForSync(request);
        
        // Return accepted response
        return new Response(
            JSON.stringify({
                queued: true,
                message: 'Request queued for when online'
            }),
            {
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

async function queueRequestForSync(request) {
    try {
        // Store request data in IndexedDB for background sync
        const requestData = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: await request.text(),
            timestamp: Date.now()
        };
        
        // This will use IndexedDB (to be implemented)
        await storeOfflineRequest(requestData);
        
        // Register for background sync
        await self.registration.sync.register('ai-request-sync');
    } catch (error) {
        console.error('CalorieAI Service Worker: Failed to queue request', error);
    }
}

async function processOfflineAIRequests() {
    try {
        // Get queued requests from IndexedDB
        const queuedRequests = await getOfflineRequests();
        
        for (let requestData of queuedRequests) {
            try {
                // Recreate the request
                const request = new Request(requestData.url, {
                    method: requestData.method,
                    headers: requestData.headers,
                    body: requestData.body
                });
                
                // Try to send it
                const response = await fetch(request);
                
                if (response.ok) {
                    // Success - remove from queue and notify app
                    await removeOfflineRequest(requestData.timestamp);
                    await notifyAppOfSync(requestData, response);
                }
            } catch (error) {
                console.log('CalorieAI Service Worker: Sync failed for request', error);
                // Keep in queue for next sync attempt
            }
        }
    } catch (error) {
        console.error('CalorieAI Service Worker: Background sync failed', error);
    }
}

// IndexedDB operations (placeholders - will be implemented with IndexedDB)
async function storeOfflineRequest(requestData) {
    // TODO: Implement with IndexedDB
    console.log('CalorieAI Service Worker: Storing offline request', requestData);
}

async function getOfflineRequests() {
    // TODO: Implement with IndexedDB
    return [];
}

async function removeOfflineRequest(timestamp) {
    // TODO: Implement with IndexedDB
    console.log('CalorieAI Service Worker: Removing offline request', timestamp);
}

async function notifyAppOfSync(requestData, response) {
    // Notify all open clients about successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_SUCCESS',
            requestData: requestData,
            response: response
        });
    });
}