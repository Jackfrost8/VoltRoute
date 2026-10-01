import { createContext, useState, useEffect } from 'react';

export const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        // Default location (e.g., center of US or a specific city)
        setLocation({ lat: 37.7749, lng: -122.4194 }); // SF default
      }
    );
  }, []);

  return (
    <LocationContext.Provider value={{ location, error, loading }}>
      {children}
    </LocationContext.Provider>
  );
};
