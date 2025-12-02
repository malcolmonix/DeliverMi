// Mapbox API utilities for geocoding and routing

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat, lng) {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(query) {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features.map(feature => ({
        address: feature.place_name,
        lat: feature.center[1],
        lng: feature.center[0],
        coordinates: feature.center
      }));
    }
    return [];
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Get route between two points
 */
export async function getRoute(start, end) {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full`
    );
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        geometry: route.geometry,
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        distanceKm: (route.distance / 1000).toFixed(2),
        durationMin: Math.round(route.duration / 60)
      };
    }
    return null;
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
}

/**
 * Calculate fare based on distance and duration
 */
export function calculateFare(distanceKm, durationMin) {
  const baseFare = 2.50;
  const perKmRate = 1.20;
  const perMinRate = 0.25;
  const minimumFare = 5.00;
  
  const fare = baseFare + (distanceKm * perKmRate) + (durationMin * perMinRate);
  return Math.max(fare, minimumFare).toFixed(2);
}

