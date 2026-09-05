import { create } from 'zustand';
import { Activity, GPSPoint, SportType, WorkoutStatus } from '../types/models';
import { locationService } from '../lib/location/locationService';
import {
  haversineDistance,
  speedToPace,
  calculateElevationGain,
  calculateCalories,
} from '../lib/location/locationUtils';
import { activityService } from '../features/activities/activityService';
import { useLifeOsStore } from './useLifeOsStore';
import { generateId } from '../lib/utils';

export type GpsSignalStatus = 'connected' | 'searching' | 'weak' | 'paused' | 'simulated' | 'error';

interface WorkoutState {
  status: WorkoutStatus;
  sportType: SportType;
  title: string;
  startedAt: string | null;
  elapsedSeconds: number;
  movingSeconds: number;
  distanceMeters: number;
  currentSpeedMps: number;
  maxSpeedMps: number;
  currentPaceDisplay: string;
  avgPaceDisplay: string;
  elevationGainMeters: number;
  calories: number;
  gpsStatus: GpsSignalStatus;
  errorMessage: string | null;
  routePoints: GPSPoint[];
  activeActivityId: string | null;
  userId: string | null;
  isSimulated: boolean;

  // Actions
  startWorkout: (userId: string, sportType?: SportType, title?: string) => Promise<boolean>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: (notes?: string) => Promise<{ success: boolean; activity?: Activity; error?: string }>;
  discardWorkout: () => Promise<void>;
  setSportType: (sport: SportType) => void;
  toggleSimulationMode: () => void;
}

