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
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
    name: false,
  });

  // Real-time form validation
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          return 'Email is required';
        } else if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'password':
        if (!value.trim()) {
          return 'Password is required';
        } else if (value.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        return '';
      case 'name':
        if (isRegister && !value.trim()) {
          return 'Full name is required';
        } else if (isRegister && value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        return '';
      default:
        return '';
    }
  };

  // Handle input changes with real-time validation
  const handleInputChange = (name, value) => {
    switch (name) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'name':
        setName(value);
        break;
    }

    // Validate field if it has been touched
    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur (mark as touched and validate)
  const handleFieldBlur = (name) => {
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const value = name === 'email' ? email : name === 'password' ? password : name;
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  // Validate entire form
  const validateForm = () => {
    const errors = {
      email: validateField('email', email),
      password: validateField('password', password),
      name: validateField('name', name),
    };

    setFormErrors(errors);
    setTouchedFields({ email: true, password: true, name: true });

    return !Object.values(errors).some(error => error !== '');
  };

  // Enhanced error handling with user-friendly messages
  const handleAuthError = (error) => {
    console.error('Authentication error:', error);

    let errorMessage = 'An unexpected error occurred. Please try again.';

    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address. Please sign up first.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists. Please sign in instead.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Invalid credentials. Please check your email and password.';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
        break;
      case 'auth/unauthorized-domain':
        errorMessage = 'This domain is not authorized. Please contact support.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'This sign-in method is not enabled. Please contact support.';
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
    }

    setError(errorMessage);
  };

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google sign-in redirect successful:', result.user.email);
          // User signed in via redirect
          await saveUserDoc(result.user, result.user.displayName);
          console.log('✅ Google login successful, waiting for auth state then redirecting');

          // Wait a moment for Firebase to set the auth state
          setTimeout(() => {
            router.push('/');
          }, 500);
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
        handleAuthError(error);
      } finally {
        setLoading(false);
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

    if (!validateForm()) {
      setError('Please fix the errors below and try again.');
      return;
    }

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
      console.log('✅ Login successful, waiting for auth state then redirecting');

      // Wait a moment for Firebase to set the auth state
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (e) {
      console.error('Authentication error:', e);
      handleAuthError(e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      // Add custom parameters to avoid issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      // Use redirect instead of popup to avoid COOP issues
      await signInWithRedirect(auth, provider);
      // Note: The redirect will handle the rest, no need to call router.push here
    } catch (err) {
      console.error('Google sign-in error:', err);
      handleAuthError(err);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-x-hidden overflow-y-auto cross-browser-compatible gradient-travel">
      {/* Fallback background for browsers that don't support gradients */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: '#1E40AF' /* Fallback color */
        }}
      />
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
      >
        Skip to main content
      </a>

      {/* Enhanced animated background elements with cross-browser support */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Dynamic gradient overlay with fallback */}
        <div
          className="absolute inset-0 gradient-travel"
          style={{
            /* Fallback for older browsers */
            backgroundColor: 'rgba(30, 64, 175, 0.9)'
          }}
        ></div>

        {/* Moving road/travel lines with enhanced animation */}
        <div className="absolute top-20 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-40 animate-pulse"></div>
        <div className="absolute top-24 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-36 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

        {/* Enhanced floating decorative elements */}
        <div className="absolute top-32 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400/25 to-purple-400/15 blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-blue-300/20 to-cyan-400/15 blur-2xl animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-1/3 left-10 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-300/25 to-blue-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }}></div>

        {/* Enhanced travel-themed icons with dynamic effects */}
        <div className="absolute top-24 left-16 text-4xl opacity-25 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3.5s' }} role="img" aria-label="Car icon">🚗</div>
        <div className="absolute top-40 right-32 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '4s' }} role="img" aria-label="Map icon">🗺️</div>
        <div className="absolute bottom-48 left-1/3 text-4xl opacity-25 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '3.8s' }} role="img" aria-label="Location pin icon">📍</div>
        <div className="absolute bottom-24 right-16 text-3xl opacity-30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.2s' }} role="img" aria-label="Lightning icon">⚡</div>
        <div className="absolute top-1/2 left-1/4 text-2xl opacity-15 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4.2s' }} role="img" aria-label="Road icon">🛣️</div>
        <div className="absolute bottom-1/3 right-1/4 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.6s' }} role="img" aria-label="SUV icon">🚙</div>

        {/* Moving elements for dynamic feel */}
        <div className="absolute top-16 left-0 w-2 h-2 bg-yellow-400/40 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-0 w-3 h-3 bg-blue-300/30 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Enhanced Header with better branding */}
      <header className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300" role="img" aria-label="DeliverMi logo">
                <span className="text-3xl" role="img" aria-label="Car icon">🚗</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" role="status" aria-label="Service available"></div>
            </div>
            <div>
              <h1 className="text-white text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">DeliverMi</h1>
              <p className="text-blue-200 text-sm font-medium">Fast Pickup • Safe Rides • Fair Prices</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
            <span className="text-white text-sm font-medium">Available Now</span>
          </div>
        </div>

        {/* Visual separation line */}
        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true"></div>
      </header>

      {/* Main Content with Responsive Layout */}
      <main className="flex-1 w-full flex flex-col items-center justify-center py-4 lg:py-12 relative z-10" id="main-content">
        {/* Responsive Container */}
        <div className="w-full px-4 sm:px-6 md:px-8">
          <div className="w-full mx-auto sm:max-w-md md:max-w-lg lg:max-w-5xl xl:max-w-6xl bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-8 xl:p-12 relative overflow-hidden shadow-2xl mb-8 lg:mb-0">
            {/* Enhanced subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15zm15 0c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="relative">
              {/* Desktop layout wrapper - switched to flex-col on mobile/tablet */}
              <div className="flex flex-col lg:grid lg:grid-cols-5 lg:gap-12 xl:gap-16 2xl:gap-20 lg:items-center min-h-[auto] lg:min-h-[600px]">

                {/* Left side - Welcome content (Desktop only) */}
                <div className="hidden lg:block lg:col-span-3">
                  <div className="space-y-6 lg:space-y-8 xl:space-y-10 pr-6 lg:pr-8 xl:pr-12">
                    <div>
                      <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 lg:mb-6 xl:mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                        Your Journey Starts Here
                      </h1>
                      <p className="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-gray-600 mb-6 lg:mb-8 xl:mb-12 leading-relaxed">
                        Join thousands who trust DeliverMi for fast, safe, and affordable rides across the city.
                      </p>
                    </div>

                    {/* Desktop feature highlights */}
                    <div className="space-y-4 lg:space-y-6 xl:space-y-8">
                      <div className="flex items-center gap-4 lg:gap-6 p-4 lg:p-6 xl:p-8 bg-blue-50 rounded-xl lg:rounded-2xl xl:rounded-3xl hover:shadow-lg transition-all duration-300 touch-target min-h-[44px]">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-blue-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
                          <span className="text-2xl lg:text-3xl xl:text-4xl">⚡</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base lg:text-lg xl:text-xl">Lightning Fast</h3>
                          <p className="text-gray-600 text-sm lg:text-base xl:text-lg">Average 2-minute pickup time</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 lg:gap-6 p-4 lg:p-6 xl:p-8 bg-green-50 rounded-xl lg:rounded-2xl xl:rounded-3xl hover:shadow-lg transition-all duration-300 touch-target min-h-[44px]">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-green-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
                          <span className="text-2xl lg:text-3xl xl:text-4xl">🛡️</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base lg:text-lg xl:text-xl">Safe & Secure</h3>
                          <p className="text-gray-600 text-sm lg:text-base xl:text-lg">Verified drivers, GPS tracking</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 lg:gap-6 p-4 lg:p-6 xl:p-8 bg-purple-50 rounded-xl lg:rounded-2xl xl:rounded-3xl hover:shadow-lg transition-all duration-300 touch-target min-h-[44px]">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 bg-purple-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
                          <span className="text-2xl lg:text-3xl xl:text-4xl">💰</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base lg:text-lg xl:text-xl">Fair Pricing</h3>
                          <p className="text-gray-600 text-sm lg:text-base xl:text-lg">No surge pricing, transparent costs</p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop stats */}
                    <div className="grid grid-cols-3 gap-4 lg:gap-6 xl:gap-8 pt-6 lg:pt-8 xl:pt-12 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-600">50K+</div>
                        <div className="text-xs lg:text-sm xl:text-base text-gray-600">Happy Riders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-green-600">4.8★</div>
                        <div className="text-xs lg:text-sm xl:text-base text-gray-600">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl lg:text-4xl xl:text-5xl font-bold text-purple-600">24/7</div>
                        <div className="text-xs lg:text-sm xl:text-base text-gray-600">Available</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Login form with responsive sizing */}
                <div className="lg:col-span-2">
                  <div className="lg:max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">
                    <div className="text-center mb-4 sm:mb-8 md:mb-10 lg:text-left">
                      {/* Badge - Hidden on mobile to save space */}
                      <div className="hidden sm:inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 px-4 sm:px-5 md:px-6 py-2 sm:py-3 rounded-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-blue-100" role="status" aria-label="Service status: Ready to ride, available 24/7">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Ready to ride</span>
                        </div>
                        <div className="w-px h-3 sm:h-4 bg-gray-300" aria-hidden="true"></div>
                        <span className="text-xs font-medium text-gray-500">Available 24/7</span>
                      </div>

                      <h2 className="text-xl sm:text-3xl lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-4 lg:mb-4 xl:mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent leading-tight lg:hidden">
                        {isRegister ? 'Start Journey' : 'Welcome Back!'}
                      </h2>

                      {/* Desktop heading - Compacted */}
                      <h2 className="hidden lg:block text-xl xl:text-2xl font-bold mb-3 xl:mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                        {isRegister ? 'Create Account' : 'Sign In'}
                      </h2>

                      <p className="hidden sm:block text-gray-600 mb-4 sm:mb-6 text-sm lg:text-base font-medium lg:hidden">
                        {isRegister
                          ? 'Join thousands who trust us for their daily rides 🚀'
                          : 'Ready for your next adventure? Let\'s get moving! 🌟'}
                      </p>

                      {/* Mobile trust indicators - Hidden on mobile to save space */}
                      <div className="hidden sm:flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:hidden" role="list" aria-label="DeliverMi key features">
                        <div className="flex items-center gap-1 sm:gap-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-full" role="listitem">
                          <span className="text-blue-600" role="img" aria-label="Lightning icon">⚡</span>
                          <span className="text-xs sm:text-sm font-medium text-blue-700">2-min pickup</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-green-50 px-3 sm:px-4 py-2 rounded-full" role="listitem">
                          <span className="text-green-600" role="img" aria-label="Shield icon">🛡️</span>
                          <span className="text-xs sm:text-sm font-medium text-green-700">Safe & secure</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-purple-50 px-3 sm:px-4 py-2 rounded-full" role="listitem">
                          <span className="text-purple-600" role="img" aria-label="Money icon">💰</span>
                          <span className="text-xs sm:text-sm font-medium text-purple-700">Fair pricing</span>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8" role="form" aria-labelledby="login-form-heading">
                      <h3 id="login-form-heading" className="sr-only">{isRegister ? 'Create DeliverMi Account' : 'Sign In to DeliverMi'}</h3>

                      {isRegister && (
                        <div className="relative">
                          <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <input
                              id="name"
                              type="text"
                              value={name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              onBlur={() => handleFieldBlur('name')}
                              placeholder="John Doe"
                              required={isRegister}
                              className={`w-full h-10 sm:h-11 pl-9 sm:pl-10 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base bg-gray-50/50 focus:bg-white ${formErrors.name && touchedFields.name
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                              aria-describedby="name-description name-error"
                              aria-invalid={formErrors.name && touchedFields.name ? 'true' : 'false'}
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                              <span className="text-sm sm:text-base" role="img" aria-label="Person icon">👤</span>
                            </div>
                          </div>
                          {formErrors.name && touchedFields.name && (
                            <div id="name-error" className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
                              <span aria-hidden="true">⚠️</span>
                              {formErrors.name}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative">
                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onBlur={() => handleFieldBlur('email')}
                            placeholder="your@email.com"
                            required
                            className={`w-full h-10 sm:h-11 pl-9 sm:pl-10 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base bg-gray-50/50 focus:bg-white ${formErrors.email && touchedFields.email
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                              }`}
                            aria-describedby="email-description email-error"
                            aria-invalid={formErrors.email && touchedFields.email ? 'true' : 'false'}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                            <span className="text-sm sm:text-base" role="img" aria-label="Email icon">📧</span>
                          </div>
                        </div>
                        {formErrors.email && touchedFields.email && (
                          <div id="email-error" className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
                            <span aria-hidden="true">⚠️</span>
                            {formErrors.email}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            onBlur={() => handleFieldBlur('password')}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className={`w-full h-10 sm:h-11 pl-9 sm:pl-10 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base bg-gray-50/50 focus:bg-white ${formErrors.password && touchedFields.password
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                              }`}
                            aria-describedby="password-description password-error"
                            aria-invalid={formErrors.password && touchedFields.password ? 'true' : 'false'}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                            <span className="text-sm sm:text-base" role="img" aria-label="Lock icon">🔒</span>
                          </div>
                        </div>
                        <div id="password-description" className="sr-only">
                          {isRegister ? 'Create a password with at least 6 characters' : 'Enter your account password'}
                        </div>
                        {formErrors.password && touchedFields.password && (
                          <div id="password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <span aria-hidden="true">⚠️</span>
                            {formErrors.password}
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 opacity-50"></div>
                          <div className="relative flex items-center gap-2 sm:gap-3">
                            <span className="text-red-500 text-base sm:text-lg">⚠️</span>
                            <p className="text-xs sm:text-sm text-red-800 font-medium">{error}</p>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 sm:h-14 md:h-16 lg:h-14 xl:h-16 py-3 sm:py-4 xl:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg xl:text-xl disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group touch-target min-h-[44px]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        {loading ? (
                          <span className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                            <span className="hidden sm:inline">{isRegister ? 'Creating your account...' : 'Signing you in...'}</span>
                            <span className="sm:hidden">{isRegister ? 'Creating...' : 'Signing in...'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                            {isRegister ? (
                              <>
                                <span className="text-base sm:text-lg md:text-xl">🚀</span>
                                <span className="hidden sm:inline">Create Account & Start Riding</span>
                                <span className="sm:hidden">Create & Start</span>
                              </>
                            ) : (
                              <>
                                <span className="text-base sm:text-lg md:text-xl">🎯</span>
                                <span className="hidden sm:inline">Sign In & Get Moving</span>
                                <span className="sm:hidden">Sign In</span>
                              </>
                            )}
                          </span>
                        )}
                      </button>
                    </form>

                    <div className="my-6 sm:my-8 flex items-center gap-3 sm:gap-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      <span className="text-gray-500 text-xs sm:text-sm font-semibold px-3 sm:px-4 bg-gray-50 rounded-full py-1">or continue with</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>

                    <button
                      onClick={signInWithGoogle}
                      disabled={loading}
                      className="w-full h-12 sm:h-14 md:h-16 lg:h-14 xl:h-16 py-3 sm:py-4 xl:py-5 border-2 border-gray-200 rounded-xl sm:rounded-2xl font-semibold flex items-center justify-center gap-2 sm:gap-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base md:text-lg xl:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] bg-white relative overflow-hidden group touch-target min-h-[44px]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10" viewBox="0 0 24 24">
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
                      <span className="relative z-10 hidden sm:inline">Continue with Google</span>
                      <span className="relative z-10 sm:hidden">Google</span>
                    </button>

                    {/* Mobile features showcase with responsive grid */}
                    <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-6 lg:hidden">
                      <div className="text-center">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Why choose DeliverMi?</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105 touch-target min-h-[44px]">
                          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
                          <div className="text-sm font-bold text-gray-800 mb-1">Fast Pickup</div>
                          <div className="text-xs text-gray-600">Average 2-min wait time</div>
                        </div>
                        <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105 touch-target min-h-[44px]">
                          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🛡️</div>
                          <div className="text-sm font-bold text-gray-800 mb-1">Safe Rides</div>
                          <div className="text-xs text-gray-600">Verified drivers & GPS tracking</div>
                        </div>
                        <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl border border-purple-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105 touch-target min-h-[44px]">
                          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💰</div>
                          <div className="text-sm font-bold text-gray-800 mb-1">Fair Prices</div>
                          <div className="text-xs text-gray-600">No surge pricing, transparent costs</div>
                        </div>
                      </div>

                      {/* Additional journey benefits with responsive layout */}
                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">🌍</span>
                            <span className="font-medium text-gray-700">City-wide coverage</span>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">📱</span>
                            <span className="font-medium text-gray-700">Real-time tracking</span>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600">⭐</span>
                            <span className="font-medium text-gray-700">4.8★ rating</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                      <p className="text-sm sm:text-base text-gray-600">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                          onClick={() => {
                            setIsRegister(!isRegister);
                            setError(null);
                          }}
                          className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors duration-200 ml-1 touch-target min-h-[44px] px-2 py-1 rounded"
                        >
                          {isRegister ? 'Sign In' : 'Sign Up'}
                        </button>
                      </p>

                      <div className="mt-3 sm:mt-4 text-xs text-gray-500">
                        By continuing, you agree to our{' '}
                        <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span>
                        {' '}and{' '}
                        <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}