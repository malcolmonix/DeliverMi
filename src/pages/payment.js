import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function PaymentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);

  // Demo payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'cash', type: 'cash', label: 'Cash', icon: '💵', isDefault: true },
  ]);

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

  const handleSetDefault = (id) => {
    setPaymentMethods(prev => prev.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })));
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCard = {
      id: `card_${Date.now()}`,
      type: 'card',
      label: `•••• ${formData.get('number').slice(-4)}`,
      icon: '💳',
      isDefault: false
    };
    setPaymentMethods(prev => [...prev, newCard]);
    setShowAddCard(false);
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
            <h1 className="text-xl font-bold">Payment Methods</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Payment Methods List */}
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-medium">{method.label}</p>
                  {method.isDefault && (
                    <span className="text-xs text-green-600 font-medium">Default</span>
                  )}
                </div>
              </div>
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="text-sm text-blue-600 font-medium"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Payment Method Button */}
        <button
          onClick={() => setShowAddCard(true)}
          className="w-full bg-white rounded-xl p-4 shadow-sm border border-dashed border-gray-300 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add payment method
        </button>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Payment Info</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Cash payments are accepted for all rides</li>
            <li>• Card payments are processed securely</li>
            <li>• Receipts are sent to your email after each ride</li>
          </ul>
        </div>
      </main>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Card</h2>
              <button
                onClick={() => setShowAddCard(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  name="number"
                  placeholder="1234 5678 9012 3456"
                  required
                  maxLength={19}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    name="expiry"
                    placeholder="MM/YY"
                    required
                    maxLength={5}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    placeholder="123"
                    required
                    maxLength={4}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Add Card
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
