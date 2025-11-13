importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// the messagingSenderId. Other firebase config values are optional here
firebase.initializeApp({
  apiKey: 'AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q',
  projectId: 'chopchop-67750',
  messagingSenderId: '835361851966'
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
