importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Must include all required config values including appId
firebase.initializeApp({
  apiKey: 'AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q',
  authDomain: 'chopchop-67750.firebaseapp.com',
  projectId: 'chopchop-67750',
  storageBucket: 'chopchop-67750.firebasestorage.app',
  messagingSenderId: '835361851966',
  appId: '1:835361851966:web:78810ea4389297a8679f6f'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = (payload && payload.notification && payload.notification.title) || 'New delivery available';
  const options = {
    body: (payload && payload.notification && payload.notification.body) || '',
    data: (payload && payload.data) || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
