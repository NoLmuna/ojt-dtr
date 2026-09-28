import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import CryptoJS from "crypto-js";
import { getDaysInMonth } from "@/lib/utils";

// Expose AES secret to client safely, using a consistent key so client and server can communicate.
export const AES_SECRET = process.env.NEXT_PUBLIC_AES_SECRET || "AES_ENCRYPTION_SECRET_KEY_123!";

export function encryptAES(data: any): string {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), AES_SECRET).toString();
  } catch (error) {
    console.error("AES encryption failed", error);
    return "";
  }
}

export function decryptAES(cipherText: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, AES_SECRET);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("AES decryption failed", error);
    return null;
  }
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type RateLimitState = Map<string, number[]>;

const globalRateLimitStore = globalThis as typeof globalThis & {
  __ojtDtrRateLimitStore?: RateLimitState;
};

const rateLimitStore =
  globalRateLimitStore.__ojtDtrRateLimitStore ??
  (globalRateLimitStore.__ojtDtrRateLimitStore = new Map<string, number[]>());

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function optionalNullableString(maxLength: number) {
  return z.preprocess(
    normalizeOptionalString,
    z.union([z.string().max(maxLength), z.null()]).optional()
  );
}

export const cuidParamSchema = z.object({
  id: z.string().cuid("Invalid record identifier."),
});

export const dtrCreateSchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  })
  .strict();

export const dtrEntrySchema = z
  .object({
    day: z.number().int().min(1).max(31),
    amArrival: z.union([z.string().regex(TIME_PATTERN), z.null()]).optional(),
    amDeparture: z.union([z.string().regex(TIME_PATTERN), z.null()]).optional(),
    pmArrival: z.union([z.string().regex(TIME_PATTERN), z.null()]).optional(),
    pmDeparture: z.union([z.string().regex(TIME_PATTERN), z.null()]).optional(),
    includeBreak: z.boolean().optional(),
    remarks: optionalNullableString(500),
  })
  .strict();

export const dtrEntriesUpdateSchema = z
  .object({
    entries: z.array(dtrEntrySchema).max(31),
  })
  .strict();

export const dtrStatusUpdateSchema = z
  .object({
    status: z.enum(["draft", "submitted"]),
  })
  .strict();

export const userUpdateSchema = z
  .object({
    name: optionalNullableString(100),
    course: optionalNullableString(150),
    school: optionalNullableString(150),
    company: optionalNullableString(150),
    companyLat: z.union([z.number().min(-90).max(90), z.null()]).optional(),
    companyLng: z.union([z.number().min(-180).max(180), z.null()]).optional(),
    supervisorId: optionalNullableString(100),
    targetHours: z.union([z.number().min(1).max(2000), z.null()]).optional(),
    allowWeekends: z.boolean().optional(),
  })
  .strict();

export const punchSchema = z
  .object({
    action: z.enum(["timeIn", "timeOut"]),
    localDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid punch timestamp.",
    }),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .strict();

export const geocodeQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[\p{L}\p{N}\s,.'\-#/()]+$/u, "Search contains unsupported characters."),
});

export function jsonResponse(body: unknown, init?: ResponseInit) {
  // Automatically encrypt all API JSON responses
  const encryptedPayload = encryptAES(body);
  
  return NextResponse.json({ encrypted: encryptedPayload }, {
    ...init,
    headers: {
      ...noStoreHeaders,
      ...init?.headers,
    },
  });
}

export function jsonError(message: string, status: number) {
  return jsonResponse({ error: message }, { status });
}

export async function readValidatedJson<T>(
  req: NextRequest | Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: unknown;

  try {
    const rawBody = await req.json();
    // If the request contains an encrypted payload, decrypt it
    if (rawBody && typeof rawBody === 'object' && 'encrypted' in rawBody && typeof rawBody.encrypted === 'string') {
      body = decryptAES(rawBody.encrypted);
    } else {
      body = rawBody;
    }
  } catch {
    return {
      success: false,
      response: jsonError("Invalid JSON body.", 400),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: jsonError(parsed.error.issues[0]?.message ?? "Invalid request data.", 400),
    };
  }

  return { success: true, data: parsed.data };
}

export function validateEntriesForRecord(
  entries: z.infer<typeof dtrEntrySchema>[],
  month: number,
  year: number
) {
  const maxDay = getDaysInMonth(month, year);
  const seenDays = new Set<number>();

  for (const entry of entries) {
    if (entry.day > maxDay) {
      return `Day ${entry.day} is outside the selected month.`;
    }

    if (seenDays.has(entry.day)) {
      return `Duplicate entry detected for day ${entry.day}.`;
    }

    seenDays.add(entry.day);
  }

  return null;
}

export function cleanUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as Partial<T>;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const existingHits = rateLimitStore.get(key) ?? [];
  const recentHits = existingHits.filter((timestamp) => timestamp > windowStart);

  if (recentHits.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((recentHits[0] + windowMs - now) / 1000));
    rateLimitStore.set(key, recentHits);
    return { allowed: false, retryAfterSeconds };
  }

  recentHits.push(now);
  rateLimitStore.set(key, recentHits);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}