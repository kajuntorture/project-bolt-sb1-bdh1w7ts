import { useState, useCallback, useEffect, useRef } from 'react';
import localforage from 'localforage';

const TILE_STORE = 'marine_tiles';
const TILE_METADATA_STORE = 'tile_metadata';

interface TileMetadata {
  key: string;
  url: string;
  downloadedAt: number;
  size: number;
  region: string;
}

interface OfflineStorageStats {
  totalTiles: number;
  totalSize: number;
  regions: string[];
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState<OfflineStorageStats>({
    totalTiles: 0,
    totalSize: 0,
    regions: [],
  });
  const statsLoadedRef = useRef(false);

  const tileStore = localforage.createInstance({
    name: 'MarineNavigator',
    storeName: TILE_STORE,
  });

  const metadataStore = localforage.createInstance({
    name: 'MarineNavigator',
    storeName: TILE_METADATA_STORE,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (statsLoadedRef.current) return;
    statsLoadedRef.current = true;
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const keys = await tileStore.keys();
      let totalSize = 0;
      const regions = new Set<string>();

      for (const key of keys) {
        const blob = await tileStore.getItem<Blob>(key);
        if (blob) {
          totalSize += blob.size;
        }
        const metadata = await metadataStore.getItem<TileMetadata>(`meta_${key}`);
        if (metadata?.region) {
          regions.add(metadata.region);
        }
      }

      setStats({
        totalTiles: keys.length,
        totalSize,
        regions: Array.from(regions),
      });
    } catch {
      console.error('Failed to load offline storage stats');
    }
  }, []);

  const getTile = useCallback(async (key: string): Promise<Blob | null> => {
    try {
      return await tileStore.getItem<Blob>(key);
    } catch {
      return null;
    }
  }, []);

  const storeTile = useCallback(
    async (key: string, blob: Blob, url: string, region: string): Promise<void> => {
      try {
        await tileStore.setItem(key, blob);
        await metadataStore.setItem(`meta_${key}`, {
          key,
          url,
          downloadedAt: Date.now(),
          size: blob.size,
          region,
        });
        loadStats();
      } catch (error) {
        console.error('Failed to store tile:', error);
      }
    },
    [loadStats]
  );

  const getTileUrl = useCallback(
    async (key: string): Promise<string | null> => {
      const blob = await getTile(key);
      if (blob) {
        return URL.createObjectURL(blob);
      }
      return null;
    },
    [getTile]
  );

  const calculateTileCount = useCallback(
    (
      minLat: number,
      maxLat: number,
      minLng: number,
      maxLng: number,
      minZoom: number,
      maxZoom: number
    ): number => {
      let count = 0;
      for (let z = minZoom; z <= maxZoom; z++) {
        const minX = Math.floor((minLng + 180) / 360 * Math.pow(2, z));
        const maxX = Math.floor((maxLng + 180) / 360 * Math.pow(2, z));
        const minY = Math.floor((1 - Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
        const maxY = Math.floor((1 - Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
        count += (maxX - minX + 1) * (maxY - minY + 1);
      }
      return count;
    },
    []
  );

  const downloadRegion = useCallback(
    async (
      region: string,
      minLat: number,
      maxLat: number,
      minLng: number,
      maxLng: number,
      minZoom: number,
      maxZoom: number,
      templateUrl: string,
      onProgress?: (downloaded: number, total: number) => void
    ): Promise<void> => {
      const totalTiles = calculateTileCount(minLat, maxLat, minLng, maxLng, minZoom, maxZoom);
      let downloaded = 0;

      for (let z = minZoom; z <= maxZoom; z++) {
        const minX = Math.floor((minLng + 180) / 360 * Math.pow(2, z));
        const maxX = Math.floor((maxLng + 180) / 360 * Math.pow(2, z));
        const minY = Math.floor((1 - Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
        const maxY = Math.floor((1 - Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            const key = `${z}/${x}/${y}`;
            const url = templateUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));

            try {
              const response = await fetch(url);
              if (response.ok) {
                const blob = await response.blob();
                await storeTile(key, blob, url, region);
              }
            } catch {
              console.warn(`Failed to download tile ${key}`);
            }

            downloaded++;
            onProgress?.(downloaded, totalTiles);
          }
        }
      }

      await loadStats();
    },
    [calculateTileCount, storeTile, loadStats]
  );

  const clearRegion = useCallback(
    async (region: string): Promise<void> => {
      const keys = await tileStore.keys();
      for (const key of keys) {
        const metadata = await metadataStore.getItem<TileMetadata>(`meta_${key}`);
        if (metadata?.region === region) {
          await tileStore.removeItem(key);
          await metadataStore.removeItem(`meta_${key}`);
        }
      }
      loadStats();
    },
    [loadStats]
  );

  const clearAllTiles = useCallback(async (): Promise<void> => {
    await tileStore.clear();
    await metadataStore.clear();
    setStats({ totalTiles: 0, totalSize: 0, regions: [] });
  }, []);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);

  return {
    isOnline,
    stats,
    getTile,
    getTileUrl,
    storeTile,
    downloadRegion,
    clearRegion,
    clearAllTiles,
    calculateTileCount,
    formatSize,
  };
}
