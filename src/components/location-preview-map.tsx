"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { ExternalLink, MapPin } from "lucide-react";

interface LocationPreviewMapProps {
  lat: number;
  lng: number;
  onOpenPicker?: () => void;
}

export default function LocationPreviewMap({
  lat,
  lng,
  onOpenPicker,
}: LocationPreviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Marker
    const icon = L.divIcon({
      className: "custom-preview-marker",
      html: `
        <div style="width: 28px; height: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <svg width="28" height="36" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 43C18 43 32 28.5 32 17C32 9.26801 25.732 3 18 3C10.268 3 4 9.26801 4 17C4 28.5 18 43 18 43Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
            <circle cx="18" cy="17" r="6" fill="#FFFFFF"/>
            <circle cx="18" cy="17" r="2.5" fill="#2563EB"/>
          </svg>
        </div>
      `,
      iconSize: [28, 36],
      iconAnchor: [14, 34],
    });

    L.marker([lat, lng], { icon }).addTo(map);

    // Geofence circle
    L.circle([lat, lng], {
      radius: 100,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.16,
      weight: 2,
      dashArray: "3 3",
    }).addTo(map);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div
      onClick={onOpenPicker}
      style={{ isolation: "isolate" }}
      className="relative z-0 isolate w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-zinc-200 shadow-2xs group cursor-pointer bg-slate-100"
      title="Click to open interactive map"
    >
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-blue-900/20 transition-colors flex items-center justify-center pointer-events-none">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs text-blue-600 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm border border-blue-200 flex items-center gap-1.5">
          <ExternalLink size={13} />
          <span>Click to Adjust Pin on Map</span>
        </span>
      </div>

      {/* Geofence Tag */}
      <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-semibold text-zinc-700 border border-zinc-200 shadow-2xs flex items-center gap-1">
        <MapPin size={11} className="text-blue-600" />
        <span>100m Geofence Radius</span>
      </div>
    </div>
  );
}
