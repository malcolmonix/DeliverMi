export default function ActiveRideView({ 
  ride, 
  riderLocation, 
  onCancel, 
  onBookAnotherRide,
  showRating,
  onRateRider 
}) {
  if (!ride) return null;

  const getStatusInfo = (status) => {
    switch (status) {
      case 'REQUESTED':
        return {
          color: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: '🔍',
          message: 'Finding a driver nearby...',
          description: 'This usually takes a few moments'
        };
      case 'ACCEPTED':
        return {
          color: 'green',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '✅',
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
          icon: '🚗',
          message: 'On the way to destination',
          description: 'Enjoy your ride!'
        };
      case 'ARRIVED_AT_DROPOFF':
        return {
          color: 'purple',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          icon: '🏁',
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
            {ride.rider?.phoneNumber && (
              <a
                href={`tel:${ride.rider.phoneNumber}`}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors shadow-md"
              >
                📞
              </a>
            )}
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

      {/* Trip Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {ride.distance && (
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {(ride.distance / 1000).toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 font-medium">km</p>
            </div>
          )}
          {ride.duration && (
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(ride.duration / 60)}
              </p>
              <p className="text-xs text-gray-600 font-medium">min</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ₦{ride.fare?.toLocaleString('en-NG') || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 font-medium">fare</p>
          </div>
        </div>

        {ride.status === 'COMPLETED' && (
          <div className="pt-4 border-t border-blue-200">
            <p className="text-center text-sm font-medium text-gray-700">
              🎉 Thank you for using DeliverMi!
            </p>
          </div>
        )}
      </div>

      {/* Cancel Button - Only allow cancel before pickup */}
      {ride.status !== 'COMPLETED' && 
       ride.status !== 'CANCELLED' && 
       ride.status !== 'PICKED_UP' && 
       ride.status !== 'ARRIVED_AT_DROPOFF' && (
        <button
          onClick={onCancel}
          className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg"
        >
          Cancel Ride
        </button>
      )}
      
      {/* Cannot cancel after pickup */}
      {(ride.status === 'PICKED_UP' || ride.status === 'ARRIVED_AT_DROPOFF') && (
        <div className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-medium text-center border-2 border-gray-300">
          <div className="text-sm">🔒 Ride in progress - cannot cancel</div>
          <div className="text-xs mt-1">Complete the ride to proceed</div>
        </div>
      )}

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
    </div>
  );
}
