// GET /api/achievements -> { sessions, title, next: { title, at } | null, massageTotal }
// Counts massage services across paid/confirmed/completed bookings (catalog category "massage").
// When the title changes, the client gets a notification and the profile stores the title.
import { admin, getAuthed, send, methodGuard, loadCatalog, wellnessTitle, WELLNESS_TIERS, TREAT_STATUSES } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    const db = admin();

    const { data: bookings, error } = await db.from("bookings")
      .select("items").eq("user_id", me.profile.id).in("status", TREAT_STATUSES);
    if (error) throw error;

    let catalog = new Map();
    try { catalog = await loadCatalog(req); } catch (e) { console.warn("catalog unavailable, using names:", e.message); }
    const isMassage = (item) => {
      const svc = catalog.get(String(item?.id ?? ""));
      if (svc) return svc.category === "massage";
      return /massage/i.test(String(item?.name ?? ""));
    };
    const sessions = (bookings || []).reduce((n, b) => n + (b.items || []).filter(isMassage).length, 0);

    const title = wellnessTitle(sessions);
    if (title !== me.profile.wellness_title) {
      const { error: upErr } = await db.from("profiles").update({ wellness_title: title }).eq("id", me.profile.id);
      if (upErr) throw upErr;
      if (title) {
        await db.from("notifications").insert({
          user_id: me.profile.id, type: "achievement",
          message: `You've earned the title ${title}. Thank you for looking after yourself with us.`
        });
      }
    }

    const tiers = [...WELLNESS_TIERS].reverse();              // ascending
    const nextTier = tiers.find((t) => t.min > sessions) || null;
    send(res, 200, {
      sessions, title,
      next: nextTier ? { title: nextTier.title, at: nextTier.min } : null
    });
  } catch (e) {
    console.error("achievements:", e);
    send(res, 500, { error: "Could not load your progress." });
  }
}
