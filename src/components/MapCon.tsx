import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline';
import localforage from 'localforage';
import { geoTags } from './geotags';
import { createBlueMarkerIcon } from '../utils/markerIcons';
import GeoTagging from './GeoTagging';

// Define bounds for Manolo Fortich area
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),
  L.latLng(8.45, 124.95)
);

const DEFAULT_ZOOM = 14;
const MIN_ZOOM_LOCKED = 14;
const MIN_ZOOM_UNLOCKED = 12;
const MAX_ZOOM = 18;
const TILE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Create-outline SVG path
const CREATE_OUTLINE_PATH = "M384 224v184a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V168a40 40 0 0 1 40-40h167.48M336 64h112v112M224 288L440 72";

// Custom control with create-outline icon in a circle
const CreateOutlineControl = ({ onClick }: { onClick: () => void }) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function() {
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

    return () => {
      controlRef.current?.remove();
    };
  }, [map, onClick]);

  return null;
};

// Component to handle markers display
const MarkersLayer = () => {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);
  const blueMarkerIcon = createBlueMarkerIcon();

  useEffect(() => {
    markersRef.current.forEach(marker => marker.removeFrom(map));
    
    markersRef.current = geoTags.map(tag => {
      const marker = L.marker([tag.Latitude, tag.Longitude], {
        icon: blueMarkerIcon
      }).addTo(map);
      
      marker.bindPopup(`
        <b>Residence:</b> ${tag.Residence}<br>
        <b>Address:</b> ${tag.Address}<br>
        <b>House #:</b> ${tag.HouseNumber}<br>
        <small>Tagged on: ${tag.Timestamp?.toLocaleString()}</small>
      `);
      
      return marker;
    });

    if (geoTags.length > 0) {
      const markerGroup = new L.FeatureGroup(markersRef.current);
      map.fitBounds(markerGroup.getBounds().pad(0.2));
    }

    return () => {
      markersRef.current.forEach(marker => marker.removeFrom(map));
    };
  }, [geoTags.length]);

  return null;
};

// Component to handle map controls
const MapController = ({ onOpenGeoTagging }: { onOpenGeoTagging: () => void }) => {
  const map = useMap();
  const [allowZoomOut, setAllowZoomOut] = useState(false);
  const tileLayerRef = useRef<any>(null);

  const initOfflineLayer = () => {
    localforage.config({
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
      ],
      name: 'ManoloFortichMap',
      storeName: 'map_tiles'
    });

    const offlineLayer = (L.tileLayer as any).offline(TILE_LAYER_URL, {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
      noWrap: true,
      minZoom: MIN_ZOOM_LOCKED,
      maxZoom: MAX_ZOOM
    });

    offlineLayer.on('tileloadend', (event: any) => {
      if (offlineLayer.saveTile) {
        offlineLayer.saveTile(event.tile);
      }
    });

    offlineLayer.addTo(map);
    tileLayerRef.current = offlineLayer;

    return () => {
      offlineLayer.remove();
    };
  };

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
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    const cleanup = initOfflineLayer();

    map.on('zoomend', enforceRestrictions);
    map.on('move', enforceRestrictions);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
      cleanup();
    };
  }, [map, allowZoomOut]);

  return (
    <>
      <CreateOutlineControl onClick={onOpenGeoTagging} />
    </>
  );
};

// Main map component
const MapCon: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showGeoTagging, setShowGeoTagging] = useState(false);
  const [refreshMarkers, setRefreshMarkers] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleTagSuccess = () => {
    setShowGeoTagging(false);
    setRefreshMarkers(prev => !prev);
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      overflow: 'hidden',
      position: 'relative',
      margin: 0,
      padding: 0 
    }}>
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
          transition: all 0.2s;
          cursor: pointer;
        }
        .create-outline-btn:hover {
          background: #f4f4f4;
          transform: scale(1.1);
        }
        .create-outline-btn svg {
          color: #333;
        }
        body {
          overflow: hidden;
        }
      `}</style>
      
      {isMounted && (
        <>
          <MapContainer
            center={[8.35985, 124.869077]}
            zoom={DEFAULT_ZOOM}
            style={{ 
              height: '100%', 
              width: '100%',
              margin: 0,
              padding: 0 
            }}
            minZoom={MIN_ZOOM_LOCKED}
            maxZoom={MAX_ZOOM}
            maxBounds={manoloFortichBounds}
            maxBoundsViscosity={1.0}
            key={refreshMarkers.toString()}
          >
            <TileLayer
              url={TILE_LAYER_URL}
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
            />
            <MapController onOpenGeoTagging={() => setShowGeoTagging(true)} />
            <MarkersLayer />
          </MapContainer>
          
          <GeoTagging 
            isOpen={showGeoTagging}
            onDismiss={() => setShowGeoTagging(false)}
            onSuccess={handleTagSuccess}
          />
        </>
      )}
    </div>
  );
};

export default MapCon;