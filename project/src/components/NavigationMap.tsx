import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Position, Waypoint, TrackPoint } from '../types';
import { VesselIcon, WaypointIcon, PositionIcon } from './MapIcons';

interface NavigationMapProps {
  currentPosition: Position | null;
  autoFollow: boolean;
  waypoints: Waypoint[];
  trackPoints: TrackPoint[];
  isRecording: boolean;
  isTracking: boolean;
  selectedLayer: string;
  onMapClick: (lat: number, lng: number) => void;
  onWaypointClick: (waypoint: Waypoint) => void;
}

const chartLayers = {
  openSeaMap: {
    name: 'OpenSeaMap',
    base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    overlay: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, <a href="https://openseamap.org">OpenSeaMap</a>',
    minZoom: 2,
    maxZoom: 19,
  },
  navionics: {
    name: 'Navionics Style',
    base: 'https://tiles.wmflabs.org/osm-no-labels/{z}/{x}/{y}.png',
    overlay: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, OpenSeaMap',
    minZoom: 2,
    maxZoom: 18,
  },
  satellite: {
    name: 'Satellite',
    base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlay: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: '&copy; Esri, OpenSeaMap',
    minZoom: 2,
    maxZoom: 19,
  },
  water: {
    name: 'Water Depth',
    base: 'https://tiles.wmflabs.org/osm-no-labels/{z}/{x}/{y}.png',
    overlay: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, OpenSeaMap',
    minZoom: 2,
    maxZoom: 18,
  },
};

function AutoFollower({ position, autoFollow }: { position: Position | null; autoFollow: boolean }) {
  const map = useMap();
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!position || !autoFollow) return;

    const lat = position.latitude;
    const lng = position.longitude;

    // Only pan if position has changed significantly (more than ~1 meter)
    if (lastPositionRef.current) {
      const dist = Math.sqrt(
        Math.pow(lat - lastPositionRef.current.lat, 2) +
        Math.pow(lng - lastPositionRef.current.lng, 2)
      );
      if (dist < 0.00001) return; // Skip if position hasn't meaningfully changed
    }

    lastPositionRef.current = { lat, lng };
    map.panTo([lat, lng], { animate: true, duration: 0.5 });
  }, [position, autoFollow, map]);

  // Initial center when autoFollow is enabled
  useEffect(() => {
    if (position && autoFollow) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [autoFollow, map, position]);

  return null;
}

function PositionMarker({ position, isTracking }: { position: Position | null; isTracking: boolean }) {
  if (!position) return null;

  const heading = position.heading || 0;

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={isTracking ? VesselIcon({ heading, color: '#10b981' }) : PositionIcon()}
      zIndexOffset={1000}
    >
      <Popup>
        <div className="p-2">
          <div className="font-semibold mb-2">Current Position</div>
          <div className="text-sm space-y-1">
            <div>Lat: {position.latitude.toFixed(6)}</div>
            <div>Lng: {position.longitude.toFixed(6)}</div>
            {position.speed !== null && (
              <div>Speed: {(position.speed * 1.944).toFixed(1)} knots</div>
            )}
            {position.heading !== null && (
              <div>Heading: {position.heading.toFixed(0)} deg</div>
            )}
            <div>Accuracy: +/-{position.accuracy.toFixed(0)}m</div>
          </div>
        </div>
      </Popup>
      {position.accuracy && (
        <Circle
          center={[position.latitude, position.longitude]}
          radius={position.accuracy}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }}
        />
      )}
    </Marker>
  );
}

function WaypointMarkers({ waypoints, onClick }: { waypoints: Waypoint[]; onClick: (w: Waypoint) => void }) {
  return (
    <>
      {waypoints.map((waypoint) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.latitude, waypoint.longitude]}
          icon={WaypointIcon({ color: waypoint.color })}
          eventHandlers={{
            click: () => onClick(waypoint),
          }}
        >
          <Popup>
            <div className="p-2">
              <div className="font-semibold">{waypoint.name}</div>
              {waypoint.description && (
                <div className="text-sm text-gray-600 mt-1">{waypoint.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {waypoint.latitude.toFixed(5)}, {waypoint.longitude.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function TrackLine({ trackPoints, isRecording }: { trackPoints: TrackPoint[]; isRecording: boolean }) {
  if (trackPoints.length < 2) return null;

  const positions: [number, number][] = trackPoints.map((p) => [p.latitude, p.longitude]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: isRecording ? '#10b981' : '#3b82f6',
        weight: 3,
        opacity: 0.8,
      }}
    />
  );
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function NavigationMap({
  currentPosition,
  autoFollow,
  waypoints,
  trackPoints,
  isRecording,
  isTracking,
  selectedLayer,
  onMapClick,
  onWaypointClick,
}: NavigationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);

  const layer = chartLayers[selectedLayer as keyof typeof chartLayers] || chartLayers.openSeaMap;

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    const point = map.latLngToContainerPoint([lat, lng]);
    setContextMenuPos({ lat, lng, x: point.x, y: point.y });
    setShowContextMenu(true);
  }, []);

  const handleAddWaypoint = useCallback(() => {
    if (contextMenuPos) {
      onMapClick(contextMenuPos.lat, contextMenuPos.lng);
    }
    setShowContextMenu(false);
  }, [contextMenuPos, onMapClick]);

  let initialCenter: [number, number] = [37.7749, -122.4194];
  if (currentPosition) {
    initialCenter = [currentPosition.latitude, currentPosition.longitude];
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={12}
        className="w-full h-full"
        zoomControl={true}
        ref={mapRef}
      >
        <TileLayer
          url={layer.base}
          attribution={layer.attribution}
          minZoom={layer.minZoom}
          maxZoom={layer.maxZoom}
        />
        <TileLayer
          url={layer.overlay}
          minZoom={layer.minZoom}
          maxZoom={layer.maxZoom}
        />

        <AutoFollower position={currentPosition} autoFollow={autoFollow} />
        <PositionMarker position={currentPosition} isTracking={isTracking} />
        <WaypointMarkers waypoints={waypoints} onClick={onWaypointClick} />
        <TrackLine trackPoints={trackPoints} isRecording={isRecording} />
        <MapClickHandler onClick={handleMapClick} />
      </MapContainer>

      {showContextMenu && contextMenuPos && (
        <div
          className="fixed z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ left: contextMenuPos.x + 10, top: contextMenuPos.y + 10 }}
          onClick={() => setShowContextMenu(false)}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
            onClick={handleAddWaypoint}
          >
            Add Waypoint Here
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-500"
            onClick={() => setShowContextMenu(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
