import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

const Map = ({ orders }) => {
    // Default center (e.g., New York or a generic location)
    const defaultCenter = [40.7128, -74.0060];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {orders && orders.map((order) => (
                // For MVP, we might not have coordinates in the order address string.
                // We would ideally geocode here or have lat/lng in the order.
                // For now, we'll skip markers if no lat/lng, or mock it if we want to see something.
                // This is a placeholder for where markers would go.
                // <Marker key={order.id} position={[lat, lng]}>
                //   <Popup>
                //     {order.restaurant} <br /> {order.address}
                //   </Popup>
                // </Marker>
                null
            ))}
        </MapContainer>
    );
};

export default Map;
