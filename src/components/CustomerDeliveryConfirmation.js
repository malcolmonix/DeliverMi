import { useState, useEffect } from 'react';

export default function CustomerDeliveryConfirmation({ activeRide, onProvideCode, isLoading }) {
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [codeSaved, setCodeSaved] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  // Debug: Log when component receives ride data
  useEffect(() => {
    console.log('🔐 CustomerDeliveryConfirmation received ride:', {
      id: activeRide?.id,
      status: activeRide?.status,
      rideId: activeRide?.rideId,
      riderRequestedCode: activeRide?.riderRequestedCode,
      allRideData: activeRide
    });
  }, [activeRide]);

  // Generate a 6-digit code and IMMEDIATELY save it (no separate confirm step)
  const generateAndSaveCode = async () => {
    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    setGeneratedCode(code);
    setSavingCode(true);

    console.log('🔐 Generated confirmation code:', code);
    console.log('🔐 Auto-saving code for ride:', activeRide?.rideId || activeRide?.id);

    try {
      await onProvideCode(code);
      setCodeSaved(true);
      console.log('✅ Code auto-saved successfully. Customer just needs to give code to rider:', code);
    } catch (error) {
      console.error('❌ Failed to save code:', error);
      setCodeSaved(false);
    } finally {
      setSavingCode(false);
    }
  };

  // Show when rider arrives at dropoff location
  if (!activeRide) {
    console.log('🔐 CustomerDeliveryConfirmation not showing - no activeRide');
    return null;
  }

  // Show when status is ARRIVED_AT_DROPOFF
  const shouldShow = activeRide.status === 'ARRIVED_AT_DROPOFF';

  if (!shouldShow) {
    console.log('🔐 CustomerDeliveryConfirmation not showing - waiting for ARRIVED_AT_DROPOFF status');
    console.log('🔐 Current ride data:', { status: activeRide.status });
    return null;
  }

  console.log('🔐 CustomerDeliveryConfirmation SHOWING - Rider arrived at dropoff!');

  // Toggle expand/collapse - panel stays visible at minimum height
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Delivery Confirmation - Persistent floating panel that collapses to visible header */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-purple-50 border-t-4 border-purple-500 shadow-2xl transition-all duration-300 ease-in-out z-40`}
        style={{
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          height: isExpanded ? '70vh' : '64px', // Collapsed shows header bar (persistent)
          minHeight: '64px', // Always keep header visible
        }}
      >
        {/* Header - Always visible for expand/collapse control */}
        <div
          className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 rounded-t-3xl cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-1 bg-white/40 rounded-full" />
              <h3 className="text-white font-bold text-lg">
                {generatedCode && codeSaved ? `📱 Code: ${generatedCode}` : '🔐 Delivery Confirmation'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {generatedCode && codeSaved && (
                <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">
                  ✅ Ready
                </span>
              )}
              <svg
                className={`w-5 h-5 text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Area - Only visible when expanded */}
        {isExpanded && (
          <div className="overflow-y-auto p-6" style={{ height: 'calc(70vh - 64px)' }}>
            <div className="flex items-start gap-3">
              <div className="text-4xl flex-shrink-0 animate-bounce">📍</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl text-purple-900">Rider Has Arrived!</h3>
                <p className="text-sm text-purple-800 mt-1 font-medium">Your rider has reached the destination.</p>

                {!generatedCode ? (
                  <>
                    <p className="text-xs text-purple-700 mt-2 mb-4 bg-purple-100 p-3 rounded-lg">
                      📋 <strong>To complete your delivery:</strong><br />
                      1. Tap the button below to generate a confirmation code<br />
                      2. Give this code to your rider<br />
                      3. The rider will enter this code to complete the delivery
                    </p>
                    <button
                      onClick={generateAndSaveCode}
                      disabled={savingCode || isLoading}
                      className="w-full bg-purple-500 text-white px-4 py-3 rounded-xl hover:bg-purple-600 transition-colors font-bold text-base disabled:opacity-50 shadow-lg"
                    >
                      {savingCode ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generating Code...
                        </span>
                      ) : (
                        '🔐 Generate Confirmation Code'
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4 mt-4">
                    {/* Code Display */}
                    <div className="bg-white border-4 border-green-400 rounded-2xl p-4 text-center shadow-lg">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        {codeSaved ? '✅ Code saved! Give this to your rider:' : '⏳ Saving code...'}
                      </p>
                      <p className="text-4xl font-bold text-purple-600 font-mono tracking-widest py-2">
                        {generatedCode}
                      </p>
                      {codeSaved && (
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          The rider will enter this code to complete your delivery
                        </p>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-sm text-blue-800 text-center">
                        <strong>👆 Show this code to your rider</strong><br />
                        <span className="text-xs">They will enter it to mark your delivery as complete</span>
                      </p>
                    </div>

                    {/* Generate new code option */}
                    <button
                      onClick={generateAndSaveCode}
                      disabled={savingCode || isLoading}
                      className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      🔄 Generate New Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
