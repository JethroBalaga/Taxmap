import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define bounds for Manolo Fortich area
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),  // SW corner
  L.latLng(8.45, 124.95)   // NE corner
);

const DEFAULT_ZOOM = 14;
const MIN_ZOOM_LOCKED = 14; // Initial zoom level (cannot zoom out)
const MIN_ZOOM_UNLOCKED = 12; // Allowed after zooming in
const MAX_ZOOM = 18;

const MapController = () => {
  const map = useMap();
  const [allowZoomOut, setAllowZoomOut] = useState(false);

  // Enforce bounds and zoom constraints
  const enforceRestrictions = () => {
    const currentZoom = map.getZoom();
    
    // If zoomed in past default, enable zooming out further
    if (currentZoom > DEFAULT_ZOOM) {
      setAllowZoomOut(true);
    }

    // Prevent zooming out beyond allowed levels
    if (!allowZoomOut && currentZoom < DEFAULT_ZOOM) {
      map.setZoom(DEFAULT_ZOOM);
    } else if (allowZoomOut && currentZoom < MIN_ZOOM_UNLOCKED) {
      map.setZoom(MIN_ZOOM_UNLOCKED);
    }

    // Always enforce pan boundaries
    if (!manoloFortichBounds.contains(map.getCenter())) {
      map.panInsideBounds(manoloFortichBounds, { animate: false });
    }
  };

  useEffect(() => {
    // Set initial view
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    // Event listeners
    map.on('zoomend', enforceRestrictions);
    map.on('move', enforceRestrictions);

    // Initial resize
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
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
          minZoom={MIN_ZOOM_LOCKED} // Initial minimum zoom
          maxZoom={MAX_ZOOM}
          maxBounds={manoloFortichBounds}
          maxBoundsViscosity={1.0}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={true}
          />
          <MapController />
        </MapContainer>
      )}
    </div>
  );
};

export default MapCon;