import { useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function DeliverMiMap(props) {
    if (typeof window === "undefined") {
        return null;
    }
    const { orders = [], pickup, dropoff, riderLocation, route } = props;
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

                {/* Rider location marker with pulsing animation */}
                {riderLocation && (
                    <Marker 
                        latitude={riderLocation.lat} 
                        longitude={riderLocation.lng} 
                        anchor="center"
                    >
                        <div className="relative">
                            {/* Pulsing circle */}
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                            {/* Rider icon */}
                            <div className="relative w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
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
        </div>
    );
}
