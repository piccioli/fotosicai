import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const TILE_URL = 'https://api.webmapp.it/tiles/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; CAI &copy; OpenStreetMap';

export default function LocationPicker({ initialPosition, onChange }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (leafletRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [initialPosition.lat, initialPosition.lng],
      initialPosition.lat === 42.5 ? 6 : 14
    );
    leafletRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41],
    });

    const marker = L.marker([initialPosition.lat, initialPosition.lng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      onChange({ lat, lng });
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange({ lat, lng });
    });

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Update marker if initialPosition changes externally
  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.setLatLng([initialPosition.lat, initialPosition.lng]);
    if (leafletRef.current) leafletRef.current.setView([initialPosition.lat, initialPosition.lng], Math.max(leafletRef.current.getZoom(), 12));
  }, [initialPosition.lat, initialPosition.lng]);

  return <div ref={mapRef} className="map-picker" />;
}
