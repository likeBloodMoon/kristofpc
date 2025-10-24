import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Basic IP detector compatible with Vercel */
function getIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // take first ip
    const ip = xff.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const rip = (req as any).ip || (req as any).socket?.remoteAddress;
  return typeof rip === "string" ? rip : "0.0.0.0";
}

const WINDOW_SECONDS = 10 * 60; // 10 minutes
const MAX_REQUESTS = 5; // per IP per window

/** KV-based limiter if available; otherwise memory fallback for dev */
async function rateLimit(req: Request): Promise<{ ok: boolean; remaining: number }> {
  const ip = getIP(req);
  // Use Vercel KV if configured
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      const key = `rl:contact:${ip}`;
      // increment and set TTL on first increment
      const pipeline = kv.multi();
      pipeline.incr(key);
      pipeline.expire(key, WINDOW_SECONDS);
      const [count] = (await pipeline.exec()) as [number];
      const remaining = Math.max(0, MAX_REQUESTS - Number(count));
      if (Number(count) > MAX_REQUESTS) {
        return { ok: false, remaining: 0 };
      }
      return { ok: true, remaining };
    } catch {
      // fall through to memory
    }
  }
  // In-memory fallback (dev only; not durable across serverless invocations)
  const g: any = globalThis as any;
  if (!g.__rl) g.__rl = new Map<string, { count: number; exp: number }>();
  const now = Math.floor(Date.now() / 1000);
  const rec = g.__rl.get(ip);
  if (!rec || rec.exp < now) {
    g.__rl.set(ip, { count: 1, exp: now + WINDOW_SECONDS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }
  rec.count += 1;
  if (rec.count > MAX_REQUESTS) return { ok: false, remaining: 0 };
  return { ok: true, remaining: MAX_REQUESTS - rec.count };
}

type ContactPayload = Record<string, unknown>;

export async function POST(req: Request) {
  // Rate limit check
  const rl = await rateLimit(req);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": `${WINDOW_SECONDS}` } }
    );
  }

  let data: ContactPayload;
  try {
    data = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  // Honeypot: quietly accept and stop if bot filled the hidden field
  const honeypot = (data?.company ?? "").toString().trim();
  if (honeypot) {
    // Pretend success to not tip off bots
    return NextResponse.json({ ok: true, hp: true });
  }

  // === Your real processing goes here (email, KV store, etc.) ===
  // Optional: send via Resend if configured
  try {
    if (process.env.RESEND_API_KEY && process.env.CONTACT_TO && process.env.CONTACT_FROM) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.CONTACT_FROM!,
        to: process.env.CONTACT_TO!.split(",").map(s => s.trim()).filter(Boolean),
        subject: "New website contact",
        text: JSON.stringify(data, null, 2),
      });
    }
  } catch (err) {
    // don't fail if email fails
    console.warn("[contact] email send failed:", err);
  }

  // Optional: persist to KV (30 days) if available
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import("@vercel/kv");
      const ts = Date.now();
      const key = `contact:${ts}`;
      await kv.hset(key, { ts: String(ts), data: JSON.stringify(data) });
      await kv.expire(key, 60 * 60 * 24 * 30);
    }
  } catch (err) {
    console.warn("[contact] KV store failed:", err);
  }

  return NextResponse.json({ ok: true, remaining: rl.remaining });
}
