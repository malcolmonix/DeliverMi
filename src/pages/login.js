import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// helper to fetch FCM token in browser (returns null if not available)
async function tryGetFcmToken() {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) return null;
  try {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    return token;
  } catch (err) {
    console.warn('FCM dynamic import/getToken failed:', err.message || err);
    return null;
  }
}
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const register = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      // Save rider info to Firestore under `riders/{uid}`
      try {
        const riderRef = doc(db, 'riders', userCred.user.uid);
        await setDoc(riderRef, {
          uid: userCred.user.uid,
          name: name || userCred.user.displayName || '',
          email: userCred.user.email || '',
          createdAt: serverTimestamp(),
          available: true,
          vehicle: null,
        });
        // try to obtain FCM token and save it to rider doc (if messaging configured)
        try {
          const fcmToken = await tryGetFcmToken();
          if (fcmToken) await setDoc(riderRef, { fcmToken }, { merge: true });
        } catch (e) {
          /* already logged inside helper */
        }
      } catch (fireErr) {
        console.warn('Failed writing rider doc:', fireErr.message || fireErr);
      }
      router.push('/dashboard');
    } catch (e) {
      alert(e.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // attempt to register/update FCM token for existing rider
      try {
        const a = auth;
        const u = a.currentUser;
        if (u) {
          const riderRef = doc(db, 'riders', u.uid);
          try {
            const fcmToken = await tryGetFcmToken();
            if (fcmToken) await setDoc(riderRef, { fcmToken }, { merge: true });
          } catch (e) {
            /* helper logs errors */
          }
        }
      } catch (e) {
        console.warn('Failed to save rider token on login:', e.message || e);
      }
      router.push('/dashboard');
    } catch (e) {
      alert(e.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;

      // Ensure rider doc exists / is updated
      try {
        const riderRef = doc(db, 'riders', u.uid);
        await setDoc(riderRef, {
          uid: u.uid,
          name: u.displayName || '',
          email: u.email || '',
          createdAt: serverTimestamp(),
          available: true,
        }, { merge: true });

        // try to obtain FCM token
        try {
          const fcmToken = await tryGetFcmToken();
          if (fcmToken) await setDoc(riderRef, { fcmToken }, { merge: true });
        } catch (e) {
          /* helper logs errors */
        }
      } catch (fireErr) {
        console.warn('Failed writing rider doc after Google sign-in:', fireErr.message || fireErr);
      }

      router.push('/dashboard');
    } catch (err) {
      alert(err.message || err);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Rider Login / Register</h2>
      <div style={{ maxWidth: 420 }}>
        <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
        <input placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" style={{ width: '100%', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={login}>Login</button>
          <button onClick={register}>Register</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={signInWithGoogle} style={{ background: '#4285F4', color: 'white', padding: '8px 12px', border: 'none', borderRadius: 4 }}>Sign in with Google</button>
        </div>
      </div>
    </div>
  );
}
