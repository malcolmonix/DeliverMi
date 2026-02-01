// Firebase Messaging Service Worker
// This file handles background push notifications
// NOTE: Firebase config must be set here for the service worker to function.

importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values are from chopchop-67750 Firebase project
const firebaseConfig = {
  apiKey: 'AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q',
  authDomain: 'chopchop-67750.firebaseapp.com',
  projectId: 'chopchop-67750',
  storageBucket: 'chopchop-67750.firebasestorage.app',
  messagingSenderId: '835361851966',
  appId: '1:835361851966:web:78810ea4389297a8679f6f'
};

// Initialize Firebase with error handling
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);
    console.log('[DeliverMi-SW] Firebase initialized successfully');

    const messaging = firebase.messaging();

    // Handle background messages with error handling
    messaging.onBackgroundMessage((payload) => {
      try {
        console.log('[DeliverMi-SW] Received background message:', payload);

        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new message',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'message-notification',
          data: payload.data,
          actions: [
            {
              action: 'view',
              title: 'View',
            }
          ]
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
      } catch (error) {
        console.error('[DeliverMi-SW] Error handling background message:', error);
      }
    });
  } else {
    console.warn('[DeliverMi-SW] Firebase config incomplete, skipping initialization');
  }
} catch (error) {
  console.error('[DeliverMi-SW] Firebase initialization failed:', error);
}

// Handle notification click with error handling
self.addEventListener('notificationclick', (event) => {
  try {
    console.log('[DeliverMi-SW] Notification clicked:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window/tab open
          for (const client of clientList) {
            if (client.url.includes(self.registration.scope) && 'focus' in client) {
              try {
                client.postMessage({
                  type: 'NOTIFICATION_CLICKED',
                  data: event.notification.data
                });
                return client.focus();
              } catch (msgError) {
                console.warn('[DeliverMi-SW] Failed to post message to client:', msgError);
                // Continue to open new window if messaging fails
              }
            }
          }
          // Open a new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
        .catch((error) => {
          console.error('[DeliverMi-SW] Error handling notification click:', error);
        })
    );
  } catch (error) {
    console.error('[DeliverMi-SW] Error in notification click handler:', error);
  }
});

// Handle service worker errors
self.addEventListener('error', (event) => {
  console.error('[DeliverMi-SW] Service worker error:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('[DeliverMi-SW] Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});
