import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { useMutation, useQuery } from '@apollo/client';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import DeliverMiMap from '../components/Map';
import AddressSearch from '../components/AddressSearch';
import { REQUEST_RIDE, GET_RIDE_STATUS } from '../lib/graphql-operations';
import { reverseGeocode, getRoute, calculateFare } from '../lib/mapbox';
import { db, auth } from '../lib/firebase';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [mode, setMode] = useState('pickup');
  const [activeRideId, setActiveRideId] = useState(null);
  const [route, setRoute] = useState(null);
  const [fare, setFare] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [error, setError] = useState(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);

  // Check authentication state
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

  const [requestRide, { loading: requesting }] = useMutation(REQUEST_RIDE);

  const { data: rideData, startPolling, stopPolling } = useQuery(GET_RIDE_STATUS, {
    variables: { id: activeRideId },
    skip: !activeRideId,
    pollInterval: 3000
  });

  // Real-time rider location tracking
  useEffect(() => {
    if (!activeRideId || !rideData?.ride?.rider?.id) return;

    const riderId = rideData.ride.rider.id;
    const unsubscribe = onSnapshot(
      doc(db, 'rider-locations', riderId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.latitude && data.longitude) {
            setRiderLocation({
              lat: data.latitude,
              lng: data.longitude
            });
          }
        }
      },
      (error) => {
        console.error('Error listening to rider location:', error);
      }
    );

    return () => unsubscribe();
  }, [activeRideId, rideData?.ride?.rider?.id]);

  // Fallback to GraphQL rider location
  useEffect(() => {
    if (rideData?.ride?.rider?.latitude && rideData?.ride?.rider?.longitude) {
      setRiderLocation({
        lat: rideData.ride.rider.latitude,
        lng: rideData.ride.rider.longitude
      });
    }
  }, [rideData?.ride?.rider]);

  // Reverse geocode when pickup is set
  useEffect(() => {
    if (pickup && !pickupAddress) {
      setLoadingAddress(true);
      reverseGeocode(pickup.lat, pickup.lng).then(address => {
        if (address) setPickupAddress(address);
        setLoadingAddress(false);
      });
    }
  }, [pickup, pickupAddress]);

  // Reverse geocode when dropoff is set
  useEffect(() => {
    if (dropoff && !dropoffAddress) {
      setLoadingAddress(true);
      reverseGeocode(dropoff.lat, dropoff.lng).then(address => {
        if (address) setDropoffAddress(address);
        setLoadingAddress(false);
      });
    }
  }, [dropoff, dropoffAddress]);

  // Calculate route and fare
  useEffect(() => {
    if (pickup && dropoff && !activeRideId) {
      getRoute(pickup, dropoff).then(routeData => {
        if (routeData) {
          setRoute(routeData);
          const calculatedFare = calculateFare(parseFloat(routeData.distanceKm), routeData.durationMin);
          setFare(calculatedFare);
        }
      });
    }
  }, [pickup, dropoff, activeRideId]);

  const handleMapClick = useCallback((e) => {
    if (activeRideId) return;

    const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
    if (mode === 'pickup') {
      setPickup(coords);
      setPickupAddress('');
      setMode('dropoff');
      setRoute(null);
      setFare(null);
    } else {
      setDropoff(coords);
      setDropoffAddress('');
      setRoute(null);
      setFare(null);
    }
    setBottomSheetOpen(true);
  }, [activeRideId, mode]);

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) {
      setError('Please select both pickup and dropoff locations');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setError(null);

    try {
      const result = await requestRide({
        variables: {
          input: {
            pickupAddress: pickupAddress || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`,
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropoffAddress: dropoffAddress || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`,
            dropoffLat: dropoff.lat,
            dropoffLng: dropoff.lng,
            fare: parseFloat(fare || '15.00'),
            distance: route ? parseFloat(route.distanceKm) : null,
            duration: route ? route.durationMin : null
          }
        }
      });
      
      if (result.data?.requestRide) {
        setActiveRideId(result.data.requestRide.id);
        startPolling(3000);
        setBottomSheetOpen(true);
      }
    } catch (err) {
      console.error('Error requesting ride:', err);
      const errorMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message || 'Failed to request ride';
      setError(errorMessage);
    }
  };

  const handleCancelRide = () => {
    setActiveRideId(null);
    setPickup(null);
    setDropoff(null);
    setPickupAddress('');
    setDropoffAddress('');
    setRoute(null);
    setFare(null);
    setRiderLocation(null);
    setMode('pickup');
    stopPolling();
    setBottomSheetOpen(true);
  };

  const ride = rideData?.ride;

  if (loadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Full screen map */}
      <div className="absolute inset-0" onClickCapture={handleMapClick}>
        <DeliverMiMap
          orders={[]}
          pickup={pickup}
          dropoff={dropoff}
          riderLocation={riderLocation}
          route={route}
        />
      </div>

      {/* Bottom Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out ${
          bottomSheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          maxHeight: '85vh',
          minHeight: activeRideId ? '300px' : '400px'
        }}
      >
        {/* Drag handle */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {activeRideId && ride ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Ride #{ride.rideId}</h1>
                  <p className="text-sm text-gray-500 mt-1">Status: {ride.status}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  ride.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  ride.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                  ride.status === 'PICKED_UP' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ride.status}
                </span>
              </div>

              {ride.rider ? (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-green-800">Rider Found!</p>
                      <p className="text-sm text-green-700">{ride.rider.displayName || 'Your Driver'} is on the way</p>
                    </div>
                  </div>
                  {ride.rider.phoneNumber && (
                    <a 
                      href={`tel:${ride.rider.phoneNumber}`}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 mt-2 font-medium"
                    >
                      📞 {ride.rider.phoneNumber}
                    </a>
                  )}
                  {riderLocation && route && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-600">
                        ETA: {route.durationMin} min • {route.distanceKm} km away
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 font-medium">Finding a driver nearby...</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">📍</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Pickup</p>
                    <p className="text-sm font-medium">{ride.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">🏁</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Dropoff</p>
                    <p className="text-sm font-medium">{ride.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCancelRide}
                className="w-full py-4 bg-gray-100 text-gray-800 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel Ride
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">Where to?</h1>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-medium">Pickup Location</label>
                  <AddressSearch
                    value={pickupAddress}
                    onChange={(address) => setPickupAddress(address)}
                    onSelect={(location) => {
                      setPickup(location);
                      setPickupAddress(location.address);
                      setMode('dropoff');
                      setRoute(null);
                      setFare(null);
                    }}
                    placeholder="Search pickup address or tap map"
                  />
                  {pickup && !pickupAddress && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">
                      {loadingAddress ? 'Loading address...' : `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2 font-medium">Dropoff Location</label>
                  <AddressSearch
                    value={dropoffAddress}
                    onChange={(address) => setDropoffAddress(address)}
                    onSelect={(location) => {
                      setDropoff(location);
                      setDropoffAddress(location.address);
                      setRoute(null);
                      setFare(null);
                    }}
                    placeholder="Search dropoff address or tap map"
                  />
                  {dropoff && !dropoffAddress && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">
                      {loadingAddress ? 'Loading address...' : `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`}
                    </p>
                  )}
                </div>

                {route && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Distance:</span>
                      <span className="font-bold text-gray-900">{route.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration:</span>
                      <span className="font-bold text-gray-900">{route.durationMin} min</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleRequestRide}
                  disabled={!pickup || !dropoff || requesting || !fare}
                  className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shadow-lg"
                >
                  {requesting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Requesting...
                    </span>
                  ) : fare ? (
                    `Request Ride - $${fare.toFixed(2)}`
                  ) : (
                    'Calculating fare...'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
