// Service Worker for Tooth Brushing App
const CACHE_NAME = 'tooth-brushing-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/timer.js',
    '/data.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Sync any pending data when back online
    return Promise.resolve();
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Diş fırçalama zamanı!',
        icon: 'assets/icon-192x192.png',
        badge: 'assets/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Fırçala',
                icon: 'assets/checkmark.png'
            },
            {
                action: 'close',
                title: 'Daha Sonra',
                icon: 'assets/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Diş Fırçalama Hatırlatması', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        // Open the app and navigate to timer
        event.waitUntil(
            clients.openWindow('/?action=brush')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        console.log('Notification dismissed');
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'daily-reminder') {
        event.waitUntil(sendDailyReminder());
    }
});

function sendDailyReminder() {
    // Check if user has brushed today and send reminder if not
    return self.registration.showNotification('Günlük Hatırlatma', {
        body: 'Bugün dişlerini fırçaladın mı?',
        icon: 'assets/icon-192x192.png',
        badge: 'assets/badge-72x72.png',
        tag: 'daily-reminder'
    });
}

// Handle messages from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});