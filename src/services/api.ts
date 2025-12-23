// API services for geocoding, routing, and Mapillary imagery

import { decode } from '../utils/polyline';

const MAPILLARY_ACCESS_TOKEN = process.env.REACT_APP_MAPILLARY_TOKEN || '';
const OSRM_DIRECTIONS_API = 'https://router.project-osrm.org/route/v1/driving/';
const MAPILLARY_API_BASE = 'https://graph.mapillary.com';

export interface MapillaryImage {
  id: string;
  thumbUrl: string;
  computedCompassAngle?: number;
  geometry: {
    coordinates: [number, number];
  };
}

export interface CityBounds {
  center: [number, number]; // [lat, lon]
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  name: string;
}

/**
 * Get city boundaries and center point
 */
export async function getCityBounds(cityName: string): Promise<CityBounds> {
  const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  const params = new URLSearchParams({
    q: cityName,
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });

  const response = await fetch(`${nominatimUrl}?${params}`, {
    headers: { 'User-Agent': 'ExploreCityApp/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result && result.length > 0) {
    const place = result[0];
    const boundingbox = place.boundingbox; // [minLat, maxLat, minLon, maxLon]
    
    return {
      center: [parseFloat(place.lat), parseFloat(place.lon)],
      boundingBox: {
        minLat: parseFloat(boundingbox[0]),
        maxLat: parseFloat(boundingbox[1]),
        minLon: parseFloat(boundingbox[2]),
        maxLon: parseFloat(boundingbox[3]),
      },
      name: place.display_name,
    };
  } else {
    throw new Error(`Could not find city: ${cityName}`);
  }
}

/**
 * Convert address to lon,lat using Nominatim (OpenStreetMap geocoding)
 */
export async function geocodeAddress(address: string): Promise<string> {
  const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
  });

  const response = await fetch(`${nominatimUrl}?${params}`, {
    headers: { 'User-Agent': 'ExploreCityApp/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result && result.length > 0) {
    // Return in lon,lat format for OSRM
    return `${result[0].lon},${result[0].lat}`;
  } else {
    throw new Error(`Could not geocode address: ${address}`);
  }
}

/**
 * Reverse geocode coordinates to a human-readable address
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'json',
    addressdetails: '1',
  });

  try {
    const response = await fetch(`${nominatimUrl}?${params}`, {
      headers: { 'User-Agent': 'ExploreCityApp/1.0' },
    });

    if (!response.ok) {
      return `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`; // Fallback to coordinates
    }

    const result = await response.json();

    if (result && result.address) {
      // Build a concise address string
      const addr = result.address;
      const parts = [];
      
      if (addr.road) parts.push(addr.road);
      else if (addr.neighbourhood) parts.push(addr.neighbourhood);
      else if (addr.suburb) parts.push(addr.suburb);
      
      if (addr.city) parts.push(addr.city);
      else if (addr.town) parts.push(addr.town);
      else if (addr.village) parts.push(addr.village);
      
      return parts.length > 0 ? parts.join(', ') : result.display_name.split(',').slice(0, 2).join(',');
    }
    
    return `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`; // Fallback to coordinates
  } catch (error) {
    // Silently fallback to coordinates when reverse geocoding fails
    return `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`;
  }
}

/**
 * Get route coordinates between origin and destination using OSRM
 */
export async function getRouteCoordinates(
  origin: string,
  destination: string
): Promise<[number, number][]> {
  const url = `${OSRM_DIRECTIONS_API}${origin};${destination}?overview=full&geometries=polyline`;
  
  console.log('OSRM Request URL:', url);

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OSRM Error Response:', errorText);
    throw new Error(`Route request failed: ${response.statusText}. Please check coordinates format.`);
  }

  const data = await response.json();
  console.log('OSRM Response:', data);

  if (data.code !== 'Ok') {
    throw new Error(`OSRM Error: ${data.message || 'Unknown routing error'}`);
  }

  if (data.routes && data.routes.length > 0) {
    const encodedPolyline = data.routes[0].geometry;
    return decode(encodedPolyline);
  }

  return [];
}

/**
 * Find Mapillary image near the given coordinate with specified heading
 */
export async function getMapillaryImage(
  coord: [number, number],
  heading: number,
  retryCount: number = 0
): Promise<MapillaryImage | null> {
  try {
    const [lat, lon] = coord;

    const url = `${MAPILLARY_API_BASE}/images`;
    const params = new URLSearchParams({
      fields: 'id,computed_compass_angle,geometry,captured_at,is_pano,thumb_2048_url',
      bbox: `${lon - 0.0002},${lat - 0.0002},${lon + 0.0002},${lat + 0.0002}`,
      limit: '50',
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `OAuth ${MAPILLARY_ACCESS_TOKEN}`,
      },
    });
    
    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        return getMapillaryImage(coord, heading, retryCount + 1);
      }
      // After 3 retries, silently return null
      return null;
    }
    
    if (!response.ok) {
      // Silently return null for other errors
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      let bestImage: any = null;
      let bestScore = Infinity;

      for (const image of data.data) {
        // Skip panoramic images or images without thumb URL
        if (image.is_pano || !image.thumb_2048_url) continue;

        // Calculate distance
        let distance = 0.0001;
        if (image.geometry?.coordinates) {
          const [imgLon, imgLat] = image.geometry.coordinates;
          distance = Math.sqrt(
            Math.pow(imgLat - lat, 2) + Math.pow(imgLon - lon, 2)
          );

          // Distance threshold - only accept images within ~20 meters
          if (distance > 0.0002) continue;
        }

        // Calculate heading difference
        if (!image.computed_compass_angle) continue;

        let angleDiff = Math.abs(image.computed_compass_angle - heading);
        if (angleDiff > 180) {
          angleDiff = 360 - angleDiff;
        }

        // Only accept images within 30 degrees of desired heading
        // Stricter filter to avoid opposite direction images on highways
        if (angleDiff > 30) continue;

        // Combined score: prioritize heading match, then distance
        const score = angleDiff * 3 + distance * 10000;

        if (score < bestScore) {
          bestScore = score;
          bestImage = image;
        }
      }

      if (bestImage) {
        return {
          id: bestImage.id,
          thumbUrl: bestImage.thumb_2048_url,
          computedCompassAngle: bestImage.computed_compass_angle,
          geometry: bestImage.geometry,
        };
      }
    }

    return null;
  } catch (error) {
    // Silently return null on fetch errors (network issues, CORS, etc.)
    return null;
  }
}

/**
 * Fetch multiple Mapillary images in parallel with batching to avoid overwhelming the API
 */
export async function getMapillaryImagesBatch(
  points: Array<{ coord: [number, number]; heading: number }>,
  batchSize: number = 10
): Promise<Array<MapillaryImage | null>> {
  const results: Array<MapillaryImage | null> = [];
  
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const batchPromises = batch.map(point => getMapillaryImage(point.coord, point.heading));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Increased delay between batches to avoid rate limiting
    if (i + batchSize < points.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}
