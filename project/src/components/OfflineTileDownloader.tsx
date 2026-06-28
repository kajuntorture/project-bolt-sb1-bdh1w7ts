import { useState, useCallback } from 'react';
import {
  X,
  Download,
  Trash2,
  HardDrive,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';

interface OfflineTileDownloaderProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  stats: {
    totalTiles: number;
    totalSize: number;
    regions: string[];
  };
  formatSize: (bytes: number) => string;
  calculateTileCount: (
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    minZoom: number,
    maxZoom: number
  ) => number;
  downloadRegion: (
    region: string,
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    minZoom: number,
    maxZoom: number,
    templateUrl: string,
    onProgress?: (downloaded: number, total: number) => void
  ) => Promise<void>;
  clearAllTiles: () => Promise<void>;
  currentBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
}

export function OfflineTileDownloader({
  isOpen,
  onClose,
  isOnline,
  stats,
  formatSize,
  calculateTileCount,
  downloadRegion,
  clearAllTiles,
  currentBounds,
}: OfflineTileDownloaderProps) {
  const [regionName, setRegionName] = useState('');
  const [minZoom, setMinZoom] = useState(10);
  const [maxZoom, setMaxZoom] = useState(16);
  const [selectedBounds, setSelectedBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(currentBounds);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ downloaded: 0, total: 0 });

  const handleUseCurrentView = useCallback(() => {
    if (currentBounds) {
      setSelectedBounds(currentBounds);
    }
  }, [currentBounds]);

  const handleCustomBounds = useCallback(() => {
    const minLat = prompt('Enter minimum latitude:', '35');
    const maxLat = prompt('Enter maximum latitude:', '40');
    const minLng = prompt('Enter minimum longitude:', '-125');
    const maxLng = prompt('Enter maximum longitude:', '-120');

    if (minLat && maxLat && minLng && maxLng) {
      setSelectedBounds({
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng),
      });
    }
  }, []);

  const estimatedTileCount = selectedBounds
    ? calculateTileCount(
        selectedBounds.minLat,
        selectedBounds.maxLat,
        selectedBounds.minLng,
        selectedBounds.maxLng,
        minZoom,
        maxZoom
      )
    : 0;

  const handleDownload = useCallback(async () => {
    if (!selectedBounds || !regionName.trim()) return;

    setIsDownloading(true);
    setProgress({ downloaded: 0, total: estimatedTileCount });

    try {
      await downloadRegion(
        regionName.trim(),
        selectedBounds.minLat,
        selectedBounds.maxLat,
        selectedBounds.minLng,
        selectedBounds.maxLng,
        minZoom,
        maxZoom,
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        (downloaded, total) => {
          setProgress({ downloaded, total });
        }
      );

      setRegionName('');
      setSelectedBounds(null);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
      setProgress({ downloaded: 0, total: 0 });
    }
  }, [selectedBounds, regionName, minZoom, maxZoom, estimatedTileCount, downloadRegion]);

  const handleClearAll = useCallback(async () => {
    if (confirm('Are you sure you want to delete all offline tiles?')) {
      await clearAllTiles();
    }
  }, [clearAllTiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Offline Maps
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-emerald-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-500" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <HardDrive className="w-4 h-4" />
              <span>{formatSize(stats.totalSize)}</span>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-900">
                  Stored Tiles: {stats.totalTiles.toLocaleString()}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {stats.regions.length} region{stats.regions.length !== 1 ? 's' : ''} downloaded
                </div>
              </div>
              {stats.totalTiles > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {isOnline && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Download New Region
                </h3>

                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">
                    Region Name
                  </label>
                  <input
                    type="text"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    placeholder="e.g., San Francisco Bay"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleUseCurrentView}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                    Use Current View
                  </button>
                  <button
                    onClick={handleCustomBounds}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                    Custom Bounds
                  </button>
                </div>

                {selectedBounds && (
                  <div className="p-2 bg-gray-50 rounded-lg text-xs text-gray-600 mb-3">
                    <div>
                      Lat: {selectedBounds.minLat.toFixed(4)} to{' '}
                      {selectedBounds.maxLat.toFixed(4)}
                    </div>
                    <div>
                      Lng: {selectedBounds.minLng.toFixed(4)} to{' '}
                      {selectedBounds.maxLng.toFixed(4)}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Zoom Range</span>
                    <span>{estimatedTileCount.toLocaleString()} tiles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minZoom}
                      onChange={(e) => setMinZoom(parseInt(e.target.value) || 1)}
                      min={1}
                      max={maxZoom}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      value={maxZoom}
                      onChange={(e) => setMaxZoom(parseInt(e.target.value) || 16)}
                      min={minZoom}
                      max={19}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDownloading && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Downloading...</span>
                <span className="text-sm font-medium">
                  {progress.downloaded.toLocaleString()} / {progress.total.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(progress.downloaded / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {isOnline && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleDownload}
              disabled={!selectedBounds || !regionName.trim() || isDownloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Region
                </>
              )}
            </button>
          </div>
        )}

        {!isOnline && (
          <div className="p-4 border-t border-gray-200 bg-orange-50 text-center text-sm text-orange-800">
            Connect to the internet to download maps
          </div>
        )}
      </div>
    </div>
  );
}
