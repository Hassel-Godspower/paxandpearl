// One endpoint for everything a logged-in client does on their own account.
//   GET  /api/me                                  -> { birthday }
//   POST /api/me { birthday: "YYYY-MM-DD"|null }  -> saves the birthday (birthday email)
//   GET  /api/me?action=autopay                   -> { card, autopay }
//   POST /api/me?action=autopay { active:true, amount } | { active:false }
//   POST /api/me?action=topup { amount }          -> { authorization_url }  (wallet credited only by the webhook)
//   GET  /api/me?action=payment-status&ref=...    -> { status: "pending" | "paid" }
import { admin, getAuthed, send, methodGuard, siteUrl, nairaToKobo, newReference, paystackInitialize, lagosToday } from "./_lib/util.js";

const addMonths = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

async function birthday(req, res, me, db) {
  try {
    if (req.method === "GET") {
      const { data } = await db.from("profiles").select("birthday").eq("id", me.profile.id).maybeSingle();
      return send(res, 200, { birthday: data?.birthday ?? null });
    }
    const raw = req.body?.birthday;
    let value = null;
    if (raw) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) && !isNaN(Date.parse(`${raw}T12:00:00Z`));
      if (!ok) return send(res, 400, { error: "Enter a valid date." });
      value = String(raw);
    }
    const { error } = await db.from("profiles").update({ birthday: value }).eq("id", me.profile.id);
    if (error) throw error;
    send(res, 200, { ok: true, birthday: value });
  } catch (e) {
    console.error("me:", e);
    send(res, 500, { error: "Could not save your birthday. Please try again." });
  }
}

async function autopay(req, res, me, db) {
  try {
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

async function topup(req, res, me) {
  try {
    const amountKobo = nairaToKobo(req.body?.amount);
    if (!amountKobo) return send(res, 400, { error: "Enter a whole-naira amount between ₦1,000 and ₦1,000,000." });

    const reference = newReference("topup");
    const { error } = await admin().from("paystack_payments").insert({
      reference, purpose: "topup", payer_id: me.profile.id, target_user_id: me.profile.id, amount_kobo: amountKobo
    });
    if (error) throw error;

    const authorization_url = await paystackInitialize({
      email: me.profile.email,
      amountKobo,
      reference,
      callbackUrl: `${siteUrl(req)}/profile?paid=${reference}`,
      metadata: { purpose: "topup" }
    });
    send(res, 200, { authorization_url });
  } catch (e) {
    console.error("topup:", e);
    send(res, 500, { error: "Could not start the top-up. Please try again." });
  }
}

async function paymentStatus(req, res, me, db) {
  try {
    const ref = String(req.query?.ref ?? "");
    if (!/^(topup|fund)_[0-9a-f]{32}$/.test(ref)) return send(res, 400, { error: "Invalid reference." });
    const { data, error } = await db.from("paystack_payments")
      .select("status").eq("reference", ref).eq("payer_id", me.profile.id).maybeSingle();
    if (error) throw error;
    if (!data) return send(res, 404, { error: "Payment not found." });
    send(res, 200, { status: data.status });
  } catch (e) {
    console.error("payment-status:", e);
    send(res, 500, { error: "Could not check the payment." });
  }
}

const ROUTES = {
  "": { methods: ["GET", "POST"], run: birthday },
  autopay: { methods: ["GET", "POST"], run: autopay },
  topup: { methods: ["POST"], run: topup },
  "payment-status": { methods: ["GET"], run: paymentStatus }
};

export default async function handler(req, res) {
  const action = String(req.query?.action ?? "");
  const route = Object.prototype.hasOwnProperty.call(ROUTES, action) ? ROUTES[action] : null;
  if (!route) return send(res, 400, { error: "Unknown action." });
  if (!methodGuard(req, res, route.methods)) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    return await route.run(req, res, me, admin());
  } catch (e) {
    console.error("me:", e);
    send(res, 500, { error: "Something went wrong. Please try again." });
  }
}
