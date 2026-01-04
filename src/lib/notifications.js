import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let messaging = null;

// Initialize messaging only in browser
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
  }
}

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // Validate VAPID key before attempting to get token
      if (!VAPID_KEY || VAPID_KEY === 'undefined') {
        console.error('VAPID key is not configured. Skipping FCM token generation.');
        return null;
      }

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.warn('Messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      resolve(payload);
    });
  });

export const showNotification = (title, body, options = {}) => {
  if (typeof window === 'undefined') return;

  if ('Notification' in window && Notification.permission === 'granted') {
    // Try Service Worker first (Required for Android/Mobile)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, {
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [200, 100, 200],
            ...options,
          });
        })
        .catch((err) => {
          console.error('SW notification failed, falling back:', err);
          try {
            new Notification(title, {
              body,
              icon: '/icon-192x192.png',
              ...options,
            });
          } catch (e) {
            console.error('Notification fallback failed:', e);
          }
        });
    } else {
      // Fallback for browsers without SW support
      try {
        new Notification(title, {
          body,
          icon: '/icon-192x192.png',
          ...options,
        });
      } catch (e) {
        console.error('Notification constructor failed:', e);
      }
    }
  }
};
