import { NextRequest } from "next/server";
import { checkRateLimit, geocodeQuerySchema, getClientIp, jsonResponse } from "@/lib/security";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(req: NextRequest) {
  const queryResult = geocodeQuerySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!queryResult.success) {
    return jsonResponse([]);
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`geocode:${clientIp}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return jsonResponse([], {
      status: 429,
      headers: {
        "Retry-After": rateLimit.retryAfterSeconds.toString(),
      },
    });
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
