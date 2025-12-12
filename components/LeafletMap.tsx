import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LeafletMapProps {
  lat: number;
  lng: number;
  name: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ lat, lng, name }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix marker icon issue in React/Leaflet bundler environment
    // Use a generic SVG or default online marker if local assets fail
    const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    if (!mapInstanceRef.current) {
      // Initialize Map
      const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
      mapInstanceRef.current = map;

      // Tencent Map Tile Layer
      // Using 'tms: true' because Tencent's y-axis is often inverted in standard XYZ vs TMS
      // URL: http://rt1.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1
      L.tileLayer('https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1&version=298', {
        subdomains: '0123',
        tms: true, // Key for Tencent/Google TMS coordinate conversion
        attribution: '&copy; Tencent Maps'
      }).addTo(map);

      // Add Marker
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
    } else {
      // Update View if props change
      mapInstanceRef.current.setView([lat, lng], 13);
      
      // Clear existing markers (simplification for this demo)
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current?.removeLayer(layer);
        }
      });

      L.marker([lat, lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
    }

    // Cleanup not strictly necessary for ref-based instance reuse in this modal context, 
    // but good practice if component unmounts
    return () => {
      // We keep the instance alive if we want to reuse, but for a modal that unmounts content, destroy is safer
      if (mapInstanceRef.current) {
         mapInstanceRef.current.remove();
         mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 relative z-0">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
    </div>
  );
};