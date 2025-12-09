import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useMutation, useQuery } from '@apollo/client';
import { doc, onSnapshot } from 'firebase/firestore';
import DeliverMiMap from '../components/Map';
import AddressSearch from '../components/AddressSearch';
import ActiveRideView from '../components/ActiveRideView';
import CustomerDeliveryConfirmation from '../components/CustomerDeliveryConfirmation';
import RatingModal from '../components/RatingModal';
import { REQUEST_RIDE, GET_RIDE_STATUS, CANCEL_RIDE, GET_MY_RIDES, SET_DELIVERY_CODE } from '../lib/graphql-operations';
import { reverseGeocode, getRoute, calculateFare } from '../lib/mapbox';
import { db, auth } from '../lib/firebase';
import { requestNotificationPermission, onMessageListener, showNotification } from '../lib/notifications';

// Simple dispatch - no vehicle selection needed
// Currency: Nigerian Naira (₦)

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [mode, setMode] = useState('pickup');
  const [activeRideId, setActiveRideId] = useState(() => {
    // Restore active ride from localStorage on mount
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeRideId') || null;
    }
    return null;
  });
  const [route, setRoute] = useState(null);
  const [fare, setFare] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [error, setError] = useState(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localRideData, setLocalRideData] = useState(null); // Workaround for mock Firestore
  const [previousRideStatus, setPreviousRideStatus] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [riderToRate, setRiderToRate] = useState(null);
  const [rideMissingCount, setRideMissingCount] = useState(0); // Avoid clearing on transient errors
  const [rideValidated, setRideValidated] = useState(false); // Track if ride has been validated from server
  const fareCalculated = useRef(false);

  const [requestRide, { loading: requesting }] = useMutation(REQUEST_RIDE);
  const [cancelRide, { loading: cancelling }] = useMutation(CANCEL_RIDE);
  const [setDeliveryCode] = useMutation(SET_DELIVERY_CODE);

  // Query to get user's rides and check for active ones
  const { data: myRidesData, refetch: refetchMyRides } = useQuery(GET_MY_RIDES, {
    skip: !user,
    pollInterval: user ? 10000 : 0, // Poll every 10s to detect server-side changes
    onCompleted: (data) => {
      // Check if user has an active ride and restore it
      if (data?.myRides && !activeRideId) {
        const activeRide = data.myRides.find(r =>
          r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
        );
        if (activeRide) {
          console.log('🔄 Restoring active ride from myRides:', activeRide.id);
          setActiveRideId(activeRide.id);
          setLocalRideData(activeRide);
          setRideValidated(true);
          localStorage.setItem('activeRideId', activeRide.id);
          setBottomSheetOpen(true);
        }
      }

      // Validate existing activeRideId against myRides
      if (activeRideId && data?.myRides) {
        const currentRide = data.myRides.find(r => r.id === activeRideId);
        if (currentRide) {
          setRideValidated(true);
          // Update status if changed
          if (currentRide.status === 'COMPLETED' || currentRide.status === 'CANCELLED') {
            console.log('✅ Ride completed/cancelled, will clear after rating');
          }
        } else {
          console.warn('⚠️ Active ride not found in myRides, marking as invalid');
          setRideValidated(false);

          // IMMEDIATE FIX: If we have an active ride ID locally, but the server says we have NO matching active ride in our history,
          // then the local ID is dead/zombie. Clear it immediately to unblock the user.
          console.log('🧟 ZOMBIE RIDE CONFIRMED by myRides: Clearing immediately.');
          handleClearStuckRide();
        }
      }
    }
  });

  const activeRideFromMyRides = useMemo(() => {
    return myRidesData?.myRides?.find(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED') || null;
  }, [myRidesData?.myRides]);

  const { data: rideData, startPolling, stopPolling, refetch } = useQuery(GET_RIDE_STATUS, {
    variables: { id: activeRideId || '' },  // Provide empty string if null to prevent GraphQL errors
    skip: !activeRideId || !user,  // Skip if no active ride OR not authenticated
    pollInterval: activeRideId && user ? 5000 : 0,  // Poll every 5s for better UX
    fetchPolicy: 'network-only', // Always fetch fresh data
    onCompleted: (data) => {
      console.log('📊 GET_RIDE_STATUS query completed:', data);
      if (!data?.ride) {
        console.warn('⚠️ Ride not found via direct query, will cross-check with myRides');
        setRideMissingCount(count => count + 1);
        // Trigger myRides refetch to validate
        refetchMyRides();
        return;
      }

      // Reset missing counter on success and keep local fallback in sync
      setRideMissingCount(0);
      setRideValidated(true);
      setLocalRideData(data.ride);

      // Auto-clear completed/cancelled rides after a delay
      if (data.ride.status === 'COMPLETED' || data.ride.status === 'CANCELLED') {
        console.log('🏁 Ride finished, will prompt for rating then clear');
      }
    },
    onError: (error) => {
      console.error('❌ GET_RIDE_STATUS query error:', error);
      
      // If access denied error (wrong user), clear the stale ride immediately
      if (error.message?.includes('Access denied')) {
        console.error('🔐 Access denied - ride belongs to different user, clearing stale ride');
        setActiveRideId(null);
        localStorage.removeItem('activeRideId');
        setRideMissingCount(0);
        return;
      }
      
      // Only increment the missing counter for other errors; avoid clearing on transient errors
      setRideMissingCount(count => count + 1);

      // If authentication error, clear the ride
      if (error.message?.includes('Authentication')) {
        console.error('🔐 Authentication error, clearing ride');
        setActiveRideId(null);
        localStorage.removeItem('activeRideId');
      }
    }
  });

  // UBER/BOLT APPROACH: Never auto-clear rides client-side. Only server can end a ride.
  // This prevents "stuck ride" issues from network glitches while ensuring data integrity.
  useEffect(() => {
    if (!activeRideId) {
      setRideMissingCount(0);
      setRideValidated(false);
      return;
    }

    // Log missing polls for debugging
    if (rideMissingCount >= 2) {
      console.warn('⚠️ Ride unreachable for 2+ polls. Checking if zombie state...');
      console.log('📊 Debug info:', {
        activeRideId,
        inMyRides: !!activeRideFromMyRides,
        myRidesLoaded: !!myRidesData,
        validated: rideValidated
      });

      // Reset counter
      setRideMissingCount(0);

      // SELF-HEALING: If myRides has loaded and this ride is NOT in it (and not just network error), CLEAR IT.
      if (myRidesData && !activeRideFromMyRides) {
        console.warn('🧟 ZOMBIE RIDE DETECTED: Ride not found in user history. Clearing stuck state.');
        handleClearStuckRide();
        return;
      }

      // If myRides confirms it exists, we stick with it (server might be glitching specific query)
      if (activeRideFromMyRides && activeRideFromMyRides.id === activeRideId) {
        console.log('✅ MyRides confirms ride exists, using fallback data');
        setLocalRideData(activeRideFromMyRides);
        setRideValidated(true);
      }
    }
  }, [rideMissingCount, activeRideFromMyRides, activeRideId, rideValidated, localRideData, myRidesData]);

  // Real-time rider location tracking from Firestore
  useEffect(() => {
    if (!activeRideId) {
      console.log('⏳ No active ride, skipping location listener setup');
      return;
    }

    const ride = rideData?.ride || localRideData;
    if (!ride) {
      console.log('⏳ No ride data available yet, waiting for API response...');
      return;
    }

    const riderId = ride.riderId || ride.rider?.id;
    if (!riderId) {
      console.log('⏳ Waiting for ride data with riderId..., ride data:', ride);
      return;
    }

    console.log('🚗 Setting up real-time listener for rider location:', riderId);
    console.log('📍 Ride details:', { rideId: activeRideId, riderId, status: ride.status, hasLocation: !!ride.rider?.location });

    const unsubscribe = onSnapshot(
      doc(db, 'rider-locations', riderId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('🎯 RIDER LOCATION UPDATE from Firestore:', {
            latitude: data.latitude || data.lat,
            longitude: data.longitude || data.lng,
            heading: data.heading,
            speed: data.speed,
            timestamp: data.updatedAt || data.at
          });

          const lat = data.latitude || data.lat;
          const lng = data.longitude || data.lng;

          if (lat && lng) {
            const location = {
              lat: lat,
              lng: lng,
              heading: data.heading || 0,
              speed: data.speed || 0,
              timestamp: data.updatedAt || data.at
            };

            setRiderLocation(location);
            console.log('✅ Rider location updated on map with heading:', location.heading, 'degrees');

            // Fit map to show both dropoff and rider when location updates
            if (dropoff) {
              try {
                const mapElement = document.querySelector('[class*="mapboxgl"]');
                if (mapElement) {
                  console.log('📍 Rider at:', { lat, lng }, 'Dropoff at:', dropoff);
                }
              } catch (e) {
                // Silently fail, map will still show
              }
            }
          }
        } else {
          console.log('⚠️ No rider location document found yet for riderId:', riderId);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('⚠️ Permission denied reading rider location. Firestore rules may need update.');
        } else {
          console.error('❌ Error listening to rider location:', error.message || error);
        }
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from rider location listener');
      unsubscribe();
    };
  }, [activeRideId, rideData?.ride?.riderId, localRideData?.riderId]);

  // Real-time ride status tracking from Firestore (PRIMARY SOURCE OF TRUTH)
  // UBER/BOLT PATTERN: Server is authoritative. Client only displays and never deletes.
  useEffect(() => {
    if (!activeRideId) return;

    console.log('🔥 Setting up Firestore real-time listener for ride:', activeRideId);

    const unsubscribe = onSnapshot(
      doc(db, 'rides', activeRideId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log('🔄 Ride status update from Firestore:', data.status);

          // Mark ride as validated when we get Firestore data
          setRideValidated(true);
          setRideMissingCount(0);

          // Update local ride data with latest from Firestore
          setLocalRideData(prev => ({
            ...prev,
            ...data,
            id: activeRideId
          }));

          // Refetch GraphQL to ensure consistency
          refetch();

          // ONLY clear ride when server confirms it's finished
          if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
            console.log('✅ SERVER CONFIRMED: Ride finished with status:', data.status);

            // Show rating modal on completion
            if (previousRideStatus !== 'COMPLETED' && data.status === 'COMPLETED') {
              const ride = rideData?.ride || localRideData;
              if (ride && (ride.rider || ride.riderId)) {
                setRiderToRate({
                  id: ride.rider?.id || ride.riderId,
                  name: ride.rider?.displayName || 'Your Rider'
                });
                setShowRatingModal(true);
              }
            }

            setPreviousRideStatus(data.status);

            // Clear ride from localStorage only after server confirmation
            // Give user time to rate before fully clearing
            if (!showRatingModal) {
              setTimeout(() => {
                console.log('🧹 Clearing completed ride from storage');
                setActiveRideId(null);
                localStorage.removeItem('activeRideId');
                setLocalRideData(null);
              }, 3000);
            }
          }
        } else {
          // Document missing - but DON'T clear. Log and retry.
          console.warn('⚠️ Firestore document temporarily unavailable for ride:', activeRideId);
          console.log('⏳ Will retry via polling. Ride persists until server confirms completion.');
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.error('🔐 Permission denied for ride status listener');
          
          // Check if this is a newly created ride (within last 10 seconds)
          const rideAge = localRideData?.createdAt ? Date.now() - new Date(localRideData.createdAt).getTime() : Infinity;
          
          if (rideAge < 10000) {
            // Newly created ride - document might not be in Firestore yet, wait for GraphQL to sync
            console.log('⏳ New ride detected, waiting for Firestore sync...');
          } else {
            // Old ride - permission denied means it belongs to different user
            console.error('🔐 Ride belongs to different user - clearing stale ride from localStorage');
            setActiveRideId(null);
            localStorage.removeItem('activeRideId');
            setRideMissingCount(0);
          }
        } else {
          console.error('❌ Error listening to ride status:', error);
          console.log('⏳ Will retry. Network issue does not delete ride.');
        }
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from Firestore ride status listener');
      unsubscribe();
    };
  }, [activeRideId, refetch, previousRideStatus, showRatingModal]);

  // Persist activeRideId to localStorage
  useEffect(() => {
    if (activeRideId) {
      localStorage.setItem('activeRideId', activeRideId);
      console.log('💾 Saved activeRideId to localStorage:', activeRideId);
    } else {
      localStorage.removeItem('activeRideId');
      console.log('🗑️ Removed activeRideId from localStorage');
    }
  }, [activeRideId]);

  // Fallback to GraphQL rider location
  useEffect(() => {
    if (rideData?.ride?.rider?.latitude && rideData?.ride?.rider?.longitude) {
      setRiderLocation({
        lat: rideData.ride.rider.latitude,
        lng: rideData.ride.rider.longitude
      });
    }
  }, [rideData?.ride?.rider]);

  // Update route when rider location changes during active ride
  useEffect(() => {
    const ride = rideData?.ride || localRideData;
    if (!activeRideId || !riderLocation || !ride) return;

    // Determine destination based on ride status
    let destination;
    if (ride.status === 'PICKED_UP' || ride.status === 'ARRIVED_AT_DROPOFF') {
      // Rider is heading to dropoff
      destination = dropoff || { lat: ride.dropoffLat, lng: ride.dropoffLng };
    } else if (ride.status === 'ACCEPTED' || ride.status === 'ARRIVED_AT_PICKUP') {
      // Rider is heading to pickup
      destination = pickup || { lat: ride.pickupLat, lng: ride.pickupLng };
    }

    if (destination && destination.lat && destination.lng) {
      console.log('🗺️ Updating route from rider to destination:', { riderLocation, destination, status: ride.status });

      getRoute(riderLocation, destination)
        .then(routeData => {
          setRoute(routeData.coordinates);
          console.log('✅ Route updated successfully');
        })
        .catch(err => {
          console.error('❌ Error updating route:', err);
        });
    }
  }, [riderLocation, activeRideId, rideData?.ride?.status, localRideData?.status, pickup, dropoff]);

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

  // Setup notifications
  useEffect(() => {
    if (!user) return;

    const setupNotifications = async () => {
      await requestNotificationPermission();
    };

    setupNotifications();

    // Listen for foreground messages
    onMessageListener()
      .then((payload) => {
        console.log('Received foreground message:', payload);
        const title = payload.notification?.title || 'Ride Update';
        const body = payload.notification?.body || '';
        showNotification(title, body);
      })
      .catch((err) => console.error('Failed to receive message:', err));
  }, [user]);

  // Monitor ride status changes and show notifications
  useEffect(() => {
    const ride = rideData?.ride || localRideData;
    if (!ride) return;

    const currentStatus = ride.status;

    if (previousRideStatus && previousRideStatus !== currentStatus) {
      const statusNotifications = {
        'ACCEPTED': { title: '🚗 Driver Found!', body: 'Your driver is on the way to pickup' },
        'ARRIVED_AT_PICKUP': { title: '📍 Driver Arrived', body: 'Your driver has arrived at the pickup location' },
        'PICKED_UP': { title: '🚗 Trip Started', body: 'You are on the way to your destination' },
        'ARRIVED_AT_DROPOFF': { title: '📍 Almost There', body: 'You have arrived at your destination' },
        'COMPLETED': { title: '✅ Trip Completed', body: 'Thank you for using our service!' }
      };

      const notif = statusNotifications[currentStatus];
      if (notif) {
        showNotification(notif.title, notif.body);
      }
    }

    setPreviousRideStatus(currentStatus);
  }, [rideData?.ride?.status, localRideData?.status]);

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
      console.log('💰 Starting fare calculation...');
      console.log('💰 Pickup:', pickup);
      console.log('💰 Dropoff:', dropoff);
      console.log('💰 Active ride ID:', activeRideId);
      fareCalculated.current = false; // Reset flag at start of calculation
      setFare(null); // Clear old fare

      // Set a timeout to fallback to default fare if route takes too long
      const timeout = setTimeout(() => {
        if (!fareCalculated.current) {
          console.warn('Route calculation timeout, using default fare');
          setFare('5000.00');
          fareCalculated.current = true;
        }
      }, 3000); // 3 second timeout

      getRoute(pickup, dropoff).then(routeData => {
        if (!fareCalculated.current) {
          clearTimeout(timeout);
          console.log('✅ Route data received:', routeData);
          if (routeData) {
            setRoute(routeData);
            const calculatedFare = calculateFare(parseFloat(routeData.distanceKm), routeData.durationMin);
            console.log('💰 Calculated fare:', calculatedFare);
            console.log('💰 Distance:', routeData.distanceKm, 'km');
            console.log('💰 Duration:', routeData.durationMin, 'min');
            setFare(calculatedFare);
            fareCalculated.current = true;
          } else {
            console.warn('No route data received, using default fare');
            setFare('5000.00');
            fareCalculated.current = true;
          }
        }
      }).catch(err => {
        if (!fareCalculated.current) {
          clearTimeout(timeout);
          console.error('Error calculating route:', err);
          setFare('5000.00');
          fareCalculated.current = true;
        }
      });

      return () => clearTimeout(timeout);
    } else if (!pickup || !dropoff) {
      // Reset when either location is cleared
      setFare(null);
      setRoute(null);
      fareCalculated.current = false;
    }
  }, [pickup, dropoff, activeRideId]);

  const handleMapClick = useCallback((e) => {
    console.log('🗺️ Map clicked! Event:', e);
    console.log('🗺️ activeRideId:', activeRideId);
    console.log('🗺️ mode:', mode);
    console.log('🗺️ e.lngLat:', e.lngLat);

    if (activeRideId) {
      console.log('❌ Click blocked - active ride exists:', activeRideId);
      showNotification('⚠️ Active Ride', 'Please complete or clear your current ride before booking a new one');
      return;
    }

    // Check if event has lngLat (Mapbox event) or it's a DOM event
    if (!e.lngLat) {
      console.log('❌ Click blocked - no lngLat in event');
      return; // Ignore non-map clicks (like GPS button)
    }

    const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
    console.log('✅ Map click accepted! Coords:', coords);

    if (mode === 'pickup') {
      console.log('📍 Setting PICKUP location:', coords);
      setPickup(coords);
      setPickupAddress('');
      setMode('dropoff');
      setRoute(null);
    } else {
      console.log('📍 Setting DROPOFF location:', coords);
      setDropoff(coords);
      setDropoffAddress('');
      setRoute(null);
    }
    setBottomSheetOpen(true);
  }, [activeRideId, mode]);

  const handleSubmitRating = async ({ rating, comment, riderId }) => {
    console.log('📝 Submitting rating:', { rating, comment, riderId });
    // TODO: Add GraphQL mutation to submit rating
    // For now, just log it
    showNotification('⭐ Rating Submitted', `Thank you for rating ${rating} stars!`);
    setShowRatingModal(false);
    setRiderToRate(null);
  };

  const handleBookAnotherRide = () => {
    console.log('🔄 Resetting UI to default state for new booking');
    setActiveRideId(null);
    setLocalRideData(null);
    setPickup(null);
    setDropoff(null);
    setPickupAddress('');
    setDropoffAddress('');
    setRoute(null);
    setFare(null);
    setRiderLocation(null);
    setMode('pickup');
    setBottomSheetOpen(true);
    setPreviousRideStatus(null);
    setShowRatingModal(false);
    setRiderToRate(null);
    localStorage.removeItem('activeRideId');
    fareCalculated.current = false;
  };

  const handleRequestRide = async () => {
    console.log('🚀 handleRequestRide called - BUTTON CLICKED!');
    console.log('pickup:', pickup, 'dropoff:', dropoff, 'fare:', fare);

    // Prevent booking if user already has an active ride
    if (activeRideId) {
      console.log('❌ User already has active ride:', activeRideId);
      setError('You already have an active ride. Please complete or cancel it first.');
      showNotification('⚠️ Active Ride', 'You already have an active ride');
      return;
    }

    if (!pickup || !dropoff) {
      console.log('❌ Missing pickup or dropoff');
      setError('Please select both pickup and dropoff locations');
      return;
    }

    if (!user) {
      console.log('❌ User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    setError(null);
    console.log('✅ All checks passed. Attempting to request ride...');

    try {
      console.log('📤 Sending GraphQL mutation...');
      const result = await requestRide({
        variables: {
          input: {
            pickupAddress: pickupAddress || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`,
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropoffAddress: dropoffAddress || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`,
            dropoffLat: dropoff.lat,
            dropoffLng: dropoff.lng,
            fare: fare ? parseFloat(fare) : 5000.00,
            distance: route ? parseFloat(route.distanceKm) : 1.0,
            duration: route ? route.durationMin : 10,
            paymentMethod: 'CASH',
            vehicleType: 'Standard'
          }
        }
      });

      console.log('✅ Ride request mutation completed:', result);

      if (result.data?.requestRide) {
        const rideData = result.data.requestRide;
        console.log('🎉 New ride created:', rideData.id, 'Status:', rideData.status);

        setActiveRideId(rideData.id);
        setLocalRideData(rideData);
        setRideValidated(true);
        setRideMissingCount(0);
        localStorage.setItem('activeRideId', rideData.id);

        startPolling(5000);
        setBottomSheetOpen(true);

        // Trigger myRides refetch to sync
        refetchMyRides();
      } else {
        console.error('❌ No requestRide data in result:', result);
        setError('Ride request failed - no data returned');
      }
    } catch (err) {
      console.error('Error requesting ride:', err);
      const errorMessage = err.graphQLErrors?.[0]?.message || err.networkError?.message || err.message || 'Failed to request ride';
      setError(errorMessage);
    }
  };

  const handleCancelRide = async () => {
    if (activeRideId) {
      try {
        await cancelRide({
          variables: { rideId: activeRideId, reason: 'Cancelled by user' }
        });
      } catch (err) {
        console.error('Error cancelling ride:', err);
        // Continue with local cleanup even if API call fails
      }
    }
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

  const handleClearStuckRide = () => {
    console.log('🧹 Clearing stuck active ride:', activeRideId);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeRideId');
    }
    setActiveRideId(null);
    setLocalRideData(null);
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
    showNotification('🧹 Cleared', 'Active ride has been cleared. You can now book a new ride.');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const ride = rideData?.ride || localRideData; // Use local data as fallback for mock Firestore
  const arrivalConfirmationVisible = ride?.status === 'ARRIVED_AT_DROPOFF';

  // Debug logging
  useEffect(() => {
    console.log('🔍 State update - activeRideId:', activeRideId);
    console.log('🔍 State update - rideData:', rideData);
    console.log('🔍 State update - ride:', ride);
  }, [activeRideId, rideData, ride]);

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
      {/* Menu Button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 left-4 z-20 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl">
            <div className="p-6 bg-black text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</span>
              </div>
              <h2 className="text-xl font-bold">{user.displayName || 'User'}</h2>
              <p className="text-white/70 text-sm">{user.email}</p>
            </div>
            <nav className="py-4">
              <Link
                href="/"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-2xl">🏠</span>
                <span className="font-medium">Home</span>
              </Link>
              <Link
                href="/rides"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-2xl">🚗</span>
                <span className="font-medium">My Rides</span>
              </Link>
              <Link
                href="/payment"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-2xl">💳</span>
                <span className="font-medium">Payment</span>
              </Link>
              <Link
                href="/promotions"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-2xl">🎁</span>
                <span className="font-medium">Promotions</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-2xl">⚙️</span>
                <span className="font-medium">Settings</span>
              </Link>
              <Link
                href="/help"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-2xl">❓</span>
                <span className="font-medium">Help</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 w-full text-left text-red-600"
              >
                <span className="text-2xl">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Full screen map */}
      <div className="absolute inset-0">
        <DeliverMiMap
          orders={[]}
          pickup={pickup}
          dropoff={dropoff}
          riderLocation={riderLocation}
          route={route}
          rideStatus={ride?.status}
          onClick={handleMapClick}
        />
      </div>

      {/* Bottom Sheet - Anchored for visibility */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out ${bottomSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-120px)]'
          }`}
        style={{
          maxHeight: '85vh',
          minHeight: arrivalConfirmationVisible ? '180px' : (activeRideId ? '300px' : '400px'),
          paddingBottom: '20px'
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing sticky top-0 bg-white rounded-t-3xl z-10"
          onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {activeRideId && ride ? (
            <ActiveRideView
              ride={ride}
              riderLocation={riderLocation}
              onCancel={handleCancelRide}
              onBookAnotherRide={handleBookAnotherRide}
              showRating={!showRatingModal && riderToRate !== null}
              onRateRider={() => setShowRatingModal(true)}
            />
          ) : activeRideId && !ride ? (
            // Active ride ID exists but no ride data - likely stuck
            <div className="py-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Stuck Ride Detected</h2>
              <p className="text-gray-600 mb-6">
                You have an active ride ID but no ride data is loading. This may happen if the ride was completed elsewhere or there's a sync issue.
              </p>
              <button
                onClick={handleClearStuckRide}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Clear Stuck Ride & Start Fresh
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Active Ride ID: {activeRideId}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">Where to?</h1>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs text-gray-500 font-medium">Pickup Location</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (riderLocation) {
                            setPickup(riderLocation);
                            setPickupAddress('Current Location');
                            setMode('dropoff');
                            setRoute(null);
                          }
                        }}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium"
                        title="Use your current location as pickup"
                      >
                        📍 Use Current
                      </button>
                      {pickup && (
                        <button
                          onClick={() => {
                            setPickup(null);
                            setPickupAddress('');
                            setMode('pickup');
                            setRoute(null);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                  <AddressSearch
                    value={pickupAddress}
                    onChange={(address) => setPickupAddress(address)}
                    onSelect={(location) => {
                      setPickup(location);
                      setPickupAddress(location.address);
                      setMode('dropoff');
                      setRoute(null);
                    }}
                    onFocus={() => setMode('pickup')}
                    placeholder="Search pickup address or tap map"
                  />
                  {pickup && !pickupAddress && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">
                      {loadingAddress ? 'Loading address...' : `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs text-gray-500 font-medium">Dropoff Location</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (riderLocation) {
                            setDropoff(riderLocation);
                            setDropoffAddress('Current Location');
                            setRoute(null);
                          }
                        }}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium"
                        title="Use your current location as dropoff"
                      >
                        📍 Use Current
                      </button>
                      {dropoff && (
                        <button
                          onClick={() => {
                            setDropoff(null);
                            setDropoffAddress('');
                            setMode('dropoff');
                            setRoute(null);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                  <AddressSearch
                    value={dropoffAddress}
                    onChange={(address) => setDropoffAddress(address)}
                    onSelect={(location) => {
                      setDropoff(location);
                      setDropoffAddress(location.address);
                      setRoute(null);
                    }}
                    onFocus={() => setMode('dropoff')}
                    placeholder="Search dropoff address or tap map"
                  />
                  {dropoff && !dropoffAddress && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">
                      {loadingAddress ? 'Loading address...' : `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`}
                    </p>
                  )}
                </div>

                {/* Route Info */}
                {route && fare && (
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ BUTTON CLICK EVENT FIRED!');
                    handleRequestRide();
                  }}
                  disabled={!pickup || !dropoff || requesting || !fare}
                  className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shadow-lg"
                  title={!pickup ? 'Select pickup location' : !dropoff ? 'Select dropoff location' : !fare ? 'Calculating fare...' : 'Click to request'}
                >
                  {requesting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Requesting Dispatch...
                    </span>
                  ) : fare ? (
                    `Request Dispatch - ₦${parseFloat(fare).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    'Calculating fare...'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Customer Delivery Confirmation */}
      {(() => {
        const ride = rideData?.ride || localRideData;
        console.log('🔍 Checking CustomerDeliveryConfirmation conditions:', {
          activeRideId,
          hasRideData: !!ride,
          rideStatus: ride?.status,
          rideId: ride?.id || ride?.rideId,
          shouldShow: activeRideId && ride
        });
        return activeRideId && ride ? (
          <CustomerDeliveryConfirmation
            activeRide={ride}
            onProvideCode={async (code) => {
              try {
                console.log('💾 Saving customer confirmation code:', code);
                await setDeliveryCode({
                  variables: {
                    rideId: ride.rideId || ride.id,
                    code: code
                  }
                });
                console.log('✅ Delivery code saved successfully');
                showNotification('✅ Code Saved', `Give code ${code} to your rider to complete delivery`);
              } catch (error) {
                console.error('❌ Failed to save delivery code:', error);
                showNotification('❌ Error', 'Failed to save code. Please try again.');
              }
            }}
            isLoading={false}
          />
        ) : null;
      })()}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRiderToRate(null);
        }}
        onSubmit={handleSubmitRating}
        riderId={riderToRate?.id}
        riderName={riderToRate?.name}
      />
    </div>
  );
}
