
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Loader2, MapPin, Info, Car } from 'lucide-react';
import { Attraction } from '../types';

interface LeafletMapProps {
  lat: number;
  lng: number;
  name: string;
  allAttractions?: Attraction[];
}

interface RouteSummary {
  distance: number;
  time: number;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ lat, lng, name, allAttractions = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const nearbyMarkersRef = useRef<L.Marker[]>([]);

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  // Helper to create user icon with pulsing effect
  const createUserIcon = () => L.divIcon({
     className: 'bg-transparent',
     html: `<div class="relative flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-teal-500 border-2 border-white shadow-sm"></span>
            </div>`,
     iconSize: [16, 16],
     iconAnchor: [8, 8]
  });

  // Helper for small nearby markers
  const createNearbyIcon = (isTarget = false) => L.divIcon({
    className: 'bg-transparent',
    html: `<div class="flex items-center justify-center h-6 w-6 ${isTarget ? 'text-rose-500' : 'text-slate-400 opacity-70'} hover:opacity-100 hover:scale-125 transition-all">
             <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix: Move function declarations before their usage in the setup logic
    const renderNearbyAttractions = (map: L.Map) => {
        // Clear old markers
        nearbyMarkersRef.current.forEach(m => m.remove());
        nearbyMarkersRef.current = [];

        const targetLatLng = L.latLng(lat, lng);
        
        // Find attractions within 100km
        const nearby = allAttractions.filter(attr => {
            if (!attr.coordinates || attr.id === name || (attr.coordinates.lat === lat && attr.coordinates.lng === lng)) return false;
            const dist = targetLatLng.distanceTo(L.latLng(attr.coordinates.lat, attr.coordinates.lng));
            return dist < 100000; // 100km
        });

        nearby.forEach(attr => {
            const marker = L.marker([attr.coordinates!.lat, attr.coordinates!.lng], {
                icon: createNearbyIcon(false)
            }).addTo(map).bindPopup(`
                <div class="text-xs p-1">
                    <p class="font-bold text-slate-800">${attr.name}</p>
                    <p class="text-slate-500">${attr.province}</p>
                    <button class="mt-2 text-teal-600 hover:underline font-medium block" onclick="window.location.hash='#explore-${attr.id}'">点击查看详情</button>
                </div>
            `);
            nearbyMarkersRef.current.push(marker);
        });
    };

    const updateRouteStart = (startLat: number, startLng: number, popupText: string) => {
        if (!mapInstanceRef.current) return;

        setUserLocation({ lat: startLat, lng: startLng });
        setLoadingLocation(false);

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([startLat, startLng]);
            userMarkerRef.current.setPopupContent(popupText).openPopup();
        } else {
            userMarkerRef.current = L.marker([startLat, startLng], { icon: createUserIcon() })
                .addTo(mapInstanceRef.current)
                .bindPopup(popupText)
                .openPopup();
        }

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
                    createMarker: function() { return null; },
                    show: false,
                    addWaypoints: false,
                    routeWhileDragging: false,
                    fitSelectedRoutes: true,
                    showAlternatives: false
                }).addTo(mapInstanceRef.current);

                routingControlRef.current.on('routesfound', (e: any) => {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    setRouteSummary({
                        distance: summary.totalDistance / 1000,
                        time: summary.totalTime / 60
                    });
                });
            }
        }
    };

    if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1&version=298', {
            subdomains: '0123',
            tms: true, 
            attribution: '&copy; Tencent Maps'
        }).addTo(map);

        // Destination Marker
        L.marker([lat, lng], { icon: createNearbyIcon(true) })
            .addTo(map)
            .bindPopup(`<b>${name}</b>`)
            .openPopup();

        // Handle clicks for starting point
        map.on('click', (e) => {
            const { lat: clickLat, lng: clickLng } = e.latlng;
            updateRouteStart(clickLat, clickLng, '已选起点');
        });

        // Add nearby attractions
        renderNearbyAttractions(map);
    }

    if (navigator.geolocation && !userMarkerRef.current) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!userMarkerRef.current) {
                    updateRouteStart(position.coords.latitude, position.coords.longitude, '您的位置');
                }
            },
            (err) => {
                console.warn('Geolocation failed', err);
                setLoadingLocation(false);
            },
            { timeout: 5000 }
        );
    } else {
        if (loadingLocation && !navigator.geolocation) setLoadingLocation(false);
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            routingControlRef.current = null;
            userMarkerRef.current = null;
            nearbyMarkersRef.current = [];
        }
    };
  }, [lat, lng, name, allAttractions]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 relative z-0 group">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
      
      {/* Overlay Status */}
      <div className="absolute top-2 right-2 z-[400] flex flex-col gap-2 pointer-events-none">
        {loadingLocation && (
            <div className="bg-white/95 backdrop-blur-sm text-[10px] px-3 py-1.5 rounded-full shadow-sm text-slate-600 flex items-center gap-2 animate-pulse border border-slate-100">
                <Loader2 className="w-3 h-3 animate-spin" />
                正在定位...
            </div>
        )}
        <div className="bg-white/95 backdrop-blur-sm text-[10px] px-3 py-1.5 rounded-full shadow-sm text-slate-500 flex items-center gap-1.5 border border-slate-100">
             <MapPin className="w-3 h-3 text-rose-500" />
             <span>点图重选起点 · 发现周边</span>
        </div>
      </div>

      {/* Route Summary Overlay */}
      <AnimatePresence>
        {routeSummary && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-16 left-2 right-2 z-[400] flex justify-center"
          >
            <div className="bg-white/90 backdrop-blur-md border border-teal-100 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-4">
              <div className="p-2 bg-teal-50 rounded-xl">
                 <Car className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">自驾预计</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-800 tracking-tighter">
                    {routeSummary.distance.toFixed(1)} <span className="text-sm font-normal text-slate-500 ml-0.5">KM</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xl font-black text-teal-600 tracking-tighter">
                    {Math.round(routeSummary.time)} <span className="text-sm font-normal text-slate-500 ml-0.5">MIN</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* External Map Link */}
      <a 
         href={`https://apis.map.qq.com/uri/v1/routeplan?type=drive&to=${name}&tocoord=${lat},${lng}&policy=1&referer=ChinaTravel`}
         target="_blank"
         rel="noreferrer"
         className="absolute bottom-2 right-2 z-[400] bg-white/95 text-slate-800 hover:bg-teal-50 px-3 py-2 rounded-lg shadow-md text-xs font-bold transition-all flex items-center gap-1.5 pointer-events-auto border border-slate-100"
      >
          <img src="https://map.qq.com/favicon.ico" className="w-4 h-4" alt="Tencent" />
          打开腾讯地图
      </a>
    </div>
  );
};
