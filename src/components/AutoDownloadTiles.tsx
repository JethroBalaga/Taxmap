import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface AutoDownloadProps {
  tileLayer: {
    saveTile: (options: { coords: { x: number; y: number; z: number } }) => Promise<void>;
  };
  bounds: L.LatLngBounds;
  zoomLevels: number[];
  onComplete?: () => void;
}

const AutoDownloadTiles = ({ tileLayer, bounds, zoomLevels, onComplete }: AutoDownloadProps) => {
  const map = useMap();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const originalCenter = useRef<L.LatLng | null>(null);
  const originalZoom = useRef<number | null>(null);
  const hasDownloaded = useRef(false);

  // Check if we've already downloaded tiles for this area
  useEffect(() => {
    const checkDownloadStatus = async () => {
      const downloadKey = `manolofortich_tiles_downloaded`;
      const hasDownloadedBefore = localStorage.getItem(downloadKey);
      hasDownloaded.current = !!hasDownloadedBefore;
      
      if (!hasDownloadedBefore && tileLayer) {
        // Store original view before starting download
        originalCenter.current = map.getCenter();
        originalZoom.current = map.getZoom();
        
        // Start the download process
        await downloadAllTiles();
        
        // Mark as downloaded
        localStorage.setItem(downloadKey, 'true');
        hasDownloaded.current = true;
        
        if (onComplete) onComplete();
      }
    };

    checkDownloadStatus();
  }, [map, tileLayer, bounds, zoomLevels]);

  const downloadAllTiles = async () => {
    if (!map || !tileLayer || hasDownloaded.current) return;
    
    setIsDownloading(true);
    setProgress(0);
    
    const crs: L.CRS = map.options.crs || L.CRS.EPSG3857;
    const tileSize = 256;
    let totalTiles = 0;
    let processedTiles = 0;
    
    // First, calculate total number of tiles
    for (const zoom of zoomLevels) {
      const scale = crs.scale(zoom);
      const nw = bounds.getNorthWest();
      const se = bounds.getSouthEast();
      
      const projectedNW = crs.project(nw);
      const projectedSE = crs.project(se);
      
      const minX = Math.floor((projectedNW.x * scale) / tileSize);
      const minY = Math.floor((projectedNW.y * scale) / tileSize);
      const maxX = Math.floor((projectedSE.x * scale) / tileSize);
      const maxY = Math.floor((projectedSE.y * scale) / tileSize);
      
      totalTiles += (maxX - minX + 1) * (maxY - minY + 1);
    }
    
    console.log(`Total tiles to download: ${totalTiles}`);
    
    // Download tiles for each zoom level
    for (const zoom of zoomLevels) {
      const scale = crs.scale(zoom);
      const nw = bounds.getNorthWest();
      const se = bounds.getSouthEast();
      
      const projectedNW = crs.project(nw);
      const projectedSE = crs.project(se);
      
      const minX = Math.floor((projectedNW.x * scale) / tileSize);
      const minY = Math.floor((projectedNW.y * scale) / tileSize);
      const maxX = Math.floor((projectedSE.x * scale) / tileSize);
      const maxY = Math.floor((projectedSE.y * scale) / tileSize);
      
      const tilesToSave: { x: number; y: number; z: number }[] = [];
      
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          tilesToSave.push({ x, y, z: zoom });
        }
      }
      
      console.log(`Downloading ${tilesToSave.length} tiles for zoom level ${zoom}...`);
      
      // Process tiles in batches to avoid memory issues
      const BATCH_SIZE = 50;
      for (let i = 0; i < tilesToSave.length; i += BATCH_SIZE) {
        const batch = tilesToSave.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(tile =>
            tileLayer.saveTile({ coords: tile })
              .then(() => {
                processedTiles++;
                setProgress(Math.round((processedTiles / totalTiles) * 100));
              })
              .catch(err => console.error(`Failed tile ${tile.z}/${tile.x}/${tile.y}:`, err))
          )
        );
        
        // Small delay between batches to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ All tiles processed');
    setIsDownloading(false);
    
    // Return to original view
    if (originalCenter.current && originalZoom.current !== null) {
      map.setView(originalCenter.current, originalZoom.current);
    }
  };

  return (
    <div>
      {isDownloading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div>Downloading map for offline use...</div>
          <div style={{
            width: '200px',
            height: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '10px',
            margin: '10px 0',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div>{progress}% Complete</div>
        </div>
      )}
    </div>
  );
};

export default AutoDownloadTiles;