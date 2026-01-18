import '../styles/globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '../lib/apollo';
import { useEffect, useState } from 'react';
import { registerMessagingSW, requestAndGetFcmToken, onMessageHandler } from '../lib/firebase';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Toaster, toast } from 'react-hot-toast';

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
  useEffect(() => {
    onMessageHandler((payload) => {
      try {
        const title = payload?.notification?.title || 'Notification';
        const body = payload?.notification?.body || payload?.data?.body || '';

        // Show rich toast
        toast((t) => (
          <div onClick={() => { if (payload?.data?.url) window.open(payload.data.url, '_blank'); toast.dismiss(t.id); }} style={{ cursor: 'pointer' }}>
            <p className="font-bold text-sm">{title}</p>
            <p className="text-sm">{body}</p>
          </div>
        ), {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          },
        });
      } catch (e) {
        console.warn('Failed to show in-app toast:', e.message || e);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
        <Toaster />
      </ApolloProvider>
    </ErrorBoundary>
  );
}
