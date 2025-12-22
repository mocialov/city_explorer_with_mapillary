// Polyline decoding for OSRM route geometry
// Based on https://github.com/mapbox/polyline

export function decode(str: string, precision: number = 5): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  let shift = 0;
  let result = 0;
  let byte = null;
  let latitudeChange;
  let longitudeChange;
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitudeChange = result & 1 ? ~(result >> 1) : result >> 1;

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitudeChange = result & 1 ? ~(result >> 1) : result >> 1;

    lat += latitudeChange;
    lng += longitudeChange;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}
