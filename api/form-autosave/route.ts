import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  selector?: string;
  data?: Record<string, unknown>;
  failedSubmit?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const selector = typeof body.selector === "string" ? body.selector : "#contact-form";
    const data = (body?.data && typeof body.data === "object") ? body.data : {};
    const failed = !!body.failedSubmit;
    const ts = Date.now();
    const ua = req.headers.get("user-agent") ?? "";

    // Optional: persist to Vercel KV if configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const { kv } = await import("@vercel/kv");
        const key = `autosave:${selector}:${ts}`;
        await kv.hset(key, {
          selector,
          data: JSON.stringify(data),
          failedSubmit: String(failed),
          ts: String(ts),
          ua,
        });
        // expire after 7 days
        await kv.expire(key, 60 * 60 * 24 * 7);
      } catch (err) {
        // If KV isn't available, just proceed without persisting
        console.warn("[form-autosave] KV not available or failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
}
