"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  X,
  Navigation,
  Search,
  Check,
  Loader2,
  Compass,
} from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number | null;
  initialLng: number | null;
  initialAddress: string;
  onConfirm: (data: { lat: number; lng: number; address: string }) => void;
}

// Default fallback coordinates (Subic Bay Freeport / Manila)
const DEFAULT_LAT = 14.8258;
const DEFAULT_LNG = 120.2819;

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialAddress,
  onConfirm,
}: LocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat ?? DEFAULT_LAT);
  const [currentLng, setCurrentLng] = useState<number>(initialLng ?? DEFAULT_LNG);
  const [address, setAddress] = useState<string>(initialAddress);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // Search autocomplete inside map
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = initialLat ?? DEFAULT_LAT;
      const lng = initialLng ?? DEFAULT_LNG;
      setCurrentLat(lat);
      setCurrentLng(lng);
      setAddress(initialAddress || "");
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [isOpen, initialLat, initialLng, initialAddress]);

  // Create clean vector marker icon
  const createMarkerIcon = () => {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="width: 36px; height: 46px; cursor: grab; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 43C18 43 32 28.5 32 17C32 9.26801 25.732 3 18 3C10.268 3 4 9.26801 4 17C4 28.5 18 43 18 43Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
            <circle cx="18" cy="17" r="6" fill="#FFFFFF"/>
            <circle cx="18" cy="17" r="2.5" fill="#2563EB"/>
          </svg>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 43],
    });
  };

  // Reverse geocode to find address name from coordinates
  const triggerReverseGeocode = (lat: number, lng: number) => {
    if (reverseDebounceRef.current) clearTimeout(reverseDebounceRef.current);

    setGeocoding(true);
    reverseDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data?.display_name) {
          setAddress(data.display_name);
        }
      } catch {
        // Keep existing address if reverse geocoding fails
      } finally {
        setGeocoding(false);
      }
    }, 450);
  };

  // Initialize and handle Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const startLat = initialLat ?? DEFAULT_LAT;
    const startLng = initialLng ?? DEFAULT_LNG;

    // Clean up previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialZoom = initialLat && initialLng ? 16 : 14;
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: initialZoom,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create Draggable Marker
    const marker = L.marker([startLat, startLng], {
      icon: createMarkerIcon(),
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Create 100-meter Geofence Circle
    const circle = L.circle([startLat, startLng], {
      radius: 100,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.18,
      weight: 2,
      dashArray: "4 4",
    }).addTo(map);
    circleRef.current = circle;

    // When marker is dragged
    marker.on("drag", () => {
      const pos = marker.getLatLng();
      circle.setLatLng(pos);
    });

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCurrentLat(pos.lat);
      setCurrentLng(pos.lng);
      circle.setLatLng(pos);
      triggerReverseGeocode(pos.lat, pos.lng);
    });

    // When user clicks anywhere on map
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCurrentLat(lat);
      setCurrentLng(lng);
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      triggerReverseGeocode(lat, lng);
    });

    // Continuous resize observer to prevent grey/broken tiles
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Explicit staggered size recalculations
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 300);
    const t4 = setTimeout(() => map.invalidateSize(), 600);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (reverseDebounceRef.current) clearTimeout(reverseDebounceRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLng]);

  // Handle Search Input in Map Modal
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (value.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowSearchResults(data.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setCurrentLat(lat);
    setCurrentLng(lng);
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setShowSearchResults(false);

    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
    }
  };

  // Handle "Use My Location" via Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLat(lat);
        setCurrentLng(lng);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
          markerRef.current.setLatLng([lat, lng]);
          circleRef.current.setLatLng([lat, lng]);
        }

        triggerReverseGeocode(lat, lng);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow GPS location in your browser settings.";
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      lat: currentLat,
      lng: currentLng,
      address: address.trim() || `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ isolation: "isolate" }}
      className="fixed inset-0 z-[9999] isolate bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col h-[620px] max-h-[92vh] overflow-hidden border border-zinc-200">
        {/* Header - Fixed Height */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Pin Workplace Location &amp; Geofence
              </h3>
              <p className="text-xs text-zinc-500">
                Click anywhere on the map or drag the pin. Blue circle shows the 100-meter punch radius.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Action Bar - Fixed Height */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white relative z-20 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              placeholder="Search workplace, landmark, or city..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
            {searchLoading && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-600"
              />
            )}

            {/* Dropdown Results */}
            {showSearchResults && (
              <ul className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100 z-50">
                {searchResults.map((r) => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelectSearchResult(r)}
                      className="w-full text-left px-3.5 py-2 text-xs text-zinc-700 hover:bg-blue-50 hover:text-blue-700 flex items-start gap-2 transition-colors cursor-pointer"
                    >
                      <MapPin size={13} className="mt-0.5 shrink-0 text-blue-600" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Current GPS Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-60 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
            title="Locate my current position using GPS"
          >
            {locating ? (
              <Loader2 size={14} className="animate-spin text-blue-600" />
            ) : (
              <Navigation size={14} className="text-blue-600" />
            )}
            <span>{locating ? "Locating..." : "Use My GPS"}</span>
          </button>
        </div>

        {/* Map Container - Expands to fit exact middle space */}
        <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Floating Instruction overlay badge */}
          <div className="absolute top-3 right-3 z-[400] pointer-events-none bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200/80 text-[11px] font-medium text-zinc-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Click map or drag pin</span>
          </div>

          {/* 100m Geofence Indicator Badge */}
          <div className="absolute bottom-3 left-3 z-[400] pointer-events-none bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm border border-blue-200 text-[10px] font-semibold text-blue-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-blue-600 bg-blue-100" />
            <span>100-Meter Geofence Zone</span>
          </div>
        </div>

        {/* Footer - Fixed Height */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 shrink-0 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-zinc-700 uppercase tracking-wider text-[11px]">
                Pinned Address &amp; Coordinates
              </span>
              <span className="font-mono text-[11px] text-zinc-500 bg-zinc-200/70 px-2 py-0.5 rounded-md">
                {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={geocoding ? "Detecting address..." : "Enter address or building name..."}
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium pr-8"
              />
              {geocoding && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-600"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer active:scale-98"
            >
              <Check size={14} />
              <span>Confirm Pinned Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
