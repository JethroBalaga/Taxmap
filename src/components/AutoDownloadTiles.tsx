import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface AutoDownloadProps {
  tileLayer: {
    saveTile: (options: { coords: { x: number; y: number; z: number } }) => Promise<void>;
  };
  bounds: L.LatLngBounds | [L.LatLngTuple, L.LatLngTuple];
  zoomLevels: number[];
  onProgress?: (current: number, total: number) => void;
  onComplete?: () => void;
}

const AutoDownloadTiles = ({ tileLayer, bounds, zoomLevels, onProgress, onComplete }: AutoDownloadProps) => {
  const map = useMap();
  const hasStartedRef = useRef(false); // Prevent multiple executions

  useEffect(() => {
    // Check if tileLayer has the required method
    if (!map || !tileLayer || typeof tileLayer.saveTile !== 'function') {
      console.error('Tile layer or saveTile method not available');
      return;
    }

    // Prevent multiple executions to avoid infinite loops
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Convert bounds to L.LatLngBounds if it's a tuple
    const leafletBounds = Array.isArray(bounds) 
      ? L.latLngBounds(bounds[0], bounds[1])
      : bounds;

    const downloadTiles = async () => {
      const tileSize = 256;
      const tilesToSave: { x: number; y: number; z: number }[] = [];

      console.log('🌍 Calculating tiles for Manolo Fortich area only...');
      console.log('Bounds:', leafletBounds.getSouthWest(), 'to', leafletBounds.getNorthEast());

      for (const zoom of zoomLevels) {
        // Get the projected bounds at this zoom level
        const nwPoint = map.project(leafletBounds.getNorthWest(), zoom);
        const sePoint = map.project(leafletBounds.getSouthEast(), zoom);
        
        // Calculate tile coordinates
        const minX = Math.floor(nwPoint.x / tileSize);
        const maxX = Math.floor(sePoint.x / tileSize);
        const minY = Math.floor(nwPoint.y / tileSize);
        const maxY = Math.floor(sePoint.y / tileSize);

        console.log(`🔍 Zoom ${zoom}: ${maxX - minX + 1}x${maxY - minY + 1} tiles`);

        // Add all tiles in the calculated range
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            tilesToSave.push({ x, y, z: zoom });
          }
        }
      }

      console.log(`💾 Total tiles to download: ${tilesToSave.length}`);
      
      if (onProgress) {
        onProgress(0, tilesToSave.length);
      }

      // Process tiles in batches to avoid memory issues
      const BATCH_SIZE = 10; // Smaller batch size for smoother progress updates
      let processed = 0;
      
      for (let i = 0; i < tilesToSave.length; i += BATCH_SIZE) {
        const batch = tilesToSave.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(tile => 
            tileLayer.saveTile({ coords: tile })
              .then(() => {
                processed++;
                if (onProgress) {
                  onProgress(processed, tilesToSave.length);
                }
              })
              .catch((err) => console.error(`❌ Failed tile ${tile.z}/${tile.x}/${tile.y}:`, err)) // FIXED: Added parentheses
          )
        );
        
        // Small delay between batches to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('✅ All Manolo Fortich tiles downloaded successfully!');
      
      if (onComplete) {
        onComplete();
      }
    };

    downloadTiles().catch((err) => {
      console.error('Tile download failed:', err); // FIXED: Added parentheses
    });
  }, [map, bounds, zoomLevels]); // Removed tileLayer from dependencies to prevent infinite loops

  return null;
};

export default AutoDownloadTiles;