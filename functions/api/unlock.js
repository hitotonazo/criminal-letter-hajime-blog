export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = env.UNLOCK_SECRET || "";
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: "missing_secret" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const clicks = Array.isArray(body?.clicks) ? body.clicks : [];
  // Expected set. Keep it server-side (env) if you want, but we also validate length/uniqueness here.
  // For simplicity, we hardcode the "shape" and validate that the client has collected 6 unique values.
  // You can rotate these values later by editing index.html (data-s) AND this list.
  const expected = ["a7f1", "c09b", "d3e8", "19ad", "bb42", "e5c0"];
  const uniq = [...new Set(clicks)];
  const ok = uniq.length === 6 && uniq.every(v => expected.includes(v));

  if (!ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  // Issue short-lived cookie (15 min)
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = JSON.stringify({ exp });

  const token = await sign(payload, secret);

  const headers = new Headers();
  headers.set("content-type", "application/json");
  headers.append(
    "Set-Cookie",
    `unlock=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${15 * 60}`
  );

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

function bytesToB64url(bytes) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(payloadJson, secret) {
  const payloadBytes = new TextEncoder().encode(payloadJson);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, payloadBytes);

  const payloadB64 = bytesToB64url(new Uint8Array(payloadBytes));
  const sigB64 = bytesToB64url(new Uint8Array(sig));

  return `${payloadB64}.${sigB64}`;
}
