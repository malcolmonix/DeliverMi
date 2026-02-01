import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingConfig);
  console.error('Please check your .env.local file and ensure all required Firebase environment variables are set.');
}

let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
} else {
  app = getApps()[0];
  console.log('✅ Firebase app already initialized');
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Set authentication persistence to LOCAL (survives browser restarts)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Firebase Auth persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('❌ Failed to set Firebase Auth persistence:', error);
    });
}

// Add auth state change listener for debugging
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('🔐 User signed in:', user.email, 'UID:', user.uid);
    } else {
      console.log('🔐 User signed out');
    }
  });
}

// Messaging helpers (dynamic imports so server-side doesn't break)
export async function registerMessagingSW() {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    // Add cache busting to force update of service worker
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    // Force update check
    await reg.update();
    console.log('✅ Service worker registered and updated');
    return reg;
  } catch (e) {
    console.error('❌ Service worker registration failed:', e.message || e);
    return null;
  }
}

export async function requestAndGetFcmToken() {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.warn('VAPID key not configured in environment variables');
    return null;
  }
  
  try {
    // Check notification permission
    if (Notification.permission === 'denied') {
      console.warn('Notifications permission denied by user');
      return null;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('User denied notification permission');
        return null;
      }
    }
    
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    
    console.log('Requesting FCM token with VAPID key...');
    
    // VAPID keys from Firebase are base64url-encoded - use as-is
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    const token = await getToken(messaging, { vapidKey: vapidKey });
    
    if (token) {
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ No FCM token received');
      return null;
    }
  } catch (e) {
    console.error('❌ Failed to get FCM token:', e.message || e);
    if (e.code) console.error('Error code:', e.code);
    if (e.toString().includes('applicationServerKey')) {
      console.error('The VAPID key appears to be invalid. Please check Firebase Console > Project Settings > Cloud Messaging');
    }
    return null;
  }
}

export async function onMessageHandler(callback) {
  if (typeof window === 'undefined') return;
  try {
    const { getMessaging, onMessage } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    onMessage(messaging, callback);
  } catch (e) {
    console.warn('onMessage handler setup failed:', e.message || e);
  }
}