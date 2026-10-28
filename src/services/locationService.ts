import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthStore } from './authStore';

export interface LocationSearchResult {
  title: string;
  subtitle: string;
  fullAddress: string;
  coords: [number, number]; // [lng, lat]
}

export const requestDeviceLocation = async (): Promise<{
  success: boolean;
  coords?: [number, number]; // [lng, lat]
  address?: string;
  error?: string;
}> => {
  try {
    // 1. Request foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. Please enable location permissions in your settings.',
      };
    }

    // 2. Get high accuracy GPS coordinates
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    let readableAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // 3. Reverse geocode to get human readable address
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const parts = [
          place.name || place.street,
          place.district || place.subregion,
          place.city,
        ].filter(Boolean);
        if (parts.length > 0) {
          readableAddress = parts.join(', ');
        }
      }
    } catch (geoErr) {
      console.warn('Reverse geocoding fallback:', geoErr);
    }

    // 4. Update auth store with the live coordinates & address
    const coords: [number, number] = [lng, lat];
    await useAuthStore.getState().updateLocation(coords, readableAddress);

    return {
      success: true,
      coords,
      address: readableAddress,
    };
  } catch (err: any) {
    console.error('Error fetching GPS location:', err);
    return {
      success: false,
      error: err.message || 'Failed to retrieve GPS location.',
    };
  }
};

/**
 * Search any address / locality across India and worldwide using OSM Nominatim and Expo Location
 */
export const searchLocationAddresses = async (query: string): Promise<LocationSearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // 1. Try Nominatim OpenStreetMap API for autocomplete suggestions
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=6&addressdetails=1`,
      {
        headers: { 'User-Agent': 'SAMN-Mobile-App/1.0' },
        timeout: 4000,
      }
    );

    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((item: any) => {
        const parts = (item.display_name || '').split(',');
        const title = parts[0]?.trim() || item.name || cleanQuery;
        const subtitle = parts.slice(1, 4).join(', ').trim() || item.display_name;
        const lng = parseFloat(item.lon);
        const lat = parseFloat(item.lat);
        return {
          title,
          subtitle,
          fullAddress: item.display_name || `${title}, ${subtitle}`,
          coords: [lng, lat] as [number, number],
        };
      });
    }
  } catch (err) {
    console.warn('[Nominatim Search Fallback]:', err);
  }

  // 2. Fallback to Expo Location geocodeAsync
  try {
    const geocoded = await Location.geocodeAsync(cleanQuery);
    if (geocoded && geocoded.length > 0) {
      return geocoded.slice(0, 5).map((loc) => ({
        title: cleanQuery,
        subtitle: `Latitude: ${loc.latitude.toFixed(4)}, Longitude: ${loc.longitude.toFixed(4)}`,
        fullAddress: cleanQuery,
        coords: [loc.longitude, loc.latitude] as [number, number],
      }));
    }
  } catch (err) {
    console.warn('[Expo Geocode Fallback]:', err);
  }

  return [];
};

/**
 * Geocode a custom manual address string to get exact coordinates
 */
export const geocodeCustomAddress = async (
  address: string
): Promise<{ coords: [number, number]; formattedAddress: string }> => {
  const cleanAddress = address.trim();
  try {
    const geocoded = await Location.geocodeAsync(cleanAddress);
    if (geocoded && geocoded.length > 0) {
      return {
        coords: [geocoded[0].longitude, geocoded[0].latitude],
        formattedAddress: cleanAddress,
      };
    }
  } catch (e) {}

  // Fallback to central Bangalore coords
  return {
    coords: [77.5946, 12.9716],
    formattedAddress: cleanAddress,
  };
};

/**
 * Reverse geocode [lng, lat] coordinates to human readable address
 */
export const reverseGeocodeCoords = async (
  coords: [number, number]
): Promise<string> => {
  const [lng, lat] = coords;
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'User-Agent': 'SAMN-Mobile-App/1.0' },
        timeout: 4000,
      }
    );
    if (res.data?.display_name) {
      const parts = res.data.display_name.split(',');
      return parts.slice(0, 4).join(', ').trim();
    }
  } catch (err) {
    // ignore and fallback
  }

  try {
    const geocode = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (geocode && geocode.length > 0) {
      const p = geocode[0];
      const parts = [p.name || p.street, p.district || p.subregion, p.city].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
  } catch (e) {}

  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
};

/**
 * Calculate Haversine distance in kilometers between two [lng, lat] coordinate pairs
 */
export const calculateDistanceKm = (
  c1: [number, number],
  c2: [number, number]
): number => {
  if (!c1 || !c2 || c1.length < 2 || c2.length < 2) return 0;
  const [lon1, lat1] = c1;
  const [lon2, lat2] = c2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * Format distance in meters or km
 */
export const formatDistance = (
  c1: [number, number],
  c2: [number, number]
): string => {
  const km = calculateDistanceKm(c1, c2);
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km} km away`;
};
