import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Loader2 } from 'lucide-react';

interface LeafletMapProps {
  lat: number;
  lng: number;
  name: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ lat, lng, name }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix marker icon issue
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

    // Initialize Map if not exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
      mapInstanceRef.current = map;

      // Tencent Map Tile Layer
      L.tileLayer('https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1&version=298', {
        subdomains: '0123',
        tms: true, 
        attribution: '&copy; Tencent Maps'
      }).addTo(map);

      // Destination Marker
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
    } else {
      // Update destination if props change
      mapInstanceRef.current.setView([lat, lng], 13);
      
      // Basic cleanup of markers (simple approach)
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
           // Don't remove user marker if we add it later, but here we rebuild roughly
           // Ideally we manage markers better, but for this demo:
           if (layer.getLatLng().lat !== userLocation?.lat) {
               // mapInstanceRef.current?.removeLayer(layer); 
           }
        }
      });
    }

    // Get User Location for Routing
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          setLoadingLocation(false);

          if (mapInstanceRef.current) {
             // Add User Marker
             const userIcon = L.divIcon({
                 className: 'bg-teal-500 rounded-full border-2 border-white shadow-lg',
                 iconSize: [16, 16],
             });
             L.marker([userLat, userLng], { icon: userIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('您的位置');

             // Add Routing
             const Leaflet = L as any;
             if (Leaflet.Routing) {
                 if (routingControlRef.current) {
                     mapInstanceRef.current.removeControl(routingControlRef.current);
                 }

                 routingControlRef.current = Leaflet.Routing.control({
                     waypoints: [
                         L.latLng(userLat, userLng),
                         L.latLng(lat, lng)
                     ],
                     router: new Leaflet.Routing.OSRMv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1'
                     }),
                     lineOptions: {
                         styles: [{ color: '#0d9488', opacity: 0.8, weight: 6 }]
                     },
                     createMarker: function() { return null; }, // We already added custom markers
                     show: false, // Hide the instruction panel (we handle via CSS too)
                     addWaypoints: false,
                     routeWhileDragging: false,
                     fitSelectedRoutes: true,
                     showAlternatives: false
                 }).addTo(mapInstanceRef.current);
             }
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoadingLocation(false);
        }
      );
    } else {
        setLoadingLocation(false);
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
         mapInstanceRef.current.remove();
         mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 relative z-0 group">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
      
      {/* Overlay Status */}
      <div className="absolute top-2 right-2 z-[400] flex flex-col gap-2 pointer-events-none">
        {loadingLocation && (
            <div className="bg-white/90 backdrop-blur text-xs px-3 py-1.5 rounded-full shadow-sm text-slate-600 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                正在定位...
            </div>
        )}
        {userLocation && (
             <div className="bg-teal-500/90 backdrop-blur text-xs px-3 py-1.5 rounded-full shadow-sm text-white flex items-center gap-2">
                <Navigation className="w-3 h-3" />
                已规划路线
            </div>
        )}
      </div>
      
      {/* External Map Link */}
      <a 
         href={`https://apis.map.qq.com/uri/v1/routeplan?type=drive&to=${name}&tocoord=${lat},${lng}&policy=1&referer=ChinaTravel`}
         target="_blank"
         rel="noreferrer"
         className="absolute bottom-2 right-2 z-[400] bg-white text-slate-800 hover:bg-teal-50 px-3 py-2 rounded-lg shadow-md text-xs font-bold transition-all flex items-center gap-1.5 pointer-events-auto"
      >
          <img src="https://map.qq.com/favicon.ico" className="w-4 h-4" alt="Tencent" />
          打开腾讯地图
      </a>
    </div>
  );
};