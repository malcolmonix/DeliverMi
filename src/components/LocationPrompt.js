import { useState, useEffect } from 'react';

export default function LocationPrompt({ permissionState, onRequestLocation, error }) {
    const [platform, setPlatform] = useState('unknown');
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // Detect platform based on user agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            setPlatform('ios');
        } else if (/android/i.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }
    }, []);

    // Don't show if permission is already granted
    if (permissionState === 'granted') {
        return null;
    }

    const handleRequestClick = () => {
        if (permissionState === 'denied') {
            setShowInstructions(true);
        } else {
            onRequestLocation();
        }
    };

    const getInstructions = () => {
        if (platform === 'ios') {
            return {
                title: 'Enable Location on iPhone',
                steps: [
                    'Open Settings on your iPhone',
                    'Scroll down and tap Safari',
                    'Tap Location',
                    'Select "Allow" or "Ask"',
                    'Return to this page and refresh'
                ]
            };
        } else if (platform === 'android') {
            return {
                title: 'Enable Location on Android',
                steps: [
                    'Open Chrome Settings (tap ⋮ menu)',
                    'Tap Site Settings',
                    'Tap Location',
                    'Find this site and allow location',
                    'Return to this page and refresh'
                ]
            };
        } else {
            return {
                title: 'Enable Location in Browser',
                steps: [
                    'Click the lock icon (🔒) in your browser\'s address bar',
                    'Find "Location" permissions',
                    'Change it to "Allow"',
                    'Refresh this page'
                ]
            };
        }
    };

    const instructions = getInstructions();

    if (showInstructions || permissionState === 'denied') {
        return (
            <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">📍</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {instructions.title}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            DeliverMi needs your location to show nearby riders and calculate routes
                        </p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                        <ol className="space-y-3">
                            {instructions.steps.map((step, index) => (
                                <li key={index} className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 flex-1">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <button
                        onClick={() => {
                            setShowInstructions(false);
                            window.location.reload();
                        }}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        I've Enabled Location
                    </button>

                    {permissionState !== 'denied' && (
                        <button
                            onClick={() => setShowInstructions(false)}
                            className="w-full mt-3 text-gray-500 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Initial prompt (permission is 'prompt' or null)
    return (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">📍</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Enable Your Location
                    </h2>
                    <p className="text-gray-600">
                        DeliverMi needs your location to:
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🗺️</span>
                        <div>
                            <p className="font-semibold text-gray-900">Show nearby riders</p>
                            <p className="text-sm text-gray-600">Find drivers close to you</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">📏</span>
                        <div>
                            <p className="font-semibold text-gray-900">Calculate accurate routes</p>
                            <p className="text-sm text-gray-600">Get precise pickup locations</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⏱️</span>
                        <div>
                            <p className="font-semibold text-gray-900">Track your ride</p>
                            <p className="text-sm text-gray-600">See real-time driver updates</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">⚠️ {error}</p>
                    </div>
                )}

                <button
                    onClick={handleRequestClick}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg mb-3"
                >
                    Allow Location Access
                </button>

                <p className="text-xs text-gray-500 text-center">
                    Your browser will ask for permission. Click "Allow" to continue.
                </p>
            </div>
        </div>
    );
}
