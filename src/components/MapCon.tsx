import { MapContainer, TileLayer } from "react-leaflet";

const MapCon: React.FC = () => {
  return (
    <MapContainer
      style={{ height: "100vh", width: "100%" }}
      center={[8.35985, 124.869077]}
      zoom={18}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default MapCon;
