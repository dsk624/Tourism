
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Loader2, MapPin } from 'lucide-react';

interface LeafletMapProps {
  lat: number;
  lng: number;
  name: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ lat, lng, name }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Helper to create user icon with pulsing effect
  const createUserIcon = () => L.divIcon({
     className: 'bg-transparent', // Handled by inner HTML
     html: `<div class="relative flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-teal-500 border-2 border-white shadow-sm"></span>
            </div>`,
     iconSize: [16, 16],
     iconAnchor: [8, 8], // Center the icon
     popupAnchor: [0, -10]
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // --- 1. Map Initialization (Run only once) ---
    if (!mapInstanceRef.current) {
        // Fix Leaflet Default Icons
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

        const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
        mapInstanceRef.current = map;

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

        // --- Click Event for Custom Route Start ---
        map.on('click', (e) => {
            const { lat: clickLat, lng: clickLng } = e.latlng;
            updateRouteStart(clickLat, clickLng, '已选起点');
        });
    }

    // --- 2. Route Update Helper ---
    const updateRouteStart = (startLat: number, startLng: number, popupText: string) => {
        if (!mapInstanceRef.current) return;

        // Update State
        setUserLocation({ lat: startLat, lng: startLng });
        setLoadingLocation(false);

        // Update User Marker
        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([startLat, startLng]);
            userMarkerRef.current.setPopupContent(popupText).openPopup();
        } else {
            userMarkerRef.current = L.marker([startLat, startLng], { icon: createUserIcon() })
                .addTo(mapInstanceRef.current)
                .bindPopup(popupText)
                .openPopup();
        }

        // Update Routing Machine
        const Leaflet = L as any;
        if (Leaflet.Routing) {
            if (routingControlRef.current) {
                routingControlRef.current.setWaypoints([
                    L.latLng(startLat, startLng),
                    L.latLng(lat, lng)
                ]);
            } else {
                routingControlRef.current = Leaflet.Routing.control({
                    waypoints: [
                        L.latLng(startLat, startLng),
                        L.latLng(lat, lng)
                    ],
                    router: new Leaflet.Routing.OSRMv1({
                       serviceUrl: 'https://router.project-osrm.org/route/v1'
                    }),
                    lineOptions: {
                        styles: [{ color: '#0d9488', opacity: 0.8, weight: 6 }]
                    },
                    createMarker: function() { return null; }, // Hide default markers created by routing machine
                    show: false, // Hide instruction panel
                    addWaypoints: false,
                    routeWhileDragging: false,
                    fitSelectedRoutes: true,
                    showAlternatives: false
                }).addTo(mapInstanceRef.current);
            }
        }
    };

    // --- 3. Geolocation (Run if no user location set yet) ---
    // We check !userMarkerRef.current to prevent overwriting if user already clicked quickly
    if (navigator.geolocation && !userMarkerRef.current) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Double check inside callback to avoid race condition overwrite
                if (!userMarkerRef.current) {
                    updateRouteStart(position.coords.latitude, position.coords.longitude, '您的位置');
                }
            },
            (err) => {
                console.warn('Geolocation failed', err);
                setLoadingLocation(false);
            }
        );
    } else {
        if (loadingLocation && !navigator.geolocation) setLoadingLocation(false);
    }

    // Cleanup
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            routingControlRef.current = null;
            userMarkerRef.current = null;
        }
    };
  }, [lat, lng, name]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 relative z-0 group">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
      
      {/* Overlay Status */}
      <div className="absolute top-2 right-2 z-[400] flex flex-col gap-2 pointer-events-none">
        {loadingLocation && (
            <div className="bg-white/90 backdrop-blur text-xs px-3 py-1.5 rounded-full shadow-sm text-slate-600 flex items-center gap-2 animate-pulse">
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
        <div className="bg-white/90 backdrop-blur text-[10px] px-3 py-1.5 rounded-full shadow-sm text-slate-500 flex items-center gap-1.5 border border-slate-100">
             <MapPin className="w-3 h-3 text-teal-500" />
             <span>点击地图更改起点</span>
        </div>
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
