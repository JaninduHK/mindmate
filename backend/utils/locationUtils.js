// utils/locationUtils.js
/**
 * Utilities for location data handling
 * Sanitization, validation, and safe URL generation
 */

/**
 * Validate location coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export const isValidCoordinates = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  
  if (isNaN(latNum) || isNaN(lngNum)) return false;
  
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
};

/**
 * Sanitize coordinates to limit precision
 * Reduces precision to ~11m accuracy (4 decimal places)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {object} Sanitized coordinates or null
 */
export const sanitizeCoordinates = (lat, lng, decimals = 4) => {
  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(parseFloat(lat) * factor) / factor,
    lng: Math.round(parseFloat(lng) * factor) / factor,
  };
};

/**
 * Generate Google Maps URL from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} label - Optional label for marker
 * @returns {string} Maps URL or empty string if invalid
 */
export const generateMapsUrl = (lat, lng, label = 'Emergency Location') => {
  const sanitized = sanitizeCoordinates(lat, lng);
  if (!sanitized) return '';

  const encodedLabel = encodeURIComponent(label);
  return `https://maps.google.com/?q=${sanitized.lat},${sanitized.lng}+%28${encodedLabel}%29&z=16`;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format location for display
 * Returns "Lat, Lng" or custom format
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string}
 */
export const formatLocation = (lat, lng) => {
  const sanitized = sanitizeCoordinates(lat, lng, 4);
  if (!sanitized) return 'Unknown location';
  return `${sanitized.lat.toFixed(4)}, ${sanitized.lng.toFixed(4)}`;
};

/**
 * Log location event without exposing full coordinates
 * Useful for audit logs
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} source - Source of location (gps, manual, network)
 * @returns {object} Redacted location info
 */
export const redactLocationForLogs = (lat, lng, source = 'unknown') => {
  const sanitized = sanitizeCoordinates(lat, lng, 2); // Even lower precision for logs
  if (!sanitized) {
    return { redacted: true, source };
  }
  
  return {
    region: `${sanitized.lat.toFixed(1)}, ${sanitized.lng.toFixed(1)}`,
    source,
    timestamp: new Date().toISOString(),
  };
};
