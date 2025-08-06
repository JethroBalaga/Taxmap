import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface AutoDownloadProps {
  tileLayer: {
    saveTile: (options: { coords: { x: number; y: number; z: number } }) => Promise<void>;
  };
  bounds: [L.LatLngTuple, L.LatLngTuple];
  zoomLevels: number[];
}

const AutoDownloadTiles = ({ tileLayer, bounds, zoomLevels }: AutoDownloadProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !tileLayer) return;

    // Get CRS with proper type handling
    const crs: L.CRS = map.options.crs || L.CRS.EPSG3857; // Fallback to default CRS
    const leafletBounds = L.latLngBounds(bounds[0], bounds[1]);

    const downloadTiles = async () => {
      const tileSize = 256;
      const tilesToSave: { x: number; y: number; z: number }[] = [];

      for (const zoom of zoomLevels) {
        // Safe CRS operations with null checks
        const scale = crs.scale(zoom);
        const nw = leafletBounds.getNorthWest();
        const se = leafletBounds.getSouthEast();
        
        const projectedNW = crs.project(nw);
        const projectedSE = crs.project(se);

        const minX = Math.floor((projectedNW.x * scale) / tileSize);
        const minY = Math.floor((projectedNW.y * scale) / tileSize);
        const maxX = Math.floor((projectedSE.x * scale) / tileSize);
        const maxY = Math.floor((projectedSE.y * scale) / tileSize);

        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            tilesToSave.push({ x, y, z: zoom });
          }
        }
      }

      console.log(`Saving ${tilesToSave.length} tiles...`);

      // Process tiles in batches to avoid memory issues
      const BATCH_SIZE = 100;
      for (let i = 0; i < tilesToSave.length; i += BATCH_SIZE) {
        const batch = tilesToSave.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(tile => 
            tileLayer.saveTile({ coords: tile })
              .catch(err => console.error(`Failed tile ${tile.z}/${tile.x}/${tile.y}:`, err))
          )
        );
      }
      console.log('✅ All tiles processed');
    };

    downloadTiles();
  }, [map, tileLayer, bounds, zoomLevels]);

  return null;
};

export default AutoDownloadTiles;