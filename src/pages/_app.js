import '../styles/globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '../lib/apollo';
import { useEffect, useState } from 'react';
import { registerMessagingSW, requestAndGetFcmToken, onMessageHandler } from '../lib/firebase';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Register service worker and request permission for notifications
    (async () => {
      try {
        await registerMessagingSW();
        const token = await requestAndGetFcmToken();
        if (token) {
          const user = auth.currentUser;
          if (user) {
            const riderRef = doc(db, 'riders', user.uid);
            await setDoc(riderRef, { fcmToken: token }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('FCM setup in app failed:', e.message || e);
      }
    })();
  }, []);

  // In-app (foreground) message toasts
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    onMessageHandler((payload) => {
      try {
        const title = payload?.notification?.title || 'Notification';
        const body = payload?.notification?.body || payload?.data?.body || '';
        const url = payload?.data?.url || '';
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, title, body, url }]);
        // auto-remove after 6s
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
      } catch (e) {
        console.warn('Failed to show in-app toast:', e.message || e);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />

        {/* Simple toast container for foreground notifications */}
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <div key={t.id} onClick={() => { if (t.url) window.open(t.url, '_blank'); }} style={{ cursor: t.url ? 'pointer' : 'default', minWidth: 260, maxWidth: 360, background: 'white', padding: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.12)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: '#333' }}>{t.body}</div>
            </div>
          ))}
        </div>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