let timerInterval: any = null;

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  status: 'idle',
  sportType: 'running',
  title: 'Outdoor Run',
  startedAt: null,
  elapsedSeconds: 0,
  movingSeconds: 0,
  distanceMeters: 0,
  currentSpeedMps: 0,
  maxSpeedMps: 0,
  currentPaceDisplay: '--:--',
  avgPaceDisplay: '--:--',
  elevationGainMeters: 0,
  calories: 0,
  gpsStatus: 'searching',
  errorMessage: null,
  routePoints: [],
  activeActivityId: null,
  userId: null,
  isSimulated: false,

  setSportType: (sport: SportType) => {
    if (get().status === 'idle') {
      const defaultTitle =
        sport === 'running'
          ? 'Outdoor Run'
          : sport === 'cycling'
          ? 'Road Cycling'
          : sport === 'walking'
          ? 'Brisk Walk'
          : sport === 'hiking'
          ? 'Trail Hike'
          : 'Workout Session';

      set({ sportType: sport, title: defaultTitle });
    }
  },

  toggleSimulationMode: () => {
    const current = get().isSimulated;
    set({ isSimulated: !current });
  },

  startWorkout: async (userId: string, sportType?: SportType, title?: string) => {
    // Clear any leftover interval
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const chosenSport = sportType || get().sportType;
    const defaultTitle =
      title ||
      (chosenSport === 'running'
        ? 'Outdoor Run'
        : chosenSport === 'cycling'
        ? 'Road Cycling'
        : chosenSport === 'walking'
        ? 'Brisk Walk'
        : 'Workout Session');

    const startedAt = new Date().toISOString();
    const tempId = generateId('act');

    set({
      status: 'active',
      sportType: chosenSport,
      title: defaultTitle,
      startedAt,
      elapsedSeconds: 0,
      movingSeconds: 0,
      distanceMeters: 0,
      currentSpeedMps: 0,
      maxSpeedMps: 0,
      currentPaceDisplay: '--:--',
      avgPaceDisplay: '--:--',
      elevationGainMeters: 0,
      calories: 0,
      gpsStatus: 'searching',
      errorMessage: null,
      routePoints: [],
      activeActivityId: tempId,
      userId,
    });

    // 1. Start live 1-second elapsed timer
    timerInterval = setInterval(() => {
      const state = get();
      if (state.status === 'active') {
        const nextElapsed = state.elapsedSeconds + 1;
        // If moving faster than 0.5 m/s, increment moving time
        const nextMoving =
          state.currentSpeedMps > 0.5 ? state.movingSeconds + 1 : state.movingSeconds;

        // Recalculate average pace
        const avgSpeed = nextMoving > 0 ? state.distanceMeters / nextMoving : 0;
        const avgPace = speedToPace(avgSpeed, state.sportType).display;

        // Recalculate calories
        const cals = calculateCalories(state.sportType, nextElapsed, state.distanceMeters);

        set({
          elapsedSeconds: nextElapsed,
          movingSeconds: nextMoving,
          avgPaceDisplay: avgPace,
          calories: cals,
        });
      }
    }, 1000);

    // 2. Asynchronously create activity record in Supabase
    activityService
      .createActivity(userId, {
        title: defaultTitle,
        sportType: chosenSport,
        startedAt,
        status: 'active',
      })
      .then((res) => {
        if (res.data?.id) {
          set({ activeActivityId: res.data.id });
        }
      })
      .catch((err) => {
        console.warn('Could not initialize activity in cloud:', err);
      });

    // 3. Start GPS tracking via LocationService
    const onLocation = (point: GPSPoint) => {
      const state = get();
      if (state.status !== 'active') return;

      const prevPoints = state.routePoints;
      const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : null;

      let addedDistance = 0;
      if (lastPoint) {
        addedDistance = haversineDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          point.latitude,
          point.longitude
        );
      }

      const totalDistance = state.distanceMeters + addedDistance;
      const speed = point.speed !== null && point.speed !== undefined && point.speed >= 0 ? point.speed : 0;
      const maxSpeed = Math.max(state.maxSpeedMps, speed);

      // Instantaneous pace
      const paceDisplay = speedToPace(speed, state.sportType).display;

      // Cumulative elevation
      const allAltitudes = [...prevPoints.map((p) => p.altitude), point.altitude];
      const elevationGain = calculateElevationGain(allAltitudes);

      // Update route points (capped at 1000 in memory for smooth rendering)
      const updatedRoute =
        prevPoints.length > 1000
          ? [...prevPoints.slice(prevPoints.length - 900), point]
          : [...prevPoints, point];

      set({
        distanceMeters: Math.round(totalDistance * 10) / 10,
        currentSpeedMps: speed,
        maxSpeedMps: maxSpeed,
        currentPaceDisplay: paceDisplay,
        elevationGainMeters: elevationGain,
        routePoints: updatedRoute,
        gpsStatus: locationService.getIsSimulated() ? 'simulated' : 'connected',
      });
    };

    const onError = (errMsg: string) => {
      set({
        gpsStatus: 'error',
        errorMessage: errMsg,
      });
    };

    const trackingStarted = await locationService.startTracking(
      onLocation,
      onError,
      chosenSport,
      get().isSimulated
    );

    if (locationService.getIsSimulated()) {
      set({ gpsStatus: 'simulated' });
    }

    return trackingStarted;
  },

  pauseWorkout: () => {
    set({ status: 'paused', gpsStatus: 'paused' });
    locationService.stopTracking();
  },

  resumeWorkout: () => {
    set({ status: 'active', gpsStatus: 'searching' });
    const { sportType, isSimulated } = get();

    locationService.startTracking(
      (point) => {
        const state = get();
        if (state.status !== 'active') return;

        const prevPoints = state.routePoints;
        const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : null;

        let addedDistance = 0;
        if (lastPoint) {
          addedDistance = haversineDistance(
            lastPoint.latitude,
            lastPoint.longitude,
            point.latitude,
            point.longitude
          );
        }

        const totalDistance = state.distanceMeters + addedDistance;
        const speed = point.speed !== null && point.speed !== undefined && point.speed >= 0 ? point.speed : 0;
        const maxSpeed = Math.max(state.maxSpeedMps, speed);
        const paceDisplay = speedToPace(speed, state.sportType).display;

        const allAltitudes = [...prevPoints.map((p) => p.altitude), point.altitude];
        const elevationGain = calculateElevationGain(allAltitudes);

        set({
          distanceMeters: Math.round(totalDistance * 10) / 10,
          currentSpeedMps: speed,
          maxSpeedMps: maxSpeed,
          currentPaceDisplay: paceDisplay,
          elevationGainMeters: elevationGain,
          routePoints: [...prevPoints, point],
          gpsStatus: locationService.getIsSimulated() ? 'simulated' : 'connected',
        });
      },
      (err) => {
        set({ gpsStatus: 'error', errorMessage: err });
      },
      sportType,
      isSimulated
    );
  },

  finishWorkout: async (notes?: string) => {
    // 1. Stop timer and tracking
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    locationService.stopTracking();

    const state = get();
    const finalCompletedAt = new Date().toISOString();
    const avgSpeed = state.movingSeconds > 0 ? state.distanceMeters / state.movingSeconds : 0;

    const completedActivity: Activity = {
      id: state.activeActivityId || generateId('act'),
      userId: state.userId || 'guest-user',
      title: state.title,
      sportType: state.sportType,
      distanceMeters: state.distanceMeters,
      durationSeconds: state.elapsedSeconds,
      movingTimeSeconds: state.movingSeconds,
      avgSpeedMps: avgSpeed,
      maxSpeedMps: state.maxSpeedMps,
      calories: state.calories,
      elevationGainMeters: state.elevationGainMeters,
      startedAt: state.startedAt || finalCompletedAt,
      completedAt: finalCompletedAt,
      notes,
      status: 'completed',
      pointsCount: state.routePoints.length,
    };

    // 2. Persist activity in Supabase
    if (state.activeActivityId) {
      activityService.completeActivity(state.activeActivityId, {
        distanceMeters: state.distanceMeters,
        durationSeconds: state.elapsedSeconds,
        movingTimeSeconds: state.movingSeconds,
        avgSpeedMps: avgSpeed,
        maxSpeedMps: state.maxSpeedMps,
        calories: state.calories,
        elevationGainMeters: state.elevationGainMeters,
        completedAt: finalCompletedAt,
        notes,
      });

      // 3. Batch persist recorded GPS breadcrumbs
      if (state.routePoints.length > 0 && state.userId) {
        activityService.saveActivityPoints({
          activityId: state.activeActivityId,
          userId: state.userId,
          points: state.routePoints.map((pt) => ({
            latitude: pt.latitude,
            longitude: pt.longitude,
            altitude: pt.altitude,
            speed: pt.speed,
            timestamp: new Date(pt.timestamp).toISOString(),
          })),
        });
      }
    }

    // 4. Update the global Life OS store so dashboard immediately shows new workout
    useLifeOsStore.getState().addActivity(completedActivity);

    // 5. Reset workout state to completed
    set({
      status: 'completed',
      gpsStatus: 'paused',
    });

    return { success: true, activity: completedActivity };
  },

  discardWorkout: async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    locationService.stopTracking();

    const activityId = get().activeActivityId;
    if (activityId) {
      activityService.deleteActivity(activityId);
    }

    set({
      status: 'idle',
      elapsedSeconds: 0,
      movingSeconds: 0,
      distanceMeters: 0,
      currentSpeedMps: 0,
      maxSpeedMps: 0,
      currentPaceDisplay: '--:--',
      avgPaceDisplay: '--:--',
      elevationGainMeters: 0,
      calories: 0,
      routePoints: [],
      activeActivityId: null,
      gpsStatus: 'searching',
      errorMessage: null,
    });
  },
}));
