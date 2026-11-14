// GET /api/staff  with header  x-staff-key: <STAFF_KEY>
// Read-only view for reception: recent bookings and every client's wallet balance.
// Set STAFF_KEY in Vercel to a long random word and share it only with staff.
import { timingSafeEqual } from "node:crypto";
import { admin, send, methodGuard } from "./_lib/util.js";

function keyOk(given) {
  const want = process.env.STAFF_KEY || "";
  if (!want || !given) return false;
  const a = Buffer.from(String(given)), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  if (!keyOk(req.headers["x-staff-key"])) return send(res, 401, { error: "Wrong staff key." });
  try {
    const db = admin();
    const { data: bookings, error: bErr } = await db.from("bookings")
      .select("id, customer_name, customer_phone, customer_email, items, preferred_date, preferred_time, amount_kobo, payment_method, status, created_at")
      .order("preferred_date", { ascending: false }).order("preferred_time", { ascending: false }).limit(300);
    if (bErr) throw bErr;
    const { data: wallets, error: wErr } = await db.from("wallets")
      .select("user_id, balance_kobo, profiles(full_name, phone, email)").order("balance_kobo", { ascending: false }).limit(1000);
    if (wErr) throw wErr;
    send(res, 200, {
      bookings: bookings || [],
      wallets: (wallets || []).map((w) => ({
        name: w.profiles?.full_name || "", phone: w.profiles?.phone || "", email: w.profiles?.email || "",
        balance: Number(w.balance_kobo) / 100
      }))
    });
  } catch (e) {
    console.error("staff:", e);
    send(res, 500, { error: "Could not load the staff view." });
  }
}
