import { MapContainer, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

const MapCon: React.FC = () => {
  return (
    <MapContainer
      style={{ height: "100vh", width: "100%" }}
      center={[8.35985, 124.869077] as [number, number]}
      scrollWheelZoom={false} 
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default MapCon;