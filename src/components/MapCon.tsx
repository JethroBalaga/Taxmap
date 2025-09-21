import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline';
import localforage from 'localforage';
import { useIonViewWillEnter } from '@ionic/react';
import Form from './Modals/Form';
import { PhotoTagLocalStorage, PhotoTagData } from '../utils/tablestorages/PhotoTagLocalStorage';
import { createBlueMarkerIcon } from '../utils/markerIcons';
import MapMarkerPopup from './MapMarkerPopup';
import AutoDownloadTiles from './AutoDownloadTiles';

const TILE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),
  L.latLng(8.45, 124.95)
);

const DEFAULT_ZOOM = 14;
const MIN_ZOOM_LOCKED = 14;
const MIN_ZOOM_UNLOCKED = 12;
const MAX_ZOOM = 18;
const CREATE_OUTLINE_PATH = "M384 224v184a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V168a40 40 0 0 1 40-40h167.48M336 64h112v112M224 288L440 72";

// Create Button Component
const CreateOutlineControl = ({ onClick }: { onClick: () => void }) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control');
        const link = L.DomUtil.create('a', 'create-outline-btn', container);
        link.href = '#';
        link.title = 'Create New Location';
        link.innerHTML = `
          <svg viewBox="0 0 512 512" width="20" height="20">
            <path fill="currentColor" d="${CREATE_OUTLINE_PATH}"/>
          </svg>
        `;
        L.DomEvent.on(link, 'click', function(e) {
          L.DomEvent.stop(e);
          onClick();
        });
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    return function() {
      if (controlRef.current) {
        controlRef.current.remove();
      }
    };
  }, [map, onClick]);

  return null;
};

// Photo Markers Component
const PhotoMarkers: React.FC<{
  photoTags: PhotoTagData[];
  onMarkerClick: (photoTagId: string) => void;
}> = ({ photoTags, onMarkerClick }) => {
  return (
    <>
      {photoTags.map(function(tag) {
        return (
          <Marker
            key={tag.id}
            position={[tag.latitude, tag.longitude]}
            icon={createBlueMarkerIcon()}
            eventHandlers={{
              click: function() {
                onMarkerClick(tag.id);
              }
            }}
          />
        );
      })}
    </>
  );
};

// Component to set up the map logic
const MapLogic = ({ 
  onOpenForm, 
  onOfflineLayerReady 
}: { 
  onOpenForm: () => void;
  onOfflineLayerReady: (layer: any) => void;
}) => {
  const map = useMap();
  const tileLayerRef = useRef<any>(null);
  const [allowZoomOut, setAllowZoomOut] = useState(false);

  useEffect(function() {
    // LocalForage config
    localforage.config({
      driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
      name: 'ManoloFortichMap',
      storeName: 'map_tiles'
    });

    // Add Offline Tile Layer
    const offlineLayer = (L.tileLayer as any).offline(TILE_LAYER_URL, {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      noWrap: true,
      minZoom: MIN_ZOOM_LOCKED,
      maxZoom: MAX_ZOOM
    });

    // Enhanced saveTile method without function references
    offlineLayer.saveTile = function(options: { coords: { x: number; y: number; z: number } }) {
      return new Promise<void>(function(resolve, reject) {
        // Create a simple object without any function references
        const tileData = {
          coords: options.coords,
          url: TILE_LAYER_URL
            .replace('{z}', options.coords.z.toString())
            .replace('{x}', options.coords.x.toString())
            .replace('{y}', options.coords.y.toString()),
          timestamp: Date.now()
        };
        
        const tileKey = `tile_${options.coords.z}_${options.coords.x}_${options.coords.y}`;
        
        // Use localForage directly to avoid function references
        localforage.setItem(tileKey, tileData)
          .then(function() {
            resolve();
          })
          .catch(function(err) {
            reject(err);
          });
      });
    };

    // Define error handler separately
    const handleTileSaveError = function(err: any) {
      console.error('Failed to save tile:', err);
    };

    offlineLayer.on('tileloadend', function(e: any) {
      if (offlineLayer.saveTile && e.coords) {
        // Use the enhanced save method
        offlineLayer.saveTile({ coords: e.coords })
          .catch(handleTileSaveError);
      }
    });

    offlineLayer.addTo(map);
    tileLayerRef.current = offlineLayer;
    onOfflineLayerReady(offlineLayer);

    // Initial map view and restriction
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    const enforceRestrictions = function() {
      const currentZoom = map.getZoom();

      if (currentZoom > DEFAULT_ZOOM) {
        setAllowZoomOut(true);
      }

      if (!allowZoomOut && currentZoom < DEFAULT_ZOOM) {
        map.setZoom(DEFAULT_ZOOM);
      } else if (allowZoomOut && currentZoom < MIN_ZOOM_UNLOCKED) {
        map.setZoom(MIN_ZOOM_UNLOCKED);
      }

      if (!manoloFortichBounds.contains(map.getCenter())) {
        map.panInsideBounds(manoloFortichBounds, { animate: false });
      }
    };

    map.on('zoomend', enforceRestrictions);
    map.on('move', enforceRestrictions);

    setTimeout(function() {
      map.invalidateSize();
    }, 100);

    return function() {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
      offlineLayer.remove();
    };
  }, [map, allowZoomOut, onOfflineLayerReady]);

  return <CreateOutlineControl onClick={onOpenForm} />;
};

