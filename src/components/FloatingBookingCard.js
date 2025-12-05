import { useState } from 'react';

export default function FloatingBookingCard({
  pickup,
  dropoff,
  fare,
  route,
  isLoading,
  error,
  onRequestRide,
  onClearState,
  showRatingModal,
  rideStatus,
  hasError
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50
      transition-all duration-300 ease-in-out
      ${isExpanded ? 'max-h-[70vh]' : 'max-h-20'}
    `}>
      <div className="bg-white rounded-t-3xl shadow-2xl border-t-2 border-gray-200 h-full overflow-hidden">
        {/* Header/Drag Handle */}
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-1 bg-white/40 rounded-full"></div>
            <h3 className="text-white font-bold text-lg">
              {showRatingModal ? '⭐ Rate Your Ride' : 'Booking Details'}
            </h3>
          </div>
          <svg 
            className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Content - Only show if expanded */}
        {isExpanded && (
          <div className="overflow-y-auto max-h-[calc(70vh-3rem)] p-6 space-y-4">
            {/* Rating Modal Positioned Here */}
            {showRatingModal && (
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Rate your rider before booking your next ride
                  </p>
                </div>
              </div>
            )}

            {/* Pickup Location */}
            {pickup && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">PICKUP</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dropoff Location */}
            {dropoff && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    B
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">DROPOFF</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Route Info */}
            {route && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Distance:</span> {route.distanceKm || '0'} km
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Duration:</span> {route.durationMin || '0'} min
                </p>
              </div>
            )}

            {/* Fare Display */}
            {fare && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-gray-500 font-medium mb-1">ESTIMATED FARE</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{parseFloat(fare).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClearState}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onRequestRide}
                disabled={isLoading || !pickup || !dropoff || !fare || hasError}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all ${
                  isLoading || !pickup || !dropoff || !fare || hasError
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Requesting...
                  </span>
                ) : fare ? (
                  `Request Dispatch - ₦${parseFloat(fare).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  'Calculate fare first'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
