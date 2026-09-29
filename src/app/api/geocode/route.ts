import { NextRequest } from "next/server";
import { checkRateLimit, geocodeQuerySchema, geocodeReverseSchema, getClientIp, jsonResponse } from "@/lib/security";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`geocode:${clientIp}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return jsonResponse([], {
      status: 429,
      headers: {
        "Retry-After": rateLimit.retryAfterSeconds.toString(),
      },
    });
  }

  const latParam = req.nextUrl.searchParams.get("lat");
  const lonParam = req.nextUrl.searchParams.get("lon");

  // Handle Reverse Geocoding
  if (latParam !== null && lonParam !== null) {
    const reverseResult = geocodeReverseSchema.safeParse({ lat: latParam, lon: lonParam });
    if (!reverseResult.success) {
      return jsonResponse({ error: "Invalid coordinates provided." }, { status: 400 });
    }

    const { lat, lon } = reverseResult.data;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "OJT-DTR/1.0 (ojt-dtr-app; contact@ojt-dtr.local)",
          "Accept-Language": "en",
          "Referer": "https://ojt-dtr.local",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return jsonResponse({
          display_name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          lat: lat.toString(),
          lon: lon.toString(),
        });
      }

      const data: NominatimResult = await res.json();
      return jsonResponse({
        place_id: data.place_id,
        display_name: data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        lat: data.lat ?? lat.toString(),
        lon: data.lon ?? lon.toString(),
      });
    } catch {
      return jsonResponse({
        display_name: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        lat: lat.toString(),
        lon: lon.toString(),
      });
    }
  }

  // Handle Search Autocomplete
  const queryResult = geocodeQuerySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!queryResult.success) {
    return jsonResponse([]);
  }

  const q = queryResult.data.q;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "OJT-DTR/1.0 (ojt-dtr-app; contact@ojt-dtr.local)",
        "Accept-Language": "en",
        "Referer": "https://ojt-dtr.local",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return jsonResponse([]);
    }

    const data: NominatimResult[] = await res.json();
    return jsonResponse(
      data.map((item) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }))
    );
  } catch {
    return jsonResponse([]);
  }
}