// Main Map Component
const MapCon: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [photoTags, setPhotoTags] = useState<PhotoTagData[]>([]);
  const [selectedPhotoTagId, setSelectedPhotoTagId] = useState<string | null>(null);
  const [offlineLayer, setOfflineLayer] = useState<any>(null);
  const [isDownloadingTiles, setIsDownloadingTiles] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  // Use a useCallback to memoize the loading function to prevent infinite re-renders
  const loadPhotoTags = useCallback(function() {
    const tags = PhotoTagLocalStorage.getAllPhotoTags();
    setPhotoTags(tags);
  }, []);

  // Use useIonViewWillEnter to refresh data whenever the view is navigated to
  useIonViewWillEnter(function() {
    loadPhotoTags();
  });

  // useEffect for initial mount/unmount logic
  useEffect(function() {
    setIsMounted(true);
    return function() {
      setIsMounted(false);
    };
  }, []);

  // Memoize callbacks to prevent infinite re-renders
  const handleOfflineLayerReady = useCallback(function(layer: any) {
    setOfflineLayer(layer);
    setIsDownloadingTiles(true);
  }, []);

  const handleTileDownloadProgress = useCallback(function(current: number, total: number) {
    setDownloadProgress({ current, total });
  }, []);

  const handleTileDownloadComplete = useCallback(function() {
    setIsDownloadingTiles(false);
    setDownloadProgress({ current: 0, total: 0 });
    console.log('✅ All tiles downloaded successfully');
  }, []);

  const handleFormDismiss = useCallback(function() {
    setShowForm(false);
    loadPhotoTags();
  }, [loadPhotoTags]);

  const handleFormSuccess = useCallback(function() {
    setShowForm(false);
    loadPhotoTags();
  }, [loadPhotoTags]);

  const handleMarkerClick = useCallback(function(photoTagId: string) {
    setSelectedPhotoTagId(photoTagId);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .create-outline-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          cursor: pointer;
        }
        .create-outline-btn:hover {
          background: #f4f4f4;
          transform: scale(1.1);
        }
        
        /* Ensure Leaflet markers display correctly */
        .leaflet-marker-icon {
          border: none !important;
          background: transparent !important;
        }
        
        /* Make blue markers more interactive */
        .leaflet-marker-icon:hover {
          transform: scale(1.2);
          transition: transform 0.2s ease;
          z-index: 1000;
        }

        /* Popup overlay */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Download progress bar at the bottom */
        .download-progress-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 20px;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
          transition: opacity 0.3s ease;
        }

        .download-progress-text {
          margin-bottom: 8px;
          font-size: 14px;
          text-align: center;
          font-weight: 500;
        }

        .download-progress-bar {
          width: 100%;
          max-width: 400px;
          height: 6px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
          overflow: hidden;
        }

        .download-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #2e7d32);
          transition: width 0.3s ease;
          border-radius: 3px;
        }

        .download-progress-stats {
          margin-top: 6px;
          font-size: 12px;
          opacity: 0.8;
        }

        /* Download complete animation */
        @keyframes downloadComplete {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .download-complete {
          animation: downloadComplete 1s ease-in-out 2;
        }

        /* Map container styles to ensure proper rendering */
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
      `}</style>

      {isMounted && (
        <>
          {/* Download progress bar at the bottom */}
          {isDownloadingTiles && (
            <div className="download-progress-container">
              <div className="download-progress-text">
                Downloading Manolo Fortich map for offline use...
              </div>
              <div className="download-progress-bar">
                <div 
                  className="download-progress-fill"
                  style={{ 
                    width: `${downloadProgress.total > 0 ? (downloadProgress.current / downloadProgress.total) * 100 : 0}%` 
                  }}
                />
              </div>
              <div className="download-progress-stats">
                {downloadProgress.current} / {downloadProgress.total} tiles
                {downloadProgress.total > 0 && (
                  <span> ({Math.round((downloadProgress.current / downloadProgress.total) * 100)}%)</span>
                )}
              </div>
            </div>
          )}

          <MapContainer
            center={[8.35985, 124.869077]}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            minZoom={MIN_ZOOM_LOCKED}
            maxZoom={MAX_ZOOM}
            maxBounds={manoloFortichBounds}
            maxBoundsViscosity={1.0}
          >
            {/* This only renders the base layer visually (non-offline) */}
            <TileLayer
              url={TILE_LAYER_URL}
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
            />
            
            {/* Display photo markers */}
            <PhotoMarkers
              photoTags={photoTags}
              onMarkerClick={handleMarkerClick}
            />
            
            <MapLogic 
              onOpenForm={function() {
                setShowForm(true);
              }} 
              onOfflineLayerReady={handleOfflineLayerReady}
            />
            
            {/* Auto-download tiles when offline layer is ready */}
            {offlineLayer && (
              <AutoDownloadTiles 
                tileLayer={offlineLayer}
                bounds={manoloFortichBounds}
                zoomLevels={[14, 15, 16]}
                onProgress={handleTileDownloadProgress}
                onComplete={handleTileDownloadComplete}
              />
            )}
          </MapContainer>

          <Form
            isOpen={showForm}
            onDismiss={handleFormDismiss}
            onSuccess={handleFormSuccess}
          />

          {/* Popup overlay and content */}
          {selectedPhotoTagId && (
            <>
              <div className="popup-overlay" onClick={function() {
                setSelectedPhotoTagId(null);
              }} />
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                width: '90%',
                maxWidth: '400px'
              }}>
                <MapMarkerPopup
                  photoTagId={selectedPhotoTagId}
                  onClose={function() {
                    setSelectedPhotoTagId(null);
                  }}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MapCon;