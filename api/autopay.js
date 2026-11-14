// GET  /api/autopay                      -> { card, autopay }
// POST /api/autopay { active: true, amount: 50000 }  (whole naira, needs a saved card)
// POST /api/autopay { active: false }     -> pauses the monthly top-up
// A monthly top-up is charged to the card saved from the client's last card top-up.
import { admin, getAuthed, send, methodGuard, nairaToKobo, lagosToday } from "./_lib/util.js";

const addMonths = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET", "POST"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    const db = admin();

    const { data: card } = await db.from("wallet_cards").select("card_last4, card_brand").eq("user_id", me.profile.id).maybeSingle();
    const { data: ap } = await db.from("wallet_autopay").select("amount_kobo, active, next_run_on").eq("user_id", me.profile.id).maybeSingle();
    const view = {
      card: card ? { last4: card.card_last4, brand: card.card_brand } : null,
      autopay: ap ? { amount: ap.amount_kobo / 100, active: ap.active, nextRunOn: ap.next_run_on } : null
    };

    if (req.method === "GET") return send(res, 200, view);

    if (req.body?.active === false) {
      await db.from("wallet_autopay").update({ active: false, updated_at: new Date().toISOString() }).eq("user_id", me.profile.id);
      return send(res, 200, { ok: true });
    }
    if (!card) return send(res, 400, { error: "Top up once by card first. Then you can set up your monthly top-up." });
    const amountKobo = nairaToKobo(req.body?.amount, { min: 1000, max: 1000000 });
    if (!amountKobo) return send(res, 400, { error: "Enter a monthly amount between ₦1,000 and ₦1,000,000." });

    const { error } = await db.from("wallet_autopay").upsert({
      user_id: me.profile.id, amount_kobo: amountKobo, active: true,
      next_run_on: addMonths(lagosToday(), 1), failures: 0, updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) throw error;
    send(res, 200, { ok: true });
  } catch (e) {
    console.error("autopay:", e);
    send(res, 500, { error: "Could not update your monthly top-up. Please try again." });
  }
}
