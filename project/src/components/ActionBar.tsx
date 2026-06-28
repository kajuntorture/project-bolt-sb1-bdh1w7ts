import {
  Navigation,
  Crosshair,
  Play,
  Square,
  MapPin,
  Layers,
  Compass,
  Wifi,
  WifiOff,
  Signal,
} from 'lucide-react';
import { Position } from '../types';

interface ActionBarProps {
  currentPosition: Position | null;
  autoFollow: boolean;
  isTracking: boolean;
  isRecording: boolean;
  isOnline: boolean;
  speed: number;
  heading: number | null;
  distance: number;
  onToggleAutoFollow: () => void;
  onToggleTracking: () => void;
  onToggleRecording: () => void;
  onOpenWaypoints: () => void;
  onOpenDownloader: () => void;
  onOpenLayers: () => void;
}

export function ActionBar({
  currentPosition,
  autoFollow,
  isTracking,
  isRecording,
  isOnline,
  speed,
  heading,
  distance,
  onToggleAutoFollow,
  onToggleTracking,
  onToggleRecording,
  onOpenWaypoints,
  onOpenDownloader,
  onOpenLayers,
}: ActionBarProps) {
  const speedKnots = speed * 1.944;
  const distanceNm = distance / 1852;

  return (
    <div className="absolute z-30 left-0 right-0 bottom-4 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-4 gap-px bg-gray-200">
            <button
              onClick={onToggleAutoFollow}
              className={`p-3 flex flex-col items-center gap-1 transition-colors ${
                autoFollow ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
              title="Auto Follow"
            >
              <Crosshair className="w-5 h-5" />
              <span className="text-xs font-medium">Follow</span>
            </button>
            <button
              onClick={onToggleTracking}
              className={`p-3 flex flex-col items-center gap-1 transition-colors ${
                isTracking ? 'bg-emerald-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
              title="GPS Tracking"
            >
              <Signal className="w-5 h-5" />
              <span className="text-xs font-medium">GPS</span>
            </button>
            <button
              onClick={onToggleRecording}
              className={`p-3 flex flex-col items-center gap-1 transition-colors ${
                isRecording ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">
                {isRecording ? 'Stop' : 'Record'}
              </span>
            </button>
            <button
              onClick={onOpenDownloader}
              className="p-3 flex flex-col items-center gap-1 bg-white hover:bg-gray-50 transition-colors"
              title="Offline Maps"
            >
              {isOnline ? (
                <Wifi className="w-5 h-5 text-blue-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-500" />
              )}
              <span className="text-xs font-medium">Offline</span>
            </button>
          </div>

          {currentPosition && (
            <div className="p-3 bg-slate-900 text-white">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Navigation
                      className="w-4 h-4 text-emerald-400"
                      style={{
                        transform: heading ? `rotate(${heading}deg)` : 'none',
                      }}
                    />
                    <div>
                      <div className="text-xs text-slate-400">HDG</div>
                      <div className="font-mono font-semibold">
                        {heading !== null ? `${heading.toFixed(0)}°` : '--'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">SPEED</div>
                    <div className="font-mono font-semibold">
                      {speedKnots.toFixed(1)} kn
                    </div>
                  </div>
                  {isRecording && (
                    <div>
                      <div className="text-xs text-slate-400">DIST</div>
                      <div className="font-mono font-semibold">
                        {distanceNm.toFixed(2)} nm
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {currentPosition.accuracy.toFixed(0)}m accuracy
                </div>
              </div>
            </div>
          )}

          {!currentPosition && !isTracking && (
            <div className="p-3 bg-amber-50 text-amber-800 text-sm text-center">
              <div className="flex items-center justify-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Enable GPS to start navigation</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={onOpenWaypoints}
          className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Waypoints
        </button>
        <button
          onClick={onOpenLayers}
          className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Layers className="w-4 h-4" />
          Charts
        </button>
      </div>
    </div>
  );
}
