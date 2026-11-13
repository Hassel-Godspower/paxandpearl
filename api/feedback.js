// GET  /api/feedback  -> { pending: [bookings to reflect on], done: [my past reflections] }
// POST /api/feedback  { bookingId, mood: 1-5, comment? } -> { ok: true }
// A client can reflect on a treat once its date has arrived (Lagos time), and only once per booking.
import { admin, getAuthed, send, methodGuard, lagosToday, TREAT_STATUSES } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET", "POST"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    const db = admin();

    if (req.method === "GET") {
      const { data: bookings, error: bErr } = await db.from("bookings")
        .select("id, items, preferred_date, preferred_time, status")
        .eq("user_id", me.profile.id).in("status", TREAT_STATUSES)
        .order("preferred_date", { ascending: false }).limit(100);
      if (bErr) throw bErr;
      const { data: fb, error: fErr } = await db.from("booking_feedback")
        .select("booking_id, mood, comment, created_at").eq("user_id", me.profile.id)
        .order("created_at", { ascending: false }).limit(100);
      if (fErr) throw fErr;
      const byId = new Map((fb || []).map((f) => [f.booking_id, f]));
      const today = lagosToday();
      const pending = (bookings || []).filter((b) => b.preferred_date <= today && !byId.has(b.id))
        .map((b) => ({ id: b.id, items: b.items, date: b.preferred_date, time: String(b.preferred_time).slice(0, 5) }));
      const done = (bookings || []).filter((b) => byId.has(b.id)).map((b) => {
        const f = byId.get(b.id);
        return { id: b.id, items: b.items, date: b.preferred_date, mood: f.mood, comment: f.comment || "" };
      });
      return send(res, 200, { pending, done });
    }

    // ----- POST -----
    const bookingId = String(req.body?.bookingId ?? "");
    const mood = Number(req.body?.mood);
    const comment = String(req.body?.comment ?? "").trim().slice(0, 500);
    if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return send(res, 400, { error: "Invalid booking." });
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) return send(res, 400, { error: "Choose how you feel, from 1 to 5." });

    const { data: booking, error: bkErr } = await db.from("bookings")
      .select("id, user_id, status, preferred_date").eq("id", bookingId).maybeSingle();
    if (bkErr) throw bkErr;
    if (!booking || booking.user_id !== me.profile.id) return send(res, 404, { error: "Booking not found." });
    if (!TREAT_STATUSES.includes(booking.status)) return send(res, 400, { error: "You can reflect on a treat once it's paid or confirmed." });
    if (booking.preferred_date > lagosToday()) return send(res, 400, { error: "You can share how you felt once your treat date arrives." });

    const { error: insErr } = await db.from("booking_feedback").insert({
      booking_id: bookingId, user_id: me.profile.id, mood, comment: comment || null
    });
    if (insErr) {
      if (/duplicate|unique/i.test(insErr.message)) return send(res, 409, { error: "You've already shared how this treat felt." });
      throw insErr;
    }
    send(res, 200, { ok: true });
  } catch (e) {
    console.error("feedback:", e);
    send(res, 500, { error: "Could not save your reflection. Please try again." });
  }
}
