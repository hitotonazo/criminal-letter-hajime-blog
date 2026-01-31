export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Protect /hidden/* with signed cookie
  if (url.pathname.startsWith("/hidden")) {
    const cookie = request.headers.get("Cookie") || "";
    const token = (cookie.match(/(?:^|;\s*)unlock=([^;]+)/) || [])[1] || "";
    if (!token) return new Response("Not Found", { status: 404 });

    const ok = await verifyToken(token, env.UNLOCK_SECRET || "");
    if (!ok) return new Response("Not Found", { status: 404 });

    return next();
  }

  return next();
}

function b64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyToken(token, secret) {
  try{
    if(!secret) return false;
    const parts = token.split(".");
    if(parts.length !== 2) return false;
    const payloadB64 = parts[0];
    const sigB64 = parts[1];
    const payloadBytes = b64urlToBytes(payloadB64);
    const sigBytes = b64urlToBytes(sigB64);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const ok = await crypto.subtle.verify("HMAC", key, sigBytes, payloadBytes);
    if(!ok) return false;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    const now = Date.now();
    if(typeof payload.exp !== "number") return false;
    if(now > payload.exp) return false;

    return true;
  }catch(e){
    return false;
  }
}
