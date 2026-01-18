import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

// Generate a referral code from user info (not exposing UID)
function generateReferralCode(identifier) {
  if (!identifier) return 'SHARE10';
  // Create a simple hash-like code from the first letters and a number
  const prefix = identifier.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
  const suffix = Math.abs(identifier.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 1000);
  return `${prefix}${suffix}`;
}

export default function PromotionsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [message, setMessage] = useState(null);

  // Demo promotions
  const promotions = [
    {
      id: 1,
      title: 'First Ride Free',
      description: 'Get your first ride up to ₦1,500 free!',
      code: 'FIRSTRIDE',
      discount: '₦1,500 off',
      expiry: 'Valid for new users',
      active: true,
    },
    {
      id: 2,
      title: '20% Off Weekends',
      description: 'Enjoy 20% off all weekend rides',
      code: 'WEEKEND20',
      discount: '20% off',
      expiry: 'Valid Sat-Sun',
      active: true,
    },
    {
      id: 3,
      title: 'Refer a Friend',
      description: 'Get ₦1,000 credit for each friend who joins',
      code: 'REFER10',
      discount: '₦1,000 credit',
      expiry: 'No expiry',
      active: true,
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (!currentUser) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleApplyCode = () => {
    if (!promoCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    const promo = promotions.find(p => p.code.toLowerCase() === promoCode.toLowerCase());
    if (promo) {
      setMessage({ type: 'success', text: `Code "${promo.code}" applied! ${promo.discount}` });
      setPromoCode('');
    } else {
      setMessage({ type: 'error', text: 'Invalid promo code. Please try again.' });
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Promotions</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Add Promo Code Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Have a promo code?</h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black uppercase"
            />
            <button
              onClick={handleApplyCode}
              className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Apply
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
              {message.text}
            </div>
          )}
        </section>

        {/* Available Promotions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Available Promotions</h2>

          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{promo.title}</h3>
                    <p className="text-gray-600 text-sm">{promo.description}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {promo.discount}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-gray-500">Promo Code</p>
                    <p className="font-mono font-bold">{promo.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(promo.code);
                      setMessage({ type: 'success', text: 'Code copied to clipboard!' });
                    }}
                    className="text-blue-600 text-sm font-medium hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-3">{promo.expiry}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Referral Section */}
        <section className="mt-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Invite Friends, Get ₦1,000</h2>
          <p className="text-white/80 mb-4">
            Share your referral code and get ₦1,000 credit for each friend who takes their first ride.
          </p>
          <div className="bg-white/20 rounded-xl p-4 mb-4">
            <p className="text-xs text-white/70 mb-1">Your referral code</p>
            <p className="font-mono font-bold text-xl tracking-wider">{generateReferralCode(user.displayName || user.email)}</p>
          </div>
          <button
            onClick={() => {
              const code = generateReferralCode(user.displayName || user.email);
              navigator.share?.({
                title: 'Get ₦1,000 off your first DeliverMi ride!',
                text: `Use my code ${code} to get ₦1,000 off your first ride on DeliverMi!`,
                url: 'https://delivermi.app',
              }).catch(() => {
                navigator.clipboard?.writeText(code);
                setMessage({ type: 'success', text: 'Code copied!' });
              });
            }}
            className="w-full py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            Share Your Code
          </button>
        </section>
      </main>
    </div>
  );
}
