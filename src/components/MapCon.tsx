// src/components/MapCon.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline'; // offline plugin
import localforage from 'localforage';
import Form from './Modals/Form';
import { PhotoTagLocalStorage, PhotoTagData } from '../utils/tablestorages/PhotoTagLocalStorage';
import { createBlueMarkerIcon } from '../utils/markerIcons';

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
        L.DomEvent.on(link, 'click', (e) => {
          L.DomEvent.stop(e);
          onClick();
        });
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    return () => controlRef.current?.remove();
  }, [map, onClick]);

  return null;
};

// Photo Markers Component
const PhotoMarkers: React.FC<{ photoTags: PhotoTagData[] }> = ({ photoTags }) => {
  return (
    <>
      {photoTags.map((tag) => (
        <Marker
          key={tag.id}
          position={[tag.latitude, tag.longitude]}
          icon={createBlueMarkerIcon()}
          eventHandlers={{
            click: () => {
              // Show photo preview or details
              console.log('Photo clicked:', tag);
              // You can add a popup or modal here to show the photo
            }
          }}
        />
      ))}
    </>
  );
};

// Component to set up the map logic
const MapLogic = ({ onOpenForm }: { onOpenForm: () => void }) => {
  const map = useMap();
  const tileLayerRef = useRef<any>(null);
  const [allowZoomOut, setAllowZoomOut] = useState(false);

  useEffect(() => {
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

    offlineLayer.on('tileloadend', (e: any) => {
      if (offlineLayer.saveTile) {
        offlineLayer.saveTile(e.tile);
      }
    });

    offlineLayer.addTo(map);
    tileLayerRef.current = offlineLayer;

    // Initial map view and restriction
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    const enforceRestrictions = () => {
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

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
      offlineLayer.remove();
    };
  }, [map, allowZoomOut]);

  return <CreateOutlineControl onClick={onOpenForm} />;
};

// Main Map Component
const MapCon: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [photoTags, setPhotoTags] = useState<PhotoTagData[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Load existing photo tags on component mount
    const tags = PhotoTagLocalStorage.getAllPhotoTags();
    setPhotoTags(tags);
    return () => setIsMounted(false);
  }, []);

  // Refresh photo tags when form is closed (in case new tags were added)
  const handleFormDismiss = () => {
    setShowForm(false);
    // Reload photo tags to check for new additions
    const updatedTags = PhotoTagLocalStorage.getAllPhotoTags();
    setPhotoTags(updatedTags);
  };

  // Refresh photo tags when form completes successfully
  const handleFormSuccess = () => {
    setShowForm(false);
    // Reload photo tags to include the new addition
    const updatedTags = PhotoTagLocalStorage.getAllPhotoTags();
    setPhotoTags(updatedTags);
  };

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
      `}</style>

      {isMounted && (
        <>
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
            <PhotoMarkers photoTags={photoTags} />
            
            <MapLogic onOpenForm={() => setShowForm(true)} />
          </MapContainer>

          <Form
            isOpen={showForm}
            onDismiss={handleFormDismiss}
            onSuccess={handleFormSuccess}
          />
        </>
      )}
    </div>
  );
};

export default MapCon;