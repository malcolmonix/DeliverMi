import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'react-hot-toast';
import ChatModal from './ChatModal';
import { ACCEPT_RIDER_OFFER, ADJUST_RIDE_PRICE } from '../lib/graphql-operations'; export const GET_MESSAGES = gql`
  query GetMessages($rideId: ID!) {
    messages(rideId: $rideId) {
      id
      senderId
      text
      createdAt
    }
  }
`;

export default function ActiveRideView({
  ride,
  riderLocation,
  onCancel,
  onBookAnotherRide,
  showRating,
  onRateRider,
  user,
  onRideUpdated
}) {

  if (!ride) return null;

  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdjustPrice, setShowAdjustPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [adjustingPrice, setAdjustingPrice] = useState(false);
  const audioRef = useRef(null);
  const lastMsgCountRef = useRef(0);
  const lastOffersCountRef = useRef(0);

  // Mutations for accepting offers and adjusting price
  const [acceptOffer, { loading: acceptingOffer }] = useMutation(ACCEPT_RIDER_OFFER);
  const [adjustPrice, { loading: adjusting }] = useMutation(ADJUST_RIDE_PRICE);

  // Poll for messages globally for this ride
  const { data: messagesData } = useQuery(GET_MESSAGES, {
    variables: { rideId: ride.id || ride.rideId },
    pollInterval: 2000,
    skip: !ride.id && !ride.rideId,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const msgs = data?.messages || [];
      const count = msgs.length;
      const storageKey = `seen_msg_count_${ride.id || ride.rideId}`;

      // Get last seen count from storage
      const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0', 10);

      // If chat is open, update storage immediately
      if (showChat) {
        localStorage.setItem(storageKey, count.toString());
        setUnreadCount(0);
        return;
      }

      // Calculate unread
      const unread = count - lastSeenCount;

      if (unread > 0) {
        // Check if the latest message is ours
        const latestMsg = msgs[msgs.length - 1];
        const isMyMessage = latestMsg?.senderId === user?.uid;

        if (!isMyMessage) {
          setUnreadCount(unread);

          // Only play sound if the count CHANGED (new arrival)
          if (count > lastMsgCountRef.current) {
            playNotificationSound();

            // Show toast notification with message preview
            toast(
              <div className="flex items-start gap-3">
                <div className="text-2xl">💬</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">New message from driver</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{latestMsg?.text || 'New message'}</p>
                </div>
              </div>,
              {
                duration: 4000,
                position: 'top-center',
                style: {
                  background: '#fff',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                },
              }
            );
          }
        } else {
          // If it's my message, mark as seen implicitly
          localStorage.setItem(storageKey, count.toString());
          setUnreadCount(0);
        }
      } else {
        setUnreadCount(0);
      }

      lastMsgCountRef.current = count;
    }
  });

  // Monitor counter offers for real-time notifications
  useEffect(() => {
    if (!ride?.offers || ride.status !== 'REQUESTED') return;

    // Get unique offers per rider (latest only)
    const pendingOffers = ride.offers.filter(o => o.status === 'PENDING');
    const latestOffersByRider = {};
    pendingOffers.forEach(offer => {
      if (!latestOffersByRider[offer.riderId] || 
          new Date(offer.createdAt) > new Date(latestOffersByRider[offer.riderId].createdAt)) {
        latestOffersByRider[offer.riderId] = offer;
      }
    });
    const uniqueOffers = Object.values(latestOffersByRider);
    const currentCount = uniqueOffers.length;

    // Show notification when new offer arrives
    if (currentCount > lastOffersCountRef.current && lastOffersCountRef.current > 0) {
      // Get the most recent offer
      const sortedOffers = uniqueOffers.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      const newOffer = sortedOffers[0];
      toast(
        <div className="flex items-start gap-3">
          <div className="text-2xl">💰</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">New Counter Offer!</p>
            <p className="text-sm text-gray-600">
              {newOffer.riderName || 'A rider'} offered ₦{newOffer.amount?.toLocaleString('en-NG')}
            </p>
          </div>
        </div>,
        {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#fff',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          },
        }
      );
    }

    lastOffersCountRef.current = currentCount;
  }, [ride?.offers, ride?.status]);

  // Reset unread count when chat opens
  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
      const msgs = messagesData?.messages || [];
      const storageKey = `seen_msg_count_${ride.id || ride.rideId}`;
      localStorage.setItem(storageKey, msgs.length.toString());
    }
  }, [showChat, messagesData]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        // Simple distinct "ping" sound (Data URI)
        audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); // Placeholder, will replace with real base64
        audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Professional notification sound
      }
      audioRef.current.play().catch(e => console.warn('Audio play failed (interaction needed):', e));
    } catch (e) {
      console.error('Sound error:', e);
    }
  };

  // Handle accepting a counter offer
  const handleAcceptOffer = async (riderId, amount) => {
    try {
      const result = await acceptOffer({
        variables: {
          rideId: ride.id || ride.rideId,
          riderId,
          amount
        }
      });

      if (result.data?.acceptRiderOffer) {
        toast.success('Offer accepted! Your driver is on the way.', {
          icon: '✅',
          duration: 4000
        });
        if (onRideUpdated) {
          onRideUpdated(result.data.acceptRiderOffer);
        }
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error(error.message || 'Failed to accept offer. Please try again.', {
        icon: '❌'
      });
    }
  };

  // Handle adjusting ride price
  const handleAdjustPrice = async () => {
    const price = parseFloat(newPrice);
    if (!price || price <= 0) {
      toast.error('Please enter a valid price', { icon: '❌' });
      return;
    }

    setAdjustingPrice(true);
    try {
      const result = await adjustPrice({
        variables: {
          rideId: ride.id || ride.rideId,
          amount: price
        }
      });

      if (result.data?.adjustRidePrice) {
        toast.success(`Ride price updated to ₦${price.toLocaleString('en-NG')}`, {
          icon: '✅',
          duration: 4000
        });
        setShowAdjustPrice(false);
        setNewPrice('');
        if (onRideUpdated) {
          onRideUpdated(result.data.adjustRidePrice);
        }
      }
    } catch (error) {
      console.error('Error adjusting price:', error);
      toast.error(error.message || 'Failed to adjust price. Please try again.', {
        icon: '❌'
      });
    } finally {
      setAdjustingPrice(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'REQUESTED':
        return {
          color: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: '🏍️',
          message: 'Finding a driver nearby...',
          description: 'This usually takes a few moments'
        };
      case 'ACCEPTED':
        return {
          color: 'green',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '🏍️',
          message: 'Driver is on the way to pickup!',
          description: 'Your driver is heading to your location'
        };
      case 'ARRIVED_AT_PICKUP':
        return {
          color: 'orange',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: '📍',
          message: 'Driver has arrived at pickup!',
          description: 'Come out and meet your driver'
        };
      case 'PICKED_UP':
        return {
          color: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: '🏍️',
          message: 'On the way to dropoff',
          description: 'Heading to the dropoff location'
        };
      case 'ARRIVED_AT_DROPOFF':
        return {
          color: 'purple',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          icon: '🏍️',
          message: 'Arrived at destination!',
          description: 'You have reached your destination'
        };
      case 'COMPLETED':
        return {
          color: 'green',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '🎉',
          message: 'Ride completed!',
          description: 'Thank you for riding with us'
        };
      default:
        return {
          color: 'gray',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: '⏳',
          message: 'Processing...',
          description: ''
        };
    }
  };

  const statusInfo = getStatusInfo(ride.status);
  const hasRider = ride.rider || ride.riderId;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Status Header */}
      <div className={`${statusInfo.bg} ${statusInfo.border} border-2 rounded-2xl p-4`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{statusInfo.icon}</span>
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${statusInfo.text}`}>
              {statusInfo.message}
            </h2>
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">Ride ID</span>
          <span className="font-mono font-bold text-gray-800">#{ride.rideId}</span>
        </div>
      </div>

      {/* Driver Info */}
      {hasRider && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {ride.rider?.displayName?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">
                {ride.rider?.displayName || 'Driver'}
              </h3>
              {ride.rider?.phoneNumber && (
                <p className="text-sm text-gray-600">📞 {ride.rider.phoneNumber}</p>
              )}
              {riderLocation && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  📍 Live location tracking active
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowChat(true)}
                className="relative bg-blue-100 text-blue-600 p-3 rounded-full hover:bg-blue-200 transition-colors shadow-md flex items-center justify-center transform hover:scale-105 active:scale-95"
                title="Chat with driver"
              >
                💬
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {ride.rider?.phoneNumber && (
                <a
                  href={`tel:${ride.rider.phoneNumber}`}
                  className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors shadow-md flex items-center justify-center transform hover:scale-105 active:scale-95"
                  title="Call driver"
                >
                  📞
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Route Info */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-800 mb-3">Route Details</h3>

        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📍</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Pickup</p>
            <p className="text-sm text-gray-800 font-medium">{ride.pickupAddress}</p>
          </div>
        </div>

        {/* Dotted line */}
        <div className="ml-4 border-l-2 border-dotted border-gray-300 h-6"></div>

        {/* Dropoff */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🏁</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase">Dropoff</p>
            <p className="text-sm text-gray-800 font-medium">{ride.dropoffAddress}</p>
          </div>
        </div>
      </div>

      {/* Trip Summary - Uber/Bolt Style */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
        {/* Centralized Fare with KM and Min on sides */}
        <div className="flex items-end justify-center gap-6 mb-4">
          {/* Distance - Left */}
          {ride.distance && (
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-blue-600">
                {(ride.distance / 1000).toFixed(1)}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase">km</p>
            </div>
          )}

          {/* Fare - Center (Prominent) */}
          <div className="flex flex-col items-center">
            <p className="text-3xl font-bold text-green-600">
              ₦{ride.fare?.toLocaleString('en-NG') || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 font-medium">Total Fare</p>
          </div>

          {/* Duration - Right */}
          {ride.duration && (
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold text-purple-600">
                {Math.round(ride.duration / 60)}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase">min</p>
            </div>
          )}
        </div>

        {ride.status === 'COMPLETED' && (
          <div className="pt-4 border-t border-blue-200">
            <p className="text-center text-sm font-medium text-gray-700">
              🎉 Thank you for using DeliverMi!
            </p>
          </div>
        )}
      </div>

      {ride.status === 'COMPLETED' && (
        <div className="space-y-3">
          {showRating && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="font-semibold text-gray-800 mb-2">Rate Your Ride</p>
              <button
                onClick={onRateRider}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors shadow-md"
              >
                Rate Your Rider
              </button>
            </div>
          )}
          <button
            onClick={onBookAnotherRide}
            className="w-full bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg"
          >
            Book Another Ride
          </button>
        </div>
      )}
      {/* Counter Offers Section - Only show when ride is REQUESTED */}
      {ride.status === 'REQUESTED' && ride.offers && ride.offers.length > 0 && (() => {
        // Filter to show only the latest offer per rider (most recent PENDING offer)
        const pendingOffers = ride.offers.filter(o => o.status === 'PENDING');
        // Group by riderId and get the latest offer for each rider
        const latestOffersByRider = {};
        pendingOffers.forEach(offer => {
          if (!latestOffersByRider[offer.riderId] || 
              new Date(offer.createdAt) > new Date(latestOffersByRider[offer.riderId].createdAt)) {
            latestOffersByRider[offer.riderId] = offer;
          }
        });
        const uniqueOffers = Object.values(latestOffersByRider);

        return uniqueOffers.length > 0 ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">💰</span>
                Counter Offers ({uniqueOffers.length})
              </h3>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uniqueOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white border-2 border-yellow-300 rounded-xl p-3 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                      {offer.riderPhoto ? (
                        <img src={offer.riderPhoto} alt={offer.riderName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        offer.riderName?.charAt(0)?.toUpperCase() || '👤'
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{offer.riderName || 'Rider'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(offer.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ₦{offer.amount?.toLocaleString('en-NG')}
                      </p>
                      {offer.amount < ride.fare && (
                        <p className="text-xs text-green-600 font-medium">Lower than original</p>
                      )}
                      {offer.amount > ride.fare && (
                        <p className="text-xs text-orange-600 font-medium">Higher than original</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptOffer(offer.riderId, offer.amount)}
                    disabled={acceptingOffer}
                    className="ml-3 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {acceptingOffer ? 'Accepting...' : 'Accept'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Adjust Price Section - Only show when ride is REQUESTED */}
      {ride.status === 'REQUESTED' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
          {!showAdjustPrice ? (
            <button
              onClick={() => {
                setShowAdjustPrice(true);
                setNewPrice(ride.fare?.toString() || '');
              }}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span>💵</span>
              Adjust Ride Price
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Current Price: ₦{ride.fare?.toLocaleString('en-NG')}</h3>
                <button
                  onClick={() => {
                    setShowAdjustPrice(false);
                    setNewPrice('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">₦</span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Enter new price"
                  className="w-full pl-10 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
                  min="0"
                  step="0.01"
                />
              </div>
              {/* +/- 500 increment buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const current = parseFloat(newPrice) || ride.fare || 0;
                    setNewPrice(Math.max(0, current - 500).toString());
                  }}
                  className="flex-1 bg-red-100 text-red-700 py-2.5 rounded-lg font-bold border-2 border-red-300 hover:bg-red-200 active:scale-95 transition-all"
                >
                  -₦500
                </button>
                <button
                  onClick={() => {
                    const current = parseFloat(newPrice) || ride.fare || 0;
                    setNewPrice((current + 500).toString());
                  }}
                  className="flex-1 bg-green-100 text-green-700 py-2.5 rounded-lg font-bold border-2 border-green-300 hover:bg-green-200 active:scale-95 transition-all"
                >
                  +₦500
                </button>
              </div>
              <button
                onClick={handleAdjustPrice}
                disabled={adjustingPrice || !newPrice}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {adjustingPrice ? 'Updating...' : 'Update Price'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Only allow cancellation when ride is REQUESTED (before any rider accepts) */}
      {ride.status === 'REQUESTED' && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="w-full text-red-600 font-medium py-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            Cancel Ride
          </button>
        </div>
      )}

      {showChat && (
        <ChatModal
          rideId={ride.id || ride.rideId}
          currentUserId={user?.uid || ride.userId}
          otherUserName={ride.rider?.displayName || 'Driver'}
          otherUserPhone={ride.rider?.secondaryPhone || ride.rider?.phoneNumber}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
