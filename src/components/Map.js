import { useState, useEffect, useRef } from 'react';
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
    const mapRef = useRef(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        if (pickup) {
            setViewState(prev => ({
                ...prev,
                latitude: pickup.lat,
                longitude: pickup.lng,
                zoom: 14
            }));
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setViewState(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        zoom: 14
                    }));
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setError('Unable to get your location');
                }
            );
        }
    }, [pickup]);

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
                {/* Navigation controls - hidden on mobile */}
                <div className="hidden md:block">
                    <NavigationControl position="bottom-right" showCompass={false} />
                </div>
                
                <GeolocateControl 
                    position="top-right"
                    onGeolocate={(e) => {
                        setViewState(prev => ({
                            ...prev,
                            latitude: e.coords.latitude,
                            longitude: e.coords.longitude,
                            zoom: 14
                        }));
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
                <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm shadow-lg z-50">
                    ⚠️ {error}
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
