import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/router';

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
          await saveUserDoc(result.user, result.user.displayName);
          router.push('/');
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
        setError(error.message || 'Failed to sign in with Google');
      }
    };

    handleRedirectResult();
  }, [router]);

  const saveUserDoc = async (user, displayName) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: displayName || user.displayName || '',
        email: user.email || '',
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      // try to obtain FCM token
      try {
        const fcmToken = await tryGetFcmToken();
        if (fcmToken) await setDoc(userRef, { fcmToken }, { merge: true });
      } catch (e) {
        /* helper logs errors */
      }
    } catch (fireErr) {
      console.warn('Failed writing user doc:', fireErr.message || fireErr);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        await saveUserDoc(userCred.user, name);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        const user = auth.currentUser;
        if (user) await saveUserDoc(user, user.displayName);
      }
      router.push('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // Use redirect instead of popup to avoid COOP issues
      await signInWithRedirect(auth, provider);
      // Note: The redirect will handle the rest, no need to call router.push here
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Moving car/road elements */}
        <div className="absolute top-20 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute bottom-40 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20 animate-pulse delay-1000"></div>
        
        {/* Floating elements */}
        <div className="absolute top-32 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl animate-pulse delay-500"></div>
        
        {/* Travel-themed icons */}
        <div className="absolute top-24 left-16 text-3xl opacity-20 animate-bounce delay-0">🚗</div>
        <div className="absolute top-40 right-32 text-2xl opacity-20 animate-bounce delay-700">🗺️</div>
        <div className="absolute bottom-48 left-1/3 text-3xl opacity-20 animate-bounce delay-300">📍</div>
        <div className="absolute bottom-24 right-16 text-2xl opacity-20 animate-bounce delay-1000">⚡</div>
      </div>

      {/* Header */}
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🚗</span>
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">DeliverMi</h1>
            <p className="text-blue-200 text-sm">Your ride, your way</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-end relative z-10">
        <div className="bg-white rounded-t-3xl p-6 min-h-[75vh] relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-gray-600">Ready to ride</span>
              </div>
              
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {isRegister ? 'Start Your Journey' : 'Welcome Back, Traveler!'}
              </h2>
              <p className="text-gray-500 mb-6 text-lg">
                {isRegister 
                  ? 'Create your account and get moving 🚀' 
                  : 'Ready for your next adventure? 🌟'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required={isRegister}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-base"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-base"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    {isRegister ? 'Creating your account...' : 'Signing you in...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isRegister ? (
                      <>
                        <span>🚀</span>
                        <span>Create Account & Start Riding</span>
                      </>
                    ) : (
                      <>
                        <span>🎯</span>
                        <span>Sign In & Get Moving</span>
                      </>
                    )}
                  </span>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="text-gray-400 text-sm font-medium px-3">or continue with</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full py-4 border-2 border-gray-200 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 disabled:opacity-50 text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Features showcase */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-xs font-semibold text-gray-700">Fast Pickup</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-2xl">
                <div className="text-3xl mb-2">🛡️</div>
                <div className="text-xs font-semibold text-gray-700">Safe Rides</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-2xl">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-xs font-semibold text-gray-700">Fair Prices</div>
              </div>
            </div>

            <p className="text-center mt-8 text-gray-600">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
