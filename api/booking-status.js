// GET /api/booking-status?ref=bk_xxx -> { status, name, date, time, total, items }
// Used by booking.html after the customer returns from Paystack. The reference is a random
// 128-bit value, so it works as the capability to see this one booking.
import { admin, send, methodGuard } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  const ref = String(req.query?.ref ?? "");
  if (!/^bk_[0-9a-f]{32}$/.test(ref)) return send(res, 400, { error: "Invalid reference." });
  try {
    const { data, error } = await admin().from("bookings")
      .select("id, status, customer_name, customer_email, customer_phone, preferred_date, preferred_time, amount_kobo, items")
      .eq("paystack_reference", ref).maybeSingle();
    if (error) throw error;
    if (!data) return send(res, 404, { error: "Booking not found." });
    send(res, 200, {
      bookingId: data.id, status: data.status, name: data.customer_name, email: data.customer_email, phone: data.customer_phone,
      date: data.preferred_date, time: String(data.preferred_time).slice(0, 5),
      total: data.amount_kobo / 100, items: data.items
    });
  } catch (e) {
    console.error("booking-status:", e);
    send(res, 500, { error: "Could not check the booking." });
  }
}
