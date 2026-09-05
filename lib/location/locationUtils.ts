import { SportType, GPSPoint } from '../../types/models';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates geodesic distance between two coordinate pairs using the Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Validate inputs
  if (
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2) ||
    lat1 < -90 ||
    lat1 > 90 ||
    lat2 < -90 ||
    lat2 > 90 ||
    lon1 < -180 ||
    lon1 > 180 ||
    lon2 < -180 ||
    lon2 > 180
  ) {
    return 0;
  }

  // Identical coordinates check
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Converts speed in meters per second to human pace (min/km) or speed (km/h for cycling).
 */
export function speedToPace(
  speedMps: number,
  sportType: SportType = 'running'
): {
  display: string;
  unit: string;
  rawPaceSeconds: number;
} {
  if (isNaN(speedMps) || speedMps <= 0.2) {
    return {
      display: sportType === 'cycling' ? '0.0' : '--:--',
      unit: sportType === 'cycling' ? 'km/h' : '/km',
      rawPaceSeconds: 0,
    };
  }

  if (sportType === 'cycling') {
    const kmh = speedMps * 3.6;
    return {
      display: kmh.toFixed(1),
      unit: 'km/h',
      rawPaceSeconds: 0,
    };
  }

  // Min/km for running, walking, hiking
  const paceSecondsPerKm = 1000 / speedMps;

  // Cap absurdly slow or fast pace
  if (paceSecondsPerKm > 3600) {
    return { display: '--:--', unit: '/km', rawPaceSeconds: 3600 };
  }

  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.floor(paceSecondsPerKm % 60);

  return {
    display: `${mins}:${String(secs).padStart(2, '0')}`,
    unit: '/km',
    rawPaceSeconds: Math.round(paceSecondsPerKm),
  };
}

/**
 * Calculates cumulative elevation gain in meters.
 * Filters out minor GPS altitude fluctuations (< 1.5m).
 */
export function calculateElevationGain(altitudes: (number | null | undefined)[]): number {
  let totalGain = 0;
  let previousValidAlt: number | null = null;

  for (const alt of altitudes) {
    if (alt === null || alt === undefined || isNaN(alt)) continue;

    if (previousValidAlt !== null) {
      const diff = alt - previousValidAlt;
      // Filter out high-frequency barometric/GPS jitter
      if (diff >= 1.5 && diff < 300) {
        totalGain += diff;
        previousValidAlt = alt;
      } else if (diff <= -1.5) {
        previousValidAlt = alt;
      }
    } else {
      previousValidAlt = alt;
    }
  }

  return Math.round(totalGain);
}

/**
 * Rejects invalid, duplicate, or impossible teleporting GPS points.
 */
export function filterGpsPoint(
  newPoint: GPSPoint,
  previousPoint: GPSPoint | null,
  sportType: SportType = 'running'
): { isValid: boolean; reason?: string } {
  // 1. Basic coordinate validation
  if (
    isNaN(newPoint.latitude) ||
    isNaN(newPoint.longitude) ||
    newPoint.latitude < -90 ||
    newPoint.latitude > 90 ||
    newPoint.longitude < -180 ||
    newPoint.longitude > 180 ||
    (newPoint.latitude === 0 && newPoint.longitude === 0)
  ) {
    return { isValid: false, reason: 'Invalid or null coordinates' };
  }

  // 2. Accuracy check (reject poor accuracy readings > 35m)
  if (newPoint.accuracy !== null && newPoint.accuracy !== undefined && newPoint.accuracy > 35) {
    return { isValid: false, reason: 'Low GPS accuracy' };
  }

  if (!previousPoint) {
    return { isValid: true };
  }

  // 3. Time difference check
  const timeDeltaSec = (newPoint.timestamp - previousPoint.timestamp) / 1000;
  if (timeDeltaSec <= 0.1) {
    return { isValid: false, reason: 'Duplicate point or timestamp out of sequence' };
  }

  // 4. Distance and speed check
  const distMeters = haversineDistance(
    previousPoint.latitude,
    previousPoint.longitude,
    newPoint.latitude,
    newPoint.longitude
  );

  // If moved less than 0.5m in sub-second, consider stationary jitter
  if (distMeters < 0.5 && timeDeltaSec < 1) {
    return { isValid: false, reason: 'Stationary jitter' };
  }

  const speedMps = distMeters / timeDeltaSec;
  const speedKmh = speedMps * 3.6;

  // Max realistic threshold per sport
  const maxAllowedKmh = sportType === 'cycling' ? 120 : 60;
  if (speedKmh > maxAllowedKmh) {
    return { isValid: false, reason: `Implausible speed spike: ${speedKmh.toFixed(1)} km/h` };
  }

  return { isValid: true };
}

