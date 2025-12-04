import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function HelpPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I book a ride?',
      answer: 'Open the app and enter your pickup and dropoff locations. Choose your preferred vehicle type, review the fare, and tap "Request Ride" to book.'
    },
    {
      id: 2,
      question: 'How do I cancel a ride?',
      answer: 'You can cancel a ride before the driver arrives by tapping the "Cancel Ride" button on the ride tracking screen. Note that cancellation fees may apply in some cases.'
    },
    {
      id: 3,
      question: 'What payment methods are accepted?',
      answer: 'We accept cash payments and all major credit/debit cards. You can add and manage payment methods in the Payment section of the app.'
    },
    {
      id: 4,
      question: 'How do I contact my driver?',
      answer: 'Once a driver is assigned to your ride, you can call them directly using the phone button on the ride tracking screen.'
    },
    {
      id: 5,
      question: 'What if I left something in the car?',
      answer: 'Go to "My Rides", find the completed trip, and use the contact option to reach your driver. You can also report lost items through the Help section.'
    },
    {
      id: 6,
      question: 'How is the fare calculated?',
      answer: 'Fares are calculated based on distance, estimated time, and the vehicle type selected. The final fare is shown before you confirm your ride.'
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
            <h1 className="text-xl font-bold">Help</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <Link 
            href="/rides"
            className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <span className="text-3xl block mb-2">🚗</span>
            <span className="font-medium">My Rides</span>
          </Link>
          <a 
            href="mailto:support@delivermi.com"
            className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <span className="text-3xl block mb-2">📧</span>
            <span className="font-medium">Email Support</span>
          </a>
        </section>

        {/* FAQs */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <h2 className="text-lg font-semibold p-4 border-b border-gray-100">Frequently Asked Questions</h2>
          
          <div>
            {faqs.map((faq) => (
              <div key={faq.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-blue-50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Still need help?</h2>
          <p className="text-blue-800 mb-4">Our support team is available 24/7 to assist you.</p>
          <a 
            href="tel:+1234567890"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Call Support
          </a>
        </section>
      </main>
    </div>
  );
}
