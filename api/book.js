// POST /api/book
//   { items:[{id}], name, email, phone, date:"YYYY-MM-DD", time:"HH:MM", method:"wallet"|"paystack" }
//   wallet   (login required) -> deducts from the Wellness Wallet now -> { ok, bookingId, total }
//   paystack (guests allowed) -> { authorization_url }; the webhook marks it paid
// Prices are looked up in catalog.json on the server. The browser's prices are ignored.
import {
  admin, getAuthed, send, methodGuard, siteUrl, normalizePhone, isEmail,
  newReference, paystackInitialize, loadCatalog, lagosToday
} from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const b = req.body || {};
    const method = b.method === "wallet" ? "wallet" : b.method === "paystack" ? "paystack" : null;
    if (!method) return send(res, 400, { error: "Choose how you'd like to pay." });

    const me = await getAuthed(req);
    if (method === "wallet" && !me) return send(res, 401, { error: "Please log in to pay from your Wellness Wallet." });

    // ----- customer + slot -----
    const name = String(b.name ?? "").trim().slice(0, 80);
    const email = String(b.email ?? "").trim().toLowerCase();
    const phone = normalizePhone(b.phone);
    const date = String(b.date ?? "");
    const time = String(b.time ?? "");
    if (name.length < 2 || !isEmail(email) || !phone) {
      return send(res, 400, { error: "Please check your name, email and phone number." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < lagosToday() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return send(res, 400, { error: "Choose a valid date (today or later) and time." });
    }

    // ----- items priced from the catalog -----
    const wanted = Array.isArray(b.items) ? b.items.slice(0, 10) : [];
    if (!wanted.length) return send(res, 400, { error: "Your booking is empty." });
    const catalog = await loadCatalog(req);
    const items = [];
    for (const w of wanted) {
      const svc = catalog.get(String(w?.id ?? ""));
      if (!svc || !Number.isFinite(Number(svc.price)) || Number(svc.price) <= 0) {
        return send(res, 400, { error: "One of the services is no longer available. Please re-add it from Services." });
      }
      items.push({ id: String(svc.id), name: svc.name, price: Number(svc.price), duration: Number(svc.duration) || 0 });
    }
    const totalNaira = items.reduce((s, i) => s + i.price, 0);
    const amountKobo = Math.round(totalNaira * 100);
    const db = admin();

    // ----- pay from wallet -----
    if (method === "wallet") {
      const { data: bookingId, error } = await db.rpc("book_with_wallet", {
        p_user_id: me.profile.id, p_amount_kobo: amountKobo, p_items: items,
        p_name: name, p_email: email, p_phone: phone, p_date: date, p_time: time
      });
      if (error) {
        if (/insufficient/i.test(error.message)) {
          return send(res, 402, { error: "Your wallet balance is too low for this booking. Top up your wallet or pay directly." });
        }
        throw error;
      }
      return send(res, 200, { ok: true, bookingId, total: totalNaira, items });
    }

    // ----- pay directly with Paystack -----
    const reference = newReference("bk");
    const { data: booking, error: bErr } = await db.from("bookings").insert({
      user_id: me?.profile.id ?? null, customer_name: name, customer_email: email, customer_phone: phone,
      items, preferred_date: date, preferred_time: time, amount_kobo: amountKobo,
      payment_method: "paystack", status: "pending_payment", paystack_reference: reference
    }).select("id").single();
    if (bErr) throw bErr;

    const { error: pErr } = await db.from("paystack_payments").insert({
      reference, purpose: "booking", payer_id: me?.profile.id ?? null, booking_id: booking.id, amount_kobo: amountKobo
    });
    if (pErr) throw pErr;

    const authorization_url = await paystackInitialize({
      email, amountKobo, reference,
      callbackUrl: `${siteUrl(req)}/booking?paid=${reference}`,
      metadata: { purpose: "booking" }
    });
    send(res, 200, { authorization_url });
  } catch (e) {
    console.error("book:", e);
    send(res, 500, { error: "We couldn't complete the booking. Please try again." });
  }
}
