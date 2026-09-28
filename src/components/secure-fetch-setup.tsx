"use client";
import CryptoJS from "crypto-js";

if (typeof window !== "undefined" && !(window as any).__secureFetchLoaded) {
  (window as any).__secureFetchLoaded = true;

  const AES_SECRET = process.env.NEXT_PUBLIC_AES_SECRET || "AES_ENCRYPTION_SECRET_KEY_123!";

  const decryptAES = (cipherText: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, AES_SECRET);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (e) {
      return null;
    }
  };

  const encryptAES = (data: any) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), AES_SECRET).toString();
  };

  const originalFetch = window.fetch;

  window.fetch = async (input, init) => {
    const opts = init ? { ...init } : {};
    
    // Determine the URL
    const url = typeof input === "string" ? input : (input instanceof Request ? input.url : "");
    const isApiRequest = url.includes("/api/");

    // Encrypt outgoing JSON requests only for our API
    if (isApiRequest && opts.body && typeof opts.body === "string") {
      try {
        const parsed = JSON.parse(opts.body);
        if (parsed && typeof parsed === "object" && !("encrypted" in parsed)) {
          opts.body = JSON.stringify({ encrypted: encryptAES(parsed) });
        }
      } catch (e) {}
    }

    const response = await originalFetch(input, opts);

    // Override json() and text() only for API requests
    if (isApiRequest) {
      const cloned = response.clone();
      cloned.json = async () => {
        const data = await response.json();
        if (data && typeof data === "object" && "encrypted" in data) {
           return decryptAES(data.encrypted);
        }
        return data;
      };
      
      cloned.text = async () => {
        const text = await response.text();
        try {
           const data = JSON.parse(text);
           if (data && typeof data === "object" && "encrypted" in data) {
               return JSON.stringify(decryptAES(data.encrypted));
           }
        } catch(e) {}
        return text;
      };

      return cloned;
    }

    return response;
  };
}

export function SecureFetchSetup() {
  return null;
}
