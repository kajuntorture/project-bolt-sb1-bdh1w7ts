export interface Position {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface Waypoint {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  symbol: string;
  color: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface NavigationTrack {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  distance_meters: number;
  is_active: boolean;
}

export interface TrackPoint {
  id: string;
  track_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  accuracy: number | null;
}

export interface OfflineTileRegion {
  id: string;
  user_id: string;
  name: string;
  bounds: MapBounds;
  min_zoom: number;
  max_zoom: number;
  created_at: string;
  tile_count: number;
  size_bytes: number;
  status: 'pending' | 'downloading' | 'complete' | 'error';
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface NavigationState {
  isTracking: boolean;
  isRecording: boolean;
  autoFollow: boolean;
  currentTrack: NavigationTrack | null;
  currentPosition: Position | null;
  heading: number | null;
  speed: number;
  distance: number;
}

export interface ChartLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  minZoom: number;
  maxZoom: number;
  isOfflineAvailable: boolean;
  type: 'base' | 'overlay';
}

export interface VesselInfo {
  name: string;
  mmsi: string | null;
  type: string;
  length: number | null;
  width: number | null;
  destination: string | null;
}
