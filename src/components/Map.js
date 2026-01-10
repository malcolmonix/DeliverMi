import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function DeliverMiMap(props) {
    if (typeof window === "undefined") {
        return null;
    }
    const { orders = [], pickup, dropoff, riderLocation, route, onClick, rideStatus } = props;
    const [viewState, setViewState] = useState({
        latitude: 40.7128,
        longitude: -74.0060,
        zoom: 13
    });

    const [error, setError] = useState(null);
    const [permissionState, setPermissionState] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const formatGeoError = useCallback((geoError) => {
        if (!geoError) return 'Unable to get your location';
        switch (geoError.code) {
            case 1:
                return 'Location permission denied. Please enable location services for DeliverMi.';
            case 2:
                return 'Location unavailable. Check your network or try again.';
            case 3:
                return 'Location request timed out. Please try again.';
            default:
                return 'Unable to get your location';
        }
    }, []);

    const requestLocation = useCallback(() => {
        if (typeof window === 'undefined') return;

        // Check for secure context (HTTPS required for geolocation on most browsers)
        if (!window.isSecureContext) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const hostname = window.location.hostname;
            
            // Localhost is always secure, even over HTTP - check all common local addresses
            const isLocalhost = hostname === 'localhost' || 
                                hostname === '127.0.0.1' || 
                                hostname === '::1' ||
                                hostname.startsWith('192.168.') || 
                                hostname.startsWith('10.') ||
                                hostname.startsWith('172.16.') ||
                                hostname.startsWith('172.17.') ||
                                hostname.startsWith('172.18.') ||
                                hostname.startsWith('172.19.') ||
                                hostname.startsWith('172.20.') ||
                                hostname.startsWith('172.21.') ||
                                hostname.startsWith('172.22.') ||
                                hostname.startsWith('172.23.') ||
                                hostname.startsWith('172.24.') ||
                                hostname.startsWith('172.25.') ||
                                hostname.startsWith('172.26.') ||
                                hostname.startsWith('172.27.') ||
                                hostname.startsWith('172.28.') ||
                                hostname.startsWith('172.29.') ||
                                hostname.startsWith('172.30.') ||
                                hostname.startsWith('172.31.');
            
            if (isMobile && !isLocalhost) {
                setError('Location access requires HTTPS on mobile devices. Please access this app using https:// or contact support for assistance.');
            } else {
                setError('Location access requires a secure connection (HTTPS). Please use https:// to access this page.');
            }
            setPermissionState('denied');
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported on this device. You can still use the app by tapping on the map to set locations.');
            setPermissionState('denied');
            return;
        }

        // Clear any previous errors when attempting to get location
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setViewState(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    zoom: 14
                }));
                setError(null);
                setPermissionState('granted');
            },
            (geoError) => {
                console.error('Error getting location:', geoError);
                setError(formatGeoError(geoError));
                if (geoError.code === 1) {
                    setPermissionState('denied');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 10000
            }
        );
    }, [formatGeoError]);

    useEffect(() => {
        if (pickup) {
            setViewState(prev => ({
                ...prev,
                latitude: pickup.lat,
                longitude: pickup.lng,
                zoom: 14
            }));
            return;
        }

        // Don't automatically request location on mount - let user trigger it
        // This prevents immediate permission errors on mobile devices
        // requestLocation();
    }, [pickup]);

    // Track browser permission state so we can prompt the user clearly
    useEffect(() => {
        let permissionHandle;
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionState(result.state);
                permissionHandle = result;
                result.onchange = () => setPermissionState(result.state);
            }).catch(() => {
                setPermissionState(null);
            });
        }
        return () => {
            if (permissionHandle) permissionHandle.onchange = null;
        };
    }, []);

    // Fit bounds when both pickup and dropoff are set
    useEffect(() => {
        if (pickup && dropoff && mapRef.current) {
            const map = mapRef.current.getMap();
            if (map) {
                map.fitBounds(
                    [
                        [pickup.lng, pickup.lat],
                        [dropoff.lng, dropoff.lat]
                    ],
                    {
                        padding: { top: 100, bottom: 300, left: 50, right: 50 },
                        duration: 1000
                    }
                );
            }
        }
    }, [pickup, dropoff]);

    if (!mapboxToken) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                    <p className="text-gray-600 mb-2">Mapbox token not configured</p>
                    <p className="text-sm text-gray-500">Please set NEXT_PUBLIC_MAPBOX_TOKEN</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', background: 'blue' }}>
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                onClick={onClick}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={mapboxToken}
                onError={(e) => {
                    console.error('Map error:', e);
                    setError('Map failed to load');
                }}
                touchZoomRotate
                doubleClickZoom={false}
            >
                {/* Quick CTA to request permission when it is denied or not yet granted */}
                {(permissionState === 'denied' || permissionState === 'prompt' || permissionState === null) && !pickup && (
                    <div className="absolute top-3 left-3 right-3 md:left-3 md:right-auto z-50">
                        <button
                            type="button"
                            onClick={requestLocation}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 shadow-lg px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Use My Location
                        </button>
                    </div>
                )}

                {/* Navigation controls - hidden on mobile */}
                <div className="hidden md:block">
                    <NavigationControl position="bottom-right" showCompass={false} />
                </div>
                
                <GeolocateControl 
                    position="top-right"
                    trackUserLocation
                    showAccuracyCircle={false}
                    onGeolocate={(e) => {
                        setViewState(prev => ({
                            ...prev,
                            latitude: e.coords.latitude,
                            longitude: e.coords.longitude,
                            zoom: 14
                        }));
                        setError(null);
                        setPermissionState('granted');
                    }}
                    onError={(geoError) => {
                        console.error('GeolocateControl error:', geoError);
                        setError(formatGeoError(geoError));
                        if (geoError.code === 1) {
                            setPermissionState('denied');
                        }
                    }}
                />

                {/* Route line */}
                {route && route.geometry && (
                    <Source id="route" type="geojson" data={route.geometry}>
                        <Layer
                            id="route-line"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': '#000000',
                                'line-width': 5,
                                'line-opacity': 0.6
                            }}
                        />
                        <Layer
                            id="route-line-outline"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': '#ffffff',
                                'line-width': 7,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Pickup marker */}
                {pickup && (
                    <Marker latitude={pickup.lat} longitude={pickup.lng} anchor="bottom">
                        <div className="relative">
                            <div className="w-6 h-6 bg-black rounded-full border-4 border-white shadow-lg transform -translate-x-1/2"></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded font-semibold">
                                Pickup
                            </div>
                        </div>
                    </Marker>
                )}

                {/* Dropoff marker */}
                {dropoff && (
                    <Marker latitude={dropoff.lat} longitude={dropoff.lng} anchor="bottom">
                        <div className="relative">
                            <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg transform -translate-x-1/2"></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold">
                                Dropoff
                            </div>
                        </div>
                    </Marker>
                )}

                {/* Rider location marker with pulsing animation and direction */}
                {riderLocation && (
                    <Marker 
                        latitude={riderLocation.lat} 
                        longitude={riderLocation.lng} 
                        anchor="center"
                    >
                        <div className="relative flex flex-col items-center">
                            {/* Pulsing circle */}
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-50"></div>
                            
                            {/* Rider icon with direction arrow */}
                            <div 
                                className="relative w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-transform"
                                style={{
                                  transform: riderLocation.heading ? `rotate(${riderLocation.heading}deg)` : 'rotate(0deg)'
                                }}
                            >
                                {/* Bike/scooter icon */}
                                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.5 9.5C19.88 9.5 21 8.38 21 7s-1.12-2.5-2.5-2.5S16 5.62 16 7s1.12 2.5 2.5 2.5zm-13 0C7.88 9.5 9 8.38 9 7s-1.12-2.5-2.5-2.5S4 5.62 4 7s1.12 2.5 2.5 2.5zm6.5-8c1.66 0 3-1.34 3-3S13.66 0 12 0s-3 1.34-3 3 1.34 3 3 3z" />
                                </svg>
                                
                                {/* Direction arrow */}
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
                                </div>
                            </div>
                            
                            {/* Status label */}
                            <div className="absolute -bottom-6 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap shadow-md">
                                🚗 En Route
                            </div>
                        </div>
                    </Marker>
                )}

                {/* Order markers */}
                {orders.map((order) => {
                    if (!order.lat || !order.lng) return null;

                    return (
                        <Marker
                            key={order.id}
                            latitude={order.lat}
                            longitude={order.lng}
                            anchor="bottom"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">$</span>
                                </div>
                            </div>
                        </Marker>
                    );
                })}
            </Map>

            {/* Error overlay */}
            {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl text-sm shadow-xl z-50">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                            <span className="text-xl flex-shrink-0">⚠️</span>
                            <div className="flex-1">
                                <p className="font-semibold mb-1">Location Access Issue</p>
                                <p className="text-xs text-red-800">{error}</p>
                            </div>
                            <button
                                type="button"
                                className="text-red-700 hover:text-red-900 flex-shrink-0"
                                onClick={() => setError(null)}
                                aria-label="Dismiss"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {typeof window !== 'undefined' && !window.isSecureContext ? (
                                <div className="text-xs bg-red-100 border border-red-200 p-2 rounded">
                                    <p className="font-semibold mb-1">💡 Tip:</p>
                                    <p>You can still use the app by tapping on the map to select pickup and dropoff locations.</p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                                    onClick={requestLocation}
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Rider Location Tracker Overlay */}
            {riderLocation && rideStatus && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative flex items-center justify-center w-10 h-10">
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
                            <div className="relative w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="text-white text-sm">🏍️</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Your Rider</h3>
                            <p className="text-xs text-gray-500">Live Location</p>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded p-2 mb-2">
                        <p className="text-xs text-gray-600 mb-1">Status:</p>
                        <p className="text-sm font-semibold text-blue-900">
                            {rideStatus === 'ACCEPTED' && '🚗 On the way to pickup'}
                            {rideStatus === 'ARRIVED_AT_PICKUP' && '📍 Arrived at pickup'}
                            {rideStatus === 'PICKED_UP' && '🚗 On the way to destination'}
                            {rideStatus === 'ARRIVED_AT_DROPOFF' && '📍 Arrived at destination'}
                            {rideStatus === 'COMPLETED' && '✅ Ride completed'}
                            {!['ACCEPTED', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'ARRIVED_AT_DROPOFF', 'COMPLETED'].includes(rideStatus) && rideStatus}
                        </p>
                    </div>

                    <div className="text-xs text-gray-600 flex items-center gap-1">
                        <span>📍</span>
                        <span>{riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
