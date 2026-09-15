import { SportType, ActivityStatus, Activity, ActivityPoint } from '../../types/models';

export interface CreateActivityInput {
  title: string;
  sportType: SportType;
  startedAt?: string;
  notes?: string;
  status?: ActivityStatus;
}

export interface UpdateActivityInput {
  title?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  movingTimeSeconds?: number;
  avgSpeedMps?: number;
  maxSpeedMps?: number;
  calories?: number;
  elevationGainMeters?: number;
  status?: ActivityStatus;
  completedAt?: string;
  notes?: string;
  routeSvgPath?: string;
}

export interface ActivityFilter {
  sportType?: SportType | 'all';
  limit?: number;
}

export interface SaveActivityPointsInput {
  activityId: string;
  userId: string;
  points: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    speed?: number | null;
    heartRate?: number | null;
    timestamp: string;
  }[];
}
