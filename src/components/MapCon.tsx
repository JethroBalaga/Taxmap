import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.offline';
import localforage from 'localforage';
import { geoTags } from '../components/geotags';
import { createBlueMarkerIcon } from '../utils/markerIcons';

// Define bounds for Manolo Fortich area
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),
  L.latLng(8.45, 124.95)
);

const DEFAULT_ZOOM = 16;
const MIN_ZOOM_LOCKED = 14;
const MIN_ZOOM_UNLOCKED = 12;
const MAX_ZOOM = 18;
const TILE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

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
const MapController = () => {
  const map = useMap();
  const [allowZoomOut, setAllowZoomOut] = useState(false);
  const tileLayerRef = useRef<any>(null);
  const controlRef = useRef<any>(null);

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

    const control = (L.control as any).savetiles(offlineLayer, {
      zoomlevels: [MIN_ZOOM_UNLOCKED, MAX_ZOOM],
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

  return null;
};

// Main map component
const MapCon: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      overflow: 'hidden',
      position: 'relative' 
    }}>
      {isMounted && (
        <MapContainer
          center={[8.35985, 124.869077]}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          minZoom={MIN_ZOOM_LOCKED}
          maxZoom={MAX_ZOOM}
          maxBounds={manoloFortichBounds}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url={TILE_LAYER_URL}
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          />
          <MapController />
          <MarkersLayer />
        </MapContainer>
      )}
    </div>
  );
};

export default MapCon;