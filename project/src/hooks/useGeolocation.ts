import { useState, useEffect, useCallback, useRef } from 'react';
import { Position } from '../types';

interface GeolocationState {
  position: Position | null;
  error: string | null;
  isWatching: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isWatching: false,
    permissionStatus: 'unknown',
  });

  const watchIdRef = useRef<number | null>(null);
  const permissionCheckedRef = useRef(false);

  const optionsRef = useRef({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  });

  const checkPermission = useCallback(async () => {
    if (permissionCheckedRef.current) return;
    permissionCheckedRef.current = true;

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permissionStatus: result.state }));
      } catch {
        setState(prev => ({ ...prev, permissionStatus: 'unknown' }));
      }
    }
  }, []);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    const position: Position = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      altitude: pos.coords.altitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    };
    setState(prev => ({ ...prev, position, error: null }));
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location access denied. Please enable location permissions.',
      2: 'Unable to determine location. Check GPS signal.',
      3: 'Location request timed out.',
    };
    setState(prev => ({ ...prev, error: messages[err.code] || err.message }));
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      optionsRef.current
    );

    setState(prev => ({ ...prev, isWatching: true }));
  }, [onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(prev => ({ ...prev, isWatching: false }));
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise<Position>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position: Position = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          setState(prev => ({ ...prev, position, error: null }));
          resolve(position);
        },
        (err) => {
          const messages: Record<number, string> = {
            1: 'Location access denied',
            2: 'Unable to determine location',
            3: 'Location request timed out',
          };
          const error = messages[err.code] || err.message;
          setState(prev => ({ ...prev, error }));
          reject(new Error(error));
        },
        optionsRef.current
      );
    });
  }, []);

  useEffect(() => {
    checkPermission();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [checkPermission]);

  return {
    ...state,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}
