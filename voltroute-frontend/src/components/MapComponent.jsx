import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../hooks/useLocation';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle dynamic map centering
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
};

const MapComponent = ({ stations = [], onMarkerClick, routePoints }) => {
  const { location } = useLocation();
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // SF default

  const center = location || defaultCenter;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} />

      {location && (
        <Marker position={[location.lat, location.lng]}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(station),
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong className="block mb-1">{station.name}</strong>
              <span>{station.powerKw || 'Standard'} kW | {station.connectorType}</span>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* If route points exist, you would render a Polyline here, 
          but for simplicity in this setup, we just show markers. */}
    </MapContainer>
  );
};

export default MapComponent;
