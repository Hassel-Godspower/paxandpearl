// Shared helpers for the wallet / payment API. The underscore folder keeps this
// file from being exposed as a public route by Vercel.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

let _admin;
/** Supabase client with the service-role key. SERVER ONLY. Never send this to the browser. */
export function admin() {
  if (!_admin) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return _admin;
}

export function send(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

export function methodGuard(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader("Allow", allowed.join(", "));
    send(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

export function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `https://${host}`;
}

/** Nigerian numbers -> +234XXXXXXXXXX, or null if it doesn't look valid. */
export function normalizePhone(raw) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("234")) return `+${d}`;
  if (d.length === 11 && d.startsWith("0")) return `+234${d.slice(1)}`;
  if (d.length === 10 && /^[789]/.test(d)) return `+234${d}`;
  return null;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? "").trim());

export const newReference = (prefix) => `${prefix}_${randomUUID().replace(/-/g, "")}`;

/** Resolve the logged-in user from the "Authorization: Bearer <supabase access token>" header. */
export async function getAuthed(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const db = admin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", data.user.id)
    .maybeSingle();
  return profile ? { user: data.user, profile } : null;
}

/** Whole-naira amount from the client -> kobo, with limits. Returns null if invalid. */
export function nairaToKobo(value, { min = 1000, max = 1000000 } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n * 100;
}

/** Start a Paystack checkout and return its hosted-page URL. */
export async function paystackInitialize({ email, amountKobo, reference, callbackUrl, metadata }) {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Missing PAYSTACK_SECRET_KEY");
  const r = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata
    })
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || !json?.status || !json?.data?.authorization_url) {
    console.error("Paystack initialize failed:", r.status, json?.message);
    throw new Error("Could not start payment");
  }
  return json.data.authorization_url;
}

/** Service prices come from the live catalog, never from the browser. Map of id -> service. */
export async function loadCatalog(req) {
  const r = await fetch(`${siteUrl(req)}/catalog.json`, { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`catalog.json HTTP ${r.status}`);
  const data = await r.json();
  return new Map((data.services || []).map((s) => [String(s.id), s]));
}

export function lagosToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
}
