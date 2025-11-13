import '../styles/globals.css';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '../lib/apollo';
import { useEffect } from 'react';
import { registerMessagingSW, requestAndGetFcmToken } from '../lib/firebase';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

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

  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
