import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { useQuery, useMutation } from '@apollo/client';
import { auth } from '../lib/firebase';
import { GET_MY_RIDES, RATE_RIDE } from '../lib/graphql-operations';

export default function RidesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [ratingRide, setRatingRide] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

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

  const { data, loading, error, refetch } = useQuery(GET_MY_RIDES, {
    skip: !user,
  });

  const [rateRide, { loading: submittingRating }] = useMutation(RATE_RIDE);

  const handleSubmitRating = async () => {
    if (!ratingRide) return;

    try {
      await rateRide({
        variables: {
          rideId: ratingRide.id,
          rating,
          feedback: feedback || null
        }
      });
      setRatingRide(null);
      setRating(5);
      setFeedback('');
      refetch();
    } catch (err) {
      console.error('Error rating ride:', err);
      alert('Failed to submit rating. Please try again.');
    }
  };

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) return null;

  const rides = data?.myRides || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'ACCEPTED': return '🚗';
      case 'PICKED_UP': return '📍';
      case 'CANCELLED': return '✕';
      default: return '⏳';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-none bg-white shadow-sm z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">My Rides</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">Error loading rides: {error.message}</p>
            </div>
          )}

          {rides.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚗</div>
              <h2 className="text-xl font-semibold mb-2">No rides yet</h2>
              <p className="text-gray-500 mb-6">Your ride history will appear here</p>
              <Link
                href="/"
                className="inline-block bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Book a Ride
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-400">
                          {new Date(ride.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Ride #{ride.rideId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(ride.status)}`}>
                        <span>{getStatusIcon(ride.status)}</span>
                        {ride.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 bg-black rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{ride.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{ride.dropoffAddress}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <span className="text-lg font-bold">₦{parseFloat(ride.fare).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>

                      {ride.status === 'COMPLETED' && !ride.rating && (
                        <button
                          onClick={() => setRatingRide(ride)}
                          className="text-sm text-blue-600 font-medium hover:text-blue-800"
                        >
                          Rate this ride
                        </button>
                      )}

                      {ride.rating && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(ride.rating)].map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Rating Modal */}
      {ratingRide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Rate your ride</h2>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-transform ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:scale-110`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-24 focus:outline-none focus:border-black"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRatingRide(null);
                  setRating(5);
                  setFeedback('');
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating}
                className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submittingRating ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
