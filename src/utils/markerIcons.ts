// src/utils/markerIcons.ts
import L from 'leaflet';
import buildingMarkerIconUrl from '../assets/Building.png';
import equipmentMarkerIconUrl from '../assets/Equipment.png';
import landMarkerIconUrl from '../assets/Land.png';

export const createBuildingMarkerIcon = () => {
  return L.icon({
    iconUrl: buildingMarkerIconUrl,
    iconSize: [45, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

export const createEquipmentMarkerIcon = () => {
  return L.icon({
    iconUrl: equipmentMarkerIconUrl,
    iconSize: [45, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

export const createLandMarkerIcon = () => {
  return L.icon({
    iconUrl: landMarkerIconUrl,
    iconSize: [45, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

// Helper function to get the appropriate icon based on kind
export const getMarkerIconByKind = (kind: string) => {
  switch (kind?.toUpperCase()) {
    case 'BUILDING':
      return createBuildingMarkerIcon();
    case 'MACHINERY':
      return createEquipmentMarkerIcon();
    case 'LAND':
      return createLandMarkerIcon();
    default:
      return createLandMarkerIcon(); // Default fallback
  }
};