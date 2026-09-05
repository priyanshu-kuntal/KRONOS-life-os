import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { GPSPoint, SportType } from '../../types/models';
import { filterGpsPoint } from './locationUtils';

export type LocationCallback = (point: GPSPoint) => void;
export type ErrorCallback = (error: string) => void;

export interface LocationSubscriptionHandle {
  remove: () => void;
}

class LocationService {
  private subscription: Location.LocationSubscription | null = null;
  private simulationInterval: any = null;
  private lastGpsPoint: GPSPoint | null = null;
  private isTracking: boolean = false;
  private isSimulated: boolean = false;

  /**
   * Requests foreground location permissions from the operating system.
   */
  async requestPermissions(): Promise<{ granted: boolean; status: Location.PermissionStatus }> {
    try {
      if (Platform.OS === 'web') {
        // Web geolocation check
        if ('geolocation' in navigator) {
          return { granted: true, status: Location.PermissionStatus.GRANTED };
        }
        return { granted: false, status: Location.PermissionStatus.DENIED };
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      return { granted: status === Location.PermissionStatus.GRANTED, status };
    } catch (err: any) {
      console.warn('Location permission request failed:', err?.message);
      return { granted: false, status: Location.PermissionStatus.DENIED };
    }
  }

  /**
   * Checks current permission status without prompting.
   */
  async getPermissionStatus(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return 'geolocation' in navigator;
      }
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  }

  /**
   * Gets current location snapshot.
   */
  async getCurrentLocation(): Promise<GPSPoint | null> {
    try {
      const hasPerm = await this.getPermissionStatus();
      if (!hasPerm) {
        const { granted } = await this.requestPermissions();
        if (!granted) return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        speed: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : null,
        heading: loc.coords.heading,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
      };
    } catch (err: any) {
      console.warn('Failed to get current location:', err?.message);
      return null;
    }
  }

  /**
   * Starts real hardware GPS tracking with high accuracy and battery-conscious distance thresholds.
   */
  async startTracking(
    onLocation: LocationCallback,
    onError: ErrorCallback,
    sportType: SportType = 'running',
    useSimulationFallback: boolean = false
  ): Promise<boolean> {
    if (this.isTracking) {
      this.stopTracking();
    }

    const { granted } = await this.requestPermissions();

    if (!granted) {
      if (useSimulationFallback || Platform.OS === 'web') {
        // Fallback to simulated GPS route for sandbox/web demo
        this.startSimulation(onLocation, sportType);
        return true;
      }
      onError('Location permission denied. Enable location services in settings.');
      return false;
    }

    try {
      this.isTracking = true;
      this.isSimulated = false;
      this.lastGpsPoint = null;

      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // 1 second intervals
          distanceInterval: 2, // 2 meters minimum distance delta
        },
        (loc) => {
          const point: GPSPoint = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed !== null && loc.coords.speed >= 0 ? loc.coords.speed : null,
            heading: loc.coords.heading,
            accuracy: loc.coords.accuracy,
            timestamp: loc.timestamp,
          };

          const { isValid } = filterGpsPoint(point, this.lastGpsPoint, sportType);
          if (isValid) {
            this.lastGpsPoint = point;
            onLocation(point);
          }
        }
      );

      return true;
    } catch (err: any) {
      this.isTracking = false;
      if (useSimulationFallback || Platform.OS === 'web') {
        this.startSimulation(onLocation, sportType);
        return true;
      }
      onError(err?.message || 'Failed to start GPS tracking hardware.');
      return false;
    }
  }

  /**
   * Starts simulated movement along a scenic loop (for demo mode / emulator testing).
   */
  startSimulation(onLocation: LocationCallback, sportType: SportType = 'running') {
    this.isTracking = true;
    this.isSimulated = true;
    this.lastGpsPoint = null;

    // Center coordinates (San Francisco Bay Trail loop)
    const baseLat = 37.8024;
    const baseLon = -122.4058;
    let step = 0;
    const radius = 0.004; // ~400 meters radius loop

    // Speed target: ~3.0 m/s (10.8 km/h) for running, ~7.0 m/s for cycling
    const targetSpeedMps = sportType === 'cycling' ? 7.2 : sportType === 'walking' ? 1.4 : 3.1;
    const intervalMs = 1000;

    this.simulationInterval = setInterval(() => {
      const angle = (step * Math.PI) / 60; // Completes loop in ~120 seconds
      // Elliptical route with slight altitude variation
      const lat = baseLat + radius * Math.cos(angle);
      const lon = baseLon + radius * 1.3 * Math.sin(angle);
      const altitude = 15 + Math.sin(angle * 2) * 8; // gentle hill simulation

      const point: GPSPoint = {
        latitude: lat,
        longitude: lon,
        altitude: Math.round(altitude * 10) / 10,
        speed: targetSpeedMps + (Math.sin(step) * 0.3),
        heading: ((angle * 180) / Math.PI + 90) % 360,
        accuracy: 3.5,
        timestamp: Date.now(),
      };

      this.lastGpsPoint = point;
      onLocation(point);
      step++;
    }, intervalMs);
  }

  /**
   * Stops tracking and cleans up native subscriptions or timers.
   */
  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isTracking = false;
    this.isSimulated = false;
    this.lastGpsPoint = null;
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }

  getIsSimulated(): boolean {
    return this.isSimulated;
  }
}

export const locationService = new LocationService();
