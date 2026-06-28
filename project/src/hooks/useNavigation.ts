import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Position, Waypoint, NavigationTrack, TrackPoint } from '../types';

interface NavigationState {
  currentTrack: NavigationTrack | null;
  isRecording: boolean;
  trackPoints: TrackPoint[];
  distance: number;
  waypoints: Waypoint[];
}

export function useNavigation(userId: string | null) {
  const [state, setState] = useState<NavigationState>({
    currentTrack: null,
    isRecording: false,
    trackPoints: [],
    distance: 0,
    waypoints: [],
  });

  const lastPositionRef = useRef<Position | null>(null);
  const distanceRef = useRef(0);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (userId && !isLoadedRef.current) {
      isLoadedRef.current = true;
      loadWaypoints();
      loadActiveTrack();
    }
  }, [userId]);

  const loadWaypoints = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('waypoints')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setState(prev => ({ ...prev, waypoints: data as Waypoint[] }));
      }
    } catch (err) {
      console.error('Failed to load waypoints:', err);
    }
  }, [userId]);

  const loadActiveTrack = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: trackData, error: trackError } = await supabase
        .from('navigation_tracks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!trackError && trackData) {
        const { data: pointsData } = await supabase
          .from('track_points')
          .select('*')
          .eq('track_id', trackData.id)
          .order('recorded_at', { ascending: true });

        setState(prev => ({
          ...prev,
          currentTrack: trackData as NavigationTrack,
          trackPoints: (pointsData || []) as TrackPoint[],
        }));
      }
    } catch {
      // No active track found, which is fine
    }
  }, [userId]);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const startRecording = useCallback(async () => {
    if (!userId) return;

    const trackName = `Track ${new Date().toLocaleString()}`;

    try {
      const { data, error } = await supabase
        .from('navigation_tracks')
        .insert({
          user_id: userId,
          name: trackName,
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        setState(prev => ({
          ...prev,
          currentTrack: data as NavigationTrack,
          isRecording: true,
          trackPoints: [],
          distance: 0,
        }));
        distanceRef.current = 0;
        lastPositionRef.current = null;
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [userId]);

  const stopRecording = useCallback(async () => {
    if (!state.currentTrack) return;

    try {
      await supabase
        .from('navigation_tracks')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          distance_meters: distanceRef.current,
        })
        .eq('id', state.currentTrack.id);

      setState(prev => ({
        ...prev,
        currentTrack: null,
        isRecording: false,
      }));
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  }, [state.currentTrack]);

  const recordPosition = useCallback(
    async (position: Position) => {
      if (!state.isRecording || !state.currentTrack) return;

      if (lastPositionRef.current) {
        const dist = calculateDistance(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude,
          position.latitude,
          position.longitude
        );
        distanceRef.current += dist;
      }

      lastPositionRef.current = position;

      const trackPoint: Omit<TrackPoint, 'id'> = {
        track_id: state.currentTrack.id,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        speed: position.speed,
        heading: position.heading,
        recorded_at: new Date(position.timestamp).toISOString(),
        accuracy: position.accuracy,
      };

      try {
        const { data, error } = await supabase
          .from('track_points')
          .insert(trackPoint)
          .select()
          .single();

        if (!error && data) {
          setState(prev => ({
            ...prev,
            trackPoints: [...prev.trackPoints, data as TrackPoint],
            distance: distanceRef.current,
          }));
        }
      } catch (err) {
        console.error('Failed to record position:', err);
      }
    },
    [state.isRecording, state.currentTrack, calculateDistance]
  );

  const addWaypoint = useCallback(
    async (
      name: string,
      latitude: number,
      longitude: number,
      description?: string,
      symbol: string = 'waypoint',
      color: string = '#3b82f6'
    ): Promise<Waypoint | null> => {
      if (!userId) return null;

      try {
        const { data, error } = await supabase
          .from('waypoints')
          .insert({
            user_id: userId,
            name,
            description: description || null,
            latitude,
            longitude,
            symbol,
            color,
          })
          .select()
          .single();

        if (!error && data) {
          setState(prev => ({
            ...prev,
            waypoints: [data as Waypoint, ...prev.waypoints],
          }));
          return data as Waypoint;
        }
      } catch (err) {
        console.error('Failed to add waypoint:', err);
      }
      return null;
    },
    [userId]
  );

  const updateWaypoint = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Waypoint, 'id' | 'user_id' | 'created_at'>>
    ): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('waypoints')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (!error) {
          setState(prev => ({
            ...prev,
            waypoints: prev.waypoints.map(w =>
              w.id === id ? { ...w, ...updates } : w
            ),
          }));
          return true;
        }
      } catch (err) {
        console.error('Failed to update waypoint:', err);
      }
      return false;
    },
    []
  );

  const deleteWaypoint = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('waypoints').delete().eq('id', id);

      if (!error) {
        setState(prev => ({
          ...prev,
          waypoints: prev.waypoints.filter(w => w.id !== id),
        }));
        return true;
      }
    } catch (err) {
      console.error('Failed to delete waypoint:', err);
    }
    return false;
  }, []);

  const clearTrack = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      await supabase.from('track_points').delete().eq('track_id', trackId);
      const { error } = await supabase
        .from('navigation_tracks')
        .delete()
        .eq('id', trackId);

      if (!error) {
        return true;
      }
    } catch (err) {
      console.error('Failed to clear track:', err);
    }
    return false;
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    recordPosition,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
    clearTrack,
    loadWaypoints,
    calculateDistance,
  };
}
