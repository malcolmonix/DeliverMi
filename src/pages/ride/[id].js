import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { onAuthStateChanged } from 'firebase/auth';
import { useQuery, useMutation } from '@apollo/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { GET_RIDE_STATUS, CANCEL_RIDE, RATE_RIDE, ADJUST_RIDE_PRICE, ACCEPT_RIDER_OFFER } from '../../lib/graphql-operations';

// Dynamic import for Map to avoid SSR issues
const DeliverMiMap = dynamic(() => import('../../components/Map'), { ssr: false });

export default function RideDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [riderLocation, setRiderLocation] = useState(null);
  const [showRating, setShowRating] = useState(false);
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

  const { data, loading, error } = useQuery(GET_RIDE_STATUS, {
    variables: { id },
    skip: !id || !user,
    pollInterval: 3000,
  });

  const [cancelRide, { loading: cancelling }] = useMutation(CANCEL_RIDE);
  const [rateRide, { loading: submittingRating }] = useMutation(RATE_RIDE);
  const [adjustPrice, { loading: adjustingPrice }] = useMutation(ADJUST_RIDE_PRICE);
  const [acceptOffer, { loading: acceptingOffer }] = useMutation(ACCEPT_RIDER_OFFER);

  // Real-time rider location tracking
  useEffect(() => {
    if (!data?.ride?.rider?.id) return;

    const riderId = data.ride.rider.id;
    const unsubscribe = onSnapshot(
      doc(db, 'rider-locations', riderId),
      (snapshot) => {
        if (snapshot.exists()) {
          const locData = snapshot.data();
          if (locData.lat && locData.lng) {
            setRiderLocation({
              lat: locData.lat,
              lng: locData.lng
            });
          }
        }
      },
      (err) => {
        console.error('Error listening to rider location:', err);
      }
    );

    return () => unsubscribe();
  }, [data?.ride?.rider?.id]);

  // Fallback to GraphQL rider location
  useEffect(() => {
    if (data?.ride?.rider?.latitude && data?.ride?.rider?.longitude) {
      setRiderLocation({
        lat: data.ride.rider.latitude,
        lng: data.ride.rider.longitude
      });
    }
  }, [data?.ride?.rider]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this ride?')) return;

    try {
      await cancelRide({
        variables: { rideId: id, reason: 'Cancelled by user' }
      });
      router.push('/');
    } catch (err) {
      console.error('Error cancelling ride:', err);
      alert('Failed to cancel ride. Please try again.');
    }
  };

  const handleSubmitRating = async () => {
    try {
      await rateRide({
        variables: { rideId: id, rating, feedback: feedback || null }
      });
      setShowRating(false);
      router.push('/rides');
    } catch (err) {
      console.error('Error rating ride:', err);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleAdjustPrice = async (increment) => {
    try {
      const newAmount = ride.fare + increment;
      await adjustPrice({
        variables: { rideId: id, amount: newAmount }
      });
    } catch (err) {
      console.error('Error adjusting price:', err);
      alert('Failed to update price.');
    }
  };

  const handleAcceptOffer = async (riderId, amount) => {
    try {
      await acceptOffer({
        variables: { rideId: id, riderId, amount }
      });
    } catch (err) {
      console.error('Error accepting offer:', err);
      alert('Failed to accept offer.');
    }
  };

  if (loadingAuth || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading ride: {error.message}</p>
          <Link href="/" className="text-blue-600 font-medium">Go back home</Link>
        </div>
      </div>
    );
  }

  const ride = data?.ride;

  if (!ride) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ride not found</p>
          <Link href="/" className="text-blue-600 font-medium">Go back home</Link>
        </div>
      </div>
    );
  }

  const pickup = ride.pickupLat && ride.pickupLng ? { lat: ride.pickupLat, lng: ride.pickupLng } : null;
  const dropoff = ride.dropoffLat && ride.dropoffLng ? { lat: ride.dropoffLat, lng: ride.dropoffLng } : null;

  const getStatusMessage = () => {
    switch (ride.status) {
      case 'REQUESTED': return 'Looking for a driver...';
      case 'ACCEPTED': return 'Driver is on the way to pick you up';
      case 'PICKED_UP': return 'You\'re on your way!';
      case 'COMPLETED': return 'Ride completed';
      case 'CANCELLED': return 'Ride cancelled';
      default: return ride.status;
    }
  };

  const getStatusColor = () => {
    switch (ride.status) {
      case 'REQUESTED': return 'bg-gray-100';
      case 'ACCEPTED': return 'bg-blue-100';
      case 'PICKED_UP': return 'bg-yellow-100';
      case 'COMPLETED': return 'bg-green-100';
      case 'CANCELLED': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        <DeliverMiMap
          pickup={pickup}
          dropoff={dropoff}
          riderLocation={riderLocation}
        />
      </div>

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-4 pb-6">
          {/* Status Banner */}
          <div className={`${getStatusColor()} rounded-xl p-4 mb-4`}>
            <div className="flex items-center gap-3">
              {ride.status === 'REQUESTED' && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700"></div>
              )}
              {ride.status === 'ACCEPTED' && <span className="text-2xl">🚗</span>}
              {ride.status === 'PICKED_UP' && <span className="text-2xl">📍</span>}
              {ride.status === 'COMPLETED' && <span className="text-2xl">✓</span>}
              {ride.status === 'CANCELLED' && <span className="text-2xl">✕</span>}
              <div>
                <p className="font-semibold">{getStatusMessage()}</p>
                {ride.duration && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                  <p className="text-sm text-gray-600">ETA: {ride.duration} min</p>
                )}
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {ride.rider && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {ride.rider.photoURL ? (
                      <img src={ride.rider.photoURL} alt="Rider" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl">
                        {ride.rider.displayName?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{ride.rider.displayName || 'Your Driver'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                        {ride.rider.vehicleType || 'Rider'}
                      </span>
                      {ride.rider.licensePlate && (
                        <span className="text-[10px] text-gray-500 font-mono tracking-wider">
                          {ride.rider.licensePlate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(ride.rider.secondaryPhone || ride.rider.phoneNumber) && (
                  <a
                    href={`tel:${ride.rider.secondaryPhone || ride.rider.phoneNumber}`}
                    className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 shadow-md active:scale-95 transition-transform"
                    title="Call Rider"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Pending Offers (when status is REQUESTED) */}
          {ride.status === 'REQUESTED' && ride.offers && ride.offers.some(o => o.status === 'PENDING') && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">Rider Offers</h3>
              <div className="space-y-2">
                {ride.offers.filter(o => o.status === 'PENDING').map(offer => (
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden text-sm">
                        {offer.riderPhoto ? <img src={offer.riderPhoto} alt="" className="w-full h-full object-cover" /> : offer.riderName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{offer.riderName}</p>
                        <p className="text-lg font-black text-black">₦{offer.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptOffer(offer.riderId, offer.amount)}
                      disabled={acceptingOffer}
                      className="bg-black text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ride Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">📍</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm font-medium">{ride.pickupAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">🏁</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dropoff</p>
                <p className="text-sm font-medium">{ride.dropoffAddress}</p>
              </div>
            </div>
          </div>

          {/* Fare & Price Adjustment */}
          <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 text-sm">Offer Price</span>
              <span className="text-2xl font-black text-black">
                ₦{parseFloat(ride.fare).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {ride.status === 'REQUESTED' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAdjustPrice(50)}
                  disabled={adjustingPrice}
                  className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm hover:border-black active:scale-95 transition-all text-gray-700"
                >
                  + ₦50
                </button>
                <button
                  onClick={() => handleAdjustPrice(150)}
                  disabled={adjustingPrice}
                  className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm hover:border-black active:scale-95 transition-all text-gray-700"
                >
                  + ₦150
                </button>
                <button
                  onClick={() => handleAdjustPrice(300)}
                  disabled={adjustingPrice}
                  className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm hover:border-black active:scale-95 transition-all text-gray-700"
                >
                  + ₦300
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          {(ride.status === 'REQUESTED' || ride.status === 'ACCEPTED') && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-4 border border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Ride'}
            </button>
          )}

          {ride.status === 'COMPLETED' && !showRating && !ride.rating && (
            <button
              onClick={() => setShowRating(true)}
              className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Rate Your Ride
            </button>
          )}

          {ride.status === 'COMPLETED' && ride.rating && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">Your rating</p>
              <div className="flex justify-center gap-1 text-yellow-400 text-2xl">
                {[...Array(ride.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-center">How was your ride?</h2>

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
                onClick={() => setShowRating(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Skip
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
