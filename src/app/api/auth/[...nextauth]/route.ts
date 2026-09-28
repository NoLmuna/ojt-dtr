import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";
import { encryptAES, decryptAES } from "@/lib/security";

const { GET: AuthGET, POST: AuthPOST } = handlers;

export async function GET(req: NextRequest) {
  const res = await AuthGET(req);
  
  // Intercept /api/auth/session and encrypt its payload
  if (req.nextUrl.pathname === "/api/auth/session") {
    try {
      const data = await res.json();
      return NextResponse.json({ encrypted: encryptAES(data) }, { status: res.status, headers: res.headers });
    } catch(e) {}
  }
  return res;
}

export async function POST(req: NextRequest) {
  // If the request contains encrypted body (like signin credentials), optionally decrypt it
  try {
     const cloned = req.clone();
     const text = await cloned.text();
     const json = JSON.parse(text);
     if (json && json.encrypted) {
        const decrypted = decryptAES(json.encrypted);
        return AuthPOST(new NextRequest(req.url, {
           method: req.method,
           headers: req.headers,
           body: JSON.stringify(decrypted)
        }));
     }
  } catch(e) {}
  return AuthPOST(req);
}
