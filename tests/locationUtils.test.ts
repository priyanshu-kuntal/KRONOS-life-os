import {
  haversineDistance,
  speedToPace,
  calculateElevationGain,
  filterGpsPoint,
  calculateCalories,
  projectCoordinatesToSvg,
} from '../lib/location/locationUtils';
import { GPSPoint } from '../types/models';

export function runLocationUtilsTests() {
  console.log('--- Running locationUtils Unit Tests ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  };

  // 1. Distance Tests
  // Same coordinate = 0 distance
  assert(haversineDistance(37.7749, -122.4194, 37.7749, -122.4194) === 0, 'Same coordinate returns 0 distance');

  // Short movement (approx 111 meters for 0.001 deg latitude)
  const shortDist = haversineDistance(37.7749, -122.4194, 37.7759, -122.4194);
  assert(shortDist > 100 && shortDist < 120, `Short distance ~111m (actual: ${shortDist}m)`);

  // Invalid coordinates return 0
  assert(haversineDistance(95, 0, 37, -122) === 0, 'Latitude > 90 returns 0');
  assert(haversineDistance(NaN, 0, 37, -122) === 0, 'NaN coordinate returns 0');

  // 2. Pace Tests
  // 3.33 m/s = 12 km/h = 5:00 min/km
  const runningPace = speedToPace(3.333, 'running');
  assert(runningPace.display === '5:00' && runningPace.unit === '/km', `Speed 3.33m/s is 5:00/km (actual: ${runningPace.display})`);

  // Zero speed returns placeholder
  const zeroPace = speedToPace(0, 'running');
  assert(zeroPace.display === '--:--', 'Zero speed returns --:--');

  // Cycling returns km/h
  const cyclingSpeed = speedToPace(8.333, 'cycling'); // ~30 km/h
  assert(cyclingSpeed.display === '30.0' && cyclingSpeed.unit === 'km/h', `Cycling speed formatted in km/h (actual: ${cyclingSpeed.display})`);

  // 3. Elevation Tests
  const elevationList = [100, 101, 103, 102.5, 106, 104, 110];
  const gain = calculateElevationGain(elevationList);
  assert(gain > 0, `Cumulative elevation gain calculated (gain: ${gain}m)`);

  // Noisy jitter (< 1.5m) is filtered
  const jitterList = [100, 100.4, 100.8, 100.3, 100.9];
  assert(calculateElevationGain(jitterList) === 0, 'Sub-1.5m jitter filtered out');

  // 4. GPS Filtering Tests
  const basePoint: GPSPoint = {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 15,
    timestamp: 1000000,
    accuracy: 5,
  };

  const validNextPoint: GPSPoint = {
    latitude: 37.7750,
    longitude: -122.4194,
    altitude: 15.5,
    timestamp: 1003000, // 3s later
    accuracy: 6,
  };
  assert(filterGpsPoint(validNextPoint, basePoint, 'running').isValid, 'Valid movement point passes filter');

  // Reject inaccurate point (> 35m)
  const inaccuratePoint: GPSPoint = {
    ...validNextPoint,
    accuracy: 55,
  };
  assert(!filterGpsPoint(inaccuratePoint, basePoint, 'running').isValid, 'Inaccurate point (>35m) rejected');

  // Reject impossible speed spike
  const teleportPoint: GPSPoint = {
    latitude: 37.8500, // jumped miles away in 1s
    longitude: -122.4194,
    timestamp: 1001000,
    accuracy: 5,
  };
  assert(!filterGpsPoint(teleportPoint, basePoint, 'running').isValid, 'Impossible speed spike rejected');

  // 5. Calories Tests
  const cals = calculateCalories('running', 1800, 5000, 70); // 30 min 5k run
  assert(cals > 200 && cals < 500, `Calories reasonable for 30m 5k run (actual: ${cals} kcal)`);

  // 6. SVG Projection
  const routePoints = [
    { latitude: 37.7749, longitude: -122.4194 },
    { latitude: 37.7755, longitude: -122.4180 },
    { latitude: 37.7765, longitude: -122.4170 },
  ];
  const svg = projectCoordinatesToSvg(routePoints, 300, 200, 10);
  assert(svg.pathD.startsWith('M ') && svg.pathD.includes(' L '), 'SVG path string successfully generated');
  assert(svg.startPoint !== null && svg.endPoint !== null, 'Start and end pins resolved');

  console.log(`Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed`);
  }
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runLocationUtilsTests();
}
