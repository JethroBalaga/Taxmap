import { MapContainer, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';

const MapCon: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[8.35985, 124.869077]}
        zoom={18}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
};

export default MapCon;