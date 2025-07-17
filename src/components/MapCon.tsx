import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline';
import localforage from 'localforage';

// Define bounds for Manolo Fortich area
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),  // SW corner
  L.latLng(8.45, 124.95)   // NE corner
);

const DEFAULT_ZOOM = 14;
const MIN_ZOOM_LOCKED = 14;
const MIN_ZOOM_UNLOCKED = 12;
const MAX_ZOOM = 18;
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const MapController = () => {
  const map = useMap();
  const [allowZoomOut, setAllowZoomOut] = useState(false);
  const tileLayerRef = useRef<any>(null);
  const controlRef = useRef<any>(null);

  // Initialize offline tile layer
  const initOfflineLayer = () => {
    // Configure localforage
    localforage.config({
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
      ],
      name: 'ManoloFortichMap',
      storeName: 'map_tiles'
    });

    // Create offline tile layer
    const offlineLayer = (L.tileLayer as any).offline(TILE_LAYER_URL, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      noWrap: true,
      subdomains: 'abc',
      minZoom: MIN_ZOOM_LOCKED,
      maxZoom: MAX_ZOOM
    });

    // Add control for saving tiles
    const control = (L.control as any).savetiles(offlineLayer, {
      zoomlevels: [MIN_ZOOM_UNLOCKED, MAX_ZOOM], // zoom levels to cache
      confirm(layer: any, successCallback: () => void) {
        if (window.confirm(`Save tiles for offline use?`)) {
          successCallback();
        }
      },
      confirmRemoval(layer: any, successCallback: () => void) {
        if (window.confirm('Remove all saved tiles?')) {
          successCallback();
        }
      },
      saveText: '<i class="fa fa-download"></i>',
      rmText: '<i class="fa fa-trash"></i>',
    });

    offlineLayer.addTo(map);
    control.addTo(map);

    tileLayerRef.current = offlineLayer;
    controlRef.current = control;

    return () => {
      offlineLayer.remove();
      control.remove();
    };
  };

  // Enforce bounds and zoom constraints
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

  useEffect(() => {
    // Set initial view
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    // Initialize offline functionality
    const cleanup = initOfflineLayer();

    // Event listeners
    map.on('zoomend', enforceRestrictions);
    map.on('move', enforceRestrictions);

    // Initial resize
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
      cleanup();
    };
  }, [map, allowZoomOut]);

  return null;
};

const MapCon: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        height: '100vh', 
        width: '100%', 
        overflow: 'hidden',
        position: 'relative' 
      }}
    >
      {isMounted && (
        <MapContainer
          center={[8.35985, 124.869077]}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          minZoom={MIN_ZOOM_LOCKED}
          maxZoom={MAX_ZOOM}
          maxBounds={manoloFortichBounds}
          maxBoundsViscosity={1.0}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          zoomControl={true}
        >
          <MapController />
        </MapContainer>
      )}
    </div>
  );
};

export default MapCon;