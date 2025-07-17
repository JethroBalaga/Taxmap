import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define bounds for Manolo Fortich area (approximate coordinates)
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),  // SW corner
  L.latLng(8.45, 124.95)   // NE corner
);

const MapCon: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const centerPosition: [number, number] = [8.35985, 124.869077]; // Center of Manolo Fortich

  useEffect(() => {
    if (mapRef.current) {
      // Set map bounds and disable scroll beyond them
      mapRef.current.setMaxBounds(manoloFortichBounds);
      mapRef.current.on('drag', () => {
        mapRef.current?.panInsideBounds(manoloFortichBounds, { animate: false });
      });

      // Initial resize
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 0);
    }
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <MapContainer
        center={centerPosition}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        minZoom={12}
        maxBounds={manoloFortichBounds}
        maxBoundsViscosity={1.0} // Strict bounds enforcement
        dragging={true}
        touchZoom={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true} // Prevent tile wrapping around the globe
        />
      </MapContainer>
    </div>
  );
};

export default MapCon;