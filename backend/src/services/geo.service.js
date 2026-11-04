/**
 * Geospatial utility functions for calculating distance and converting coordinates
 */

// Validate coordinates are in valid ranges
const validateCoordinates = (coords) => {
  if (!coords || !Array.isArray(coords) || coords.length < 2) return false;
  const [lng, lat] = coords;
  
  // Check if values are numbers
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  
  // Check if values are in valid ranges
  if (lng < -180 || lng > 180) return false;
  if (lat < -90 || lat > 90) return false;
  
  // Exclude [0, 0] which is Gulf of Guinea, not Bengaluru
  if (lng === 0 && lat === 0) return false;
  
  return true;
};

// Calculate Haversine distance in kilometers between two [lng, lat] pairs
const calculateDistanceKm = (coord1, coord2) => {
  // Validate coordinates before calculation
  if (!validateCoordinates(coord1) || !validateCoordinates(coord2)) {
    return null; // Return null for invalid coordinates
  }
  
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

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
  const distance = R * c;
  
  // Ensure distance is a valid positive number
  if (isNaN(distance) || distance < 0) {
    return null;
  }
  
  return Number(distance.toFixed(2));
};

// Format distance string
const formatDistance = (coord1, coord2) => {
  const km = calculateDistanceKm(coord1, coord2);
  if (km === null || km === undefined) {
    return 'Unknown location';
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km} km away`;
};

module.exports = {
  validateCoordinates,
  calculateDistanceKm,
  formatDistance,
};
