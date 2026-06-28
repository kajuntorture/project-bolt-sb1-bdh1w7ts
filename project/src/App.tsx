import { useState, useCallback, useEffect, useRef } from 'react';
import { NavigationMap } from './components/NavigationMap';
import { ActionBar } from './components/ActionBar';
import { WaypointModal } from './components/WaypointModal';
import { WaypointsPanel } from './components/WaypointsPanel';
import { OfflineTileDownloader } from './components/OfflineTileDownloader';
import { LayerSelector } from './components/LayerSelector';
import { useGeolocation } from './hooks/useGeolocation';
import { useNavigation } from './hooks/useNavigation';
import { useOfflineStorage } from './hooks/useOfflineStorage';
import { Waypoint } from './types';
import { Anchor, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState('openSeaMap');
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [showWaypointsPanel, setShowWaypointsPanel] = useState(false);
  const [showOfflineDownloader, setShowOfflineDownloader] = useState(false);
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [pendingWaypoint, setPendingWaypoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);
  const [mapBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authInitializedRef = useRef(false);

  const {
    position: currentPosition,
    error: geoError,
    isWatching: isTracking,
    startWatching,
    stopWatching,
    permissionStatus,
  } = useGeolocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 });

  const {
    isRecording,
    trackPoints,
    distance,
    waypoints,
    startRecording,
    stopRecording,
    recordPosition,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
  } = useNavigation(userId);

  const {
    isOnline,
    stats: offlineStats,
    downloadRegion,
    clearAllTiles,
    calculateTileCount,
    formatSize,
  } = useOfflineStorage();

  // Only run auth once
  useEffect(() => {
    if (authInitializedRef.current) return;
    authInitializedRef.current = true;

    const signIn = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (!signInError && data.user) {
            setUserId(data.user.id);
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Failed to initialize. Please refresh.');
      }
    };
    signIn();
  }, []);

  useEffect(() => {
    if (currentPosition && isRecording) {
      recordPosition(currentPosition);
    }
  }, [currentPosition, isRecording, recordPosition]);

  useEffect(() => {
    if (geoError) {
      setError(geoError);
    }
  }, [geoError]);

  const handleToggleAutoFollow = useCallback(() => {
    setAutoFollow((prev) => !prev);
  }, []);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopWatching();
    } else {
      startWatching();
    }
  }, [isTracking, startWatching, stopWatching]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPendingWaypoint({ lat, lng });
      setShowWaypointModal(true);
    },
    []
  );

  const handleSaveWaypoint = useCallback(
    async (name: string, description: string, color: string) => {
      if (editingWaypoint) {
        await updateWaypoint(editingWaypoint.id, { name, description, color });
        setEditingWaypoint(null);
      } else if (pendingWaypoint) {
        await addWaypoint(name, pendingWaypoint.lat, pendingWaypoint.lng, description);
        setPendingWaypoint(null);
      }
      setShowWaypointModal(false);
    },
    [editingWaypoint, pendingWaypoint, addWaypoint, updateWaypoint]
  );

  const handleEditWaypoint = useCallback((waypoint: Waypoint) => {
    setEditingWaypoint(waypoint);
    setShowWaypointModal(true);
    setShowWaypointsPanel(false);
  }, []);

  const handleDeleteWaypoint = useCallback(
    async (id: string) => {
      if (confirm('Delete this waypoint?')) {
        await deleteWaypoint(id);
      }
    },
    [deleteWaypoint]
  );

  const handleNavigateToWaypoint = useCallback((_waypoint: Waypoint) => {
    setAutoFollow(false);
    setShowWaypointsPanel(false);
  }, []);

  const handleCloseWaypointModal = useCallback(() => {
    setShowWaypointModal(false);
    setEditingWaypoint(null);
    setPendingWaypoint(null);
  }, []);

  return (
    <div className="h-full w-full relative bg-slate-900">
      <NavigationMap
        currentPosition={currentPosition}
        autoFollow={autoFollow}
        waypoints={waypoints}
        trackPoints={trackPoints}
        isRecording={isRecording}
        isTracking={isTracking}
        selectedLayer={selectedLayer}
        onMapClick={handleMapClick}
        onWaypointClick={handleEditWaypoint}
      />

      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Marine Navigator</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {isOnline ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Offline
                  </span>
                )}
                {currentPosition && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span>
                      {currentPosition.latitude.toFixed(4)},{' '}
                      {currentPosition.longitude.toFixed(4)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isTracking && permissionStatus !== 'granted' && (
              <button
                onClick={handleToggleTracking}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Enable GPS
              </button>
            )}
          </div>
        </div>
      </header>

      <ActionBar
        currentPosition={currentPosition}
        autoFollow={autoFollow}
        isTracking={isTracking}
        isRecording={isRecording}
        isOnline={isOnline}
        speed={currentPosition?.speed || 0}
        heading={currentPosition?.heading || null}
        distance={distance}
        onToggleAutoFollow={handleToggleAutoFollow}
        onToggleTracking={handleToggleTracking}
        onToggleRecording={handleToggleRecording}
        onOpenWaypoints={() => setShowWaypointsPanel(true)}
        onOpenDownloader={() => setShowOfflineDownloader(true)}
        onOpenLayers={() => setShowLayerSelector(true)}
      />

      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-amber-100 border border-amber-300 rounded-lg shadow-lg flex items-center gap-2 text-amber-800 max-w-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-amber-600 hover:text-amber-800"
          >
            &times;
          </button>
        </div>
      )}

      <WaypointModal
        isOpen={showWaypointModal}
        onClose={handleCloseWaypointModal}
        onSave={handleSaveWaypoint}
        onDelete={editingWaypoint ? () => deleteWaypoint(editingWaypoint.id) : undefined}
        initialName={editingWaypoint?.name || ''}
        initialDescription={editingWaypoint?.description || ''}
        initialColor={editingWaypoint?.color || '#3b82f6'}
        latitude={editingWaypoint?.latitude || pendingWaypoint?.lat || 0}
        longitude={editingWaypoint?.longitude || pendingWaypoint?.lng || 0}
        isNew={!editingWaypoint}
      />

      <WaypointsPanel
        isOpen={showWaypointsPanel}
        onClose={() => setShowWaypointsPanel(false)}
        waypoints={waypoints}
        onEdit={handleEditWaypoint}
        onDelete={handleDeleteWaypoint}
        onNavigate={handleNavigateToWaypoint}
      />

      <OfflineTileDownloader
        isOpen={showOfflineDownloader}
        onClose={() => setShowOfflineDownloader(false)}
        isOnline={isOnline}
        stats={{
          totalTiles: offlineStats.totalTiles,
          totalSize: offlineStats.totalSize,
          regions: offlineStats.regions,
        }}
        formatSize={formatSize}
        calculateTileCount={calculateTileCount}
        downloadRegion={downloadRegion}
        clearAllTiles={clearAllTiles}
        currentBounds={mapBounds}
      />

      <LayerSelector
        isOpen={showLayerSelector}
        onClose={() => setShowLayerSelector(false)}
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
      />
    </div>
  );
}

export default App;