/**
 * Calculates estimated energy expenditure using Metabolic Equivalent of Task (MET).
 */
export function calculateCalories(
  sportType: SportType,
  durationSeconds: number,
  distanceMeters: number,
  weightKg: number = 72
): number {
  if (durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;

  let met = 7.0;
  switch (sportType) {
    case 'running': {
      const kmh = (distanceMeters / 1000) / hours;
      met = kmh > 12 ? 11.5 : kmh > 10 ? 10.0 : 8.5;
      break;
    }
    case 'cycling': {
      const kmh = (distanceMeters / 1000) / hours;
      met = kmh > 25 ? 10.0 : kmh > 20 ? 8.0 : 6.0;
      break;
    }
    case 'walking':
      met = 3.8;
      break;
    case 'hiking':
      met = 6.0;
      break;
    case 'swimming':
      met = 8.0;
      break;
    default:
      met = 5.5;
      break;
  }

  // Calories = MET * weight(kg) * duration(hours)
  return Math.round(met * weightKg * hours);
}

export interface SvgProjection {
  pathD: string;
  startPoint: { x: number; y: number } | null;
  endPoint: { x: number; y: number } | null;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

/**
 * Projects an array of GPS coordinates onto a 2D SVG canvas.
 * Preserves geographic aspect ratio with padding.
 */
export function projectCoordinatesToSvg(
  points: { latitude: number; longitude: number }[],
  width: number = 320,
  height: number = 180,
  padding: number = 20
): SvgProjection {
  if (!points || points.length < 2) {
    return {
      pathD: '',
      startPoint: null,
      endPoint: null,
      bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 },
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const pt of points) {
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
    if (pt.longitude < minLon) minLon = pt.longitude;
    if (pt.longitude > maxLon) maxLon = pt.longitude;
  }

  // Avoid divide-by-zero for flat routes
  const latDelta = Math.max(maxLat - minLat, 0.0001);
  const lonDelta = Math.max(maxLon - minLon, 0.0001);

  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  // Mercator latitude cosine scale factor
  const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lonToLatRatio = Math.cos(avgLatRad);

  const scaleX = drawWidth / (lonDelta * lonToLatRatio);
  const scaleY = drawHeight / latDelta;
  const uniformScale = Math.min(scaleX, scaleY);

  const toSvgX = (lon: number) =>
    padding +
    (width - padding * 2 - lonDelta * lonToLatRatio * uniformScale) / 2 +
    (lon - minLon) * lonToLatRatio * uniformScale;

  const toSvgY = (lat: number) =>
    padding +
    (height - padding * 2 - latDelta * uniformScale) / 2 +
    (maxLat - lat) * uniformScale;

  let pathD = '';
  let startPoint: { x: number; y: number } | null = null;
  let endPoint: { x: number; y: number } | null = null;

  for (let i = 0; i < points.length; i++) {
    const x = Math.round(toSvgX(points[i].longitude) * 10) / 10;
    const y = Math.round(toSvgY(points[i].latitude) * 10) / 10;

    if (i === 0) {
      pathD += `M ${x} ${y}`;
      startPoint = { x, y };
    } else {
      pathD += ` L ${x} ${y}`;
    }

    if (i === points.length - 1) {
      endPoint = { x, y };
    }
  }

  return {
    pathD,
    startPoint,
    endPoint,
    bounds: { minLat, maxLat, minLon, maxLon },
  };
}
