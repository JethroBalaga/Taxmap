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
const MIN_ZOOM = 12;
const MAX_ZOOM = 18;

const MapController = () => {
  const map = useMap();

  const handleZoom = () => {
    if (map.getZoom() < MIN_ZOOM) map.setZoom(MIN_ZOOM);
    if (map.getZoom() > MAX_ZOOM) map.setZoom(MAX_ZOOM);
  };

  const handleDrag = () => {
    map.panInsideBounds(manoloFortichBounds, { animate: false });
  };

  useEffect(() => {
    map.setMaxBounds(manoloFortichBounds);
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);

    map.on('zoom', handleZoom);
    map.on('drag', handleDrag);
    map.on('zoomend', handleZoom);

    // Initial resize
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.off('zoom', handleZoom);
      map.off('drag', handleDrag);
      map.off('zoomend', handleZoom);
    };
  }, [map]);

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
          minZoom={MIN_ZOOM}
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