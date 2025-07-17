// src/utils/markerIcons.ts
import L from 'leaflet';

export const createBlueMarkerIcon = () => {
  return L.icon({
    iconUrl: require('../Assets/Blue.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};