// Utility functions ported from Python Calculations.py

export interface Coordinate {
  lat: number;
  lon: number;
}

/**
 * Calculates the bearing between two points.
 * Based on https://gist.github.com/jeromer/2005586
 */
export function calculateInitialCompassBearing(
  pointA: [number, number],
  pointB: [number, number]
): number {
  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);
  const diffLong = toRadians(pointB[1] - pointA[1]);

  const x = Math.sin(diffLong) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(diffLong);

  const initialBearing = Math.atan2(x, y);
  const compassBearing = (toDegrees(initialBearing) + 360) % 360;

  return compassBearing;
}

/**
 * Calculate distance between two points using Haversine formula
 * Author: Wayne Dyck
 */
export function distance(
  origin: [number, number],
  destination: [number, number]
): number {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;
  const radius = 6371; // km

  const dlat = toRadians(lat2 - lat1);
  const dlon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dlon / 2) *
      Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = radius * c;

  return d;
}

/**
 * Calculate pitch angle to look at an object at a given height
 */
export function calculatePitch(
  centerCoord: [number, number],
  currentCoord: [number, number],
  height: number
): number {
  const d = distance(centerCoord, currentCoord);
  return toDegrees(Math.atan(height / d));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate a destination point given distance and bearing from a start point
 * Uses Haversine formula to calculate point along a great circle
 */
export function calculateDestinationPoint(
  point: [number, number],
  bearing: number,
  distanceKm: number
): [number, number] {
  const radius = 6371; // Earth's radius in km
  const lat1 = toRadians(point[0]);
  const lon1 = toRadians(point[1]);
  const bearingRad = toRadians(bearing);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceKm / radius) +
    Math.cos(lat1) * Math.sin(distanceKm / radius) * Math.cos(bearingRad)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distanceKm / radius) * Math.cos(lat1),
    Math.cos(distanceKm / radius) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [toDegrees(lat2), toDegrees(lon2)];
}

/**
 * Generate evenly spaced points along a route path
 * @param routeCoords - The full route coordinates
 * @param targetSpacingMeters - Target spacing between points in meters (default 50m)
 * @returns Array of evenly spaced coordinates with their bearings
 */
export function generateEvenlySpacedPoints(
  routeCoords: [number, number][],
  targetSpacingMeters: number = 20
): Array<{ coord: [number, number]; bearing: number }> {
  if (routeCoords.length < 2) return [];

  const targetSpacingKm = targetSpacingMeters / 1000;
  const result: Array<{ coord: [number, number]; bearing: number }> = [];

  let accumulatedDistance = 0;
  let currentSegmentIndex = 0;
  let distanceIntoSegment = 0;

  // Calculate total route distance and segment lengths
  const segmentLengths: number[] = [];
  let totalDistance = 0;
  
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const segmentLength = distance(routeCoords[i], routeCoords[i + 1]);
    segmentLengths.push(segmentLength);
    totalDistance += segmentLength;
  }

  // Add first point
  const firstBearing = calculateInitialCompassBearing(routeCoords[0], routeCoords[1]);
  result.push({
    coord: routeCoords[0],
    bearing: firstBearing,
  });

  // Generate points at regular intervals
  let nextPointDistance = targetSpacingKm;

  while (nextPointDistance < totalDistance && currentSegmentIndex < routeCoords.length - 1) {
    const segmentLength = segmentLengths[currentSegmentIndex];
    const remainingInSegment = segmentLength - distanceIntoSegment;

    if (nextPointDistance - accumulatedDistance <= remainingInSegment) {
      // Point is in current segment
      const distanceAlongSegment = distanceIntoSegment + (nextPointDistance - accumulatedDistance);

      const segmentStart = routeCoords[currentSegmentIndex];
      const segmentEnd = routeCoords[currentSegmentIndex + 1];
      
      // Calculate bearing for this segment
      const bearing = calculateInitialCompassBearing(segmentStart, segmentEnd);
      
      // Interpolate position along segment
      const interpolatedCoord = calculateDestinationPoint(
        segmentStart,
        bearing,
        distanceAlongSegment
      );

      result.push({
        coord: interpolatedCoord,
        bearing: bearing,
      });

      nextPointDistance += targetSpacingKm;
    } else {
      // Move to next segment
      accumulatedDistance += remainingInSegment;
      distanceIntoSegment = 0;
      currentSegmentIndex++;
    }
  }

  return result;
}

/**
 * Generate a random coordinate within a bounding box
 */
export function generateRandomCoordinate(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number
): [number, number] {
  const lat = minLat + Math.random() * (maxLat - minLat);
  const lon = minLon + Math.random() * (maxLon - minLon);
  return [lat, lon];
}

/**
 * Generate random routes within a city's boundaries
 * Routes are constrained to be between 1km and 2km in straight-line distance
 * @param bounds - City bounding box
 * @param numRoutes - Number of routes to generate (default 5)
 * @returns Array of route origins and destinations
 */
export function generateRandomRoutes(
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  numRoutes: number = 5
): Array<{ origin: [number, number]; destination: [number, number]; id: string }> {
  const routes: Array<{ origin: [number, number]; destination: [number, number]; id: string }> = [];
  const MIN_DISTANCE_KM = 1;
  const MAX_DISTANCE_KM = 2;
  const MAX_ATTEMPTS = 50; // Prevent infinite loops

  for (let i = 0; i < numRoutes; i++) {
    let origin: [number, number];
    let destination: [number, number];
    let routeDistance: number;
    let attempts = 0;

    // Keep generating until we get a route within our distance constraints
    do {
      origin = generateRandomCoordinate(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      destination = generateRandomCoordinate(bounds.minLat, bounds.maxLat, bounds.minLon, bounds.maxLon);
      routeDistance = distance(origin, destination);
      attempts++;

      // If we can't find a valid route after many attempts, accept what we have
      if (attempts >= MAX_ATTEMPTS) {
        console.warn(`Route ${i + 1}: Could not find route within distance constraints after ${MAX_ATTEMPTS} attempts. Using distance: ${routeDistance.toFixed(2)}km`);
        break;
      }
    } while (routeDistance < MIN_DISTANCE_KM || routeDistance > MAX_DISTANCE_KM);

    console.log(`Route ${i + 1}: Generated ${routeDistance.toFixed(2)}km route`);
    
    routes.push({
      origin,
      destination,
      id: `route-${i + 1}`,
    });
  }

  return routes;
}
