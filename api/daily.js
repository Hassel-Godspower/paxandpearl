// GET /api/daily — run once a day by Vercel Cron (see vercel.json).
//  1. Monthly auto top-ups: charges each due card and credits the wallet.
//  2. Birthday and one-year (anniversary) emails, sent on the day in Lagos time.
// Protected by CRON_SECRET. Needs SUPABASE and PAYSTACK_SECRET_KEY, and RESEND_API_KEY for emails.
import { admin, send, methodGuard, lagosToday } from "./_lib/util.js";
import { sendEmail, autopayFailedEmail, specialDateEmail } from "./_lib/mail.js";
import { creditAutoTopup } from "./_lib/autopay.js";

const addMonths = (ymd, n) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
const addDays = (ymd, n) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const monthDay = (ymd) => String(ymd).slice(5, 10);

async function chargeDueAutopays(db, today) {
  const { data: due, error } = await db.from("wallet_autopay")
    .select("user_id, amount_kobo, failures, next_run_on")
    .eq("active", true).lte("next_run_on", today).lt("failures", 3).limit(200);
  if (error) throw error;
  let charged = 0, failed = 0;

  for (const row of due || []) {
    const { data: card } = await db.from("wallet_cards").select("authorization_code").eq("user_id", row.user_id).maybeSingle();
    const { data: p } = await db.from("profiles").select("full_name, email").eq("id", row.user_id).maybeSingle();
    if (!card || !p?.email) {
      await db.from("wallet_autopay").update({ active: false }).eq("user_id", row.user_id);
      continue;
    }
    const reference = `auto_${row.user_id.replace(/-/g, "").slice(0, 12)}_${today.slice(0, 7).replace("-", "")}`;
    let data = null, errMsg = "";
    try {
      const r = await fetch("https://api.paystack.co/transaction/charge_authorization", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          authorization_code: card.authorization_code, email: p.email, amount: Number(row.amount_kobo), reference,
          metadata: { purpose: "autotopup", user_id: row.user_id }
        })
      });
      const json = await r.json().catch(() => ({}));
      if (!json.status) errMsg = json.message || `HTTP ${r.status}`;
      else data = json.data;
    } catch (e) { errMsg = e.message; }

    if (data?.status === "success") {
      await creditAutoTopup(db, { reference, amountKobo: Number(row.amount_kobo), userId: row.user_id });
      await db.from("wallet_autopay").update({ next_run_on: addMonths(row.next_run_on, 1), failures: 0, updated_at: new Date().toISOString() }).eq("user_id", row.user_id);
      charged++;
    } else if (data?.status === "pending") {
      // Paystack will confirm through the webhook, which credits the wallet once.
      await db.from("wallet_autopay").update({ next_run_on: addDays(today, 1) }).eq("user_id", row.user_id);
    } else {
      const failures = Number(row.failures) + 1;
      const pause = failures >= 3;
      await db.from("wallet_autopay").update({
        failures, active: !pause, next_run_on: addDays(today, 1), updated_at: new Date().toISOString()
      }).eq("user_id", row.user_id);
      await sendEmail({ to: p.email, ...autopayFailedEmail({ name: p.full_name, amountKobo: Number(row.amount_kobo), failures }) });
      console.error("autopay failed:", row.user_id, errMsg || data?.gateway_response);
      failed++;
    }
  }
  return { charged, failed };
}

async function sendSpecialDates(db, today) {
  const { data: people, error } = await db.from("profiles")
    .select("id, full_name, email, birthday, created_at").eq("status", "active").limit(5000);
  if (error) throw error;
  const year = Number(today.slice(0, 4));
  let sent = 0;
  for (const p of people || []) {
    if (!p.email) continue;
    let kind = null;
    if (p.birthday && monthDay(p.birthday) === monthDay(today)) kind = "birthday";
    else if (p.created_at) {
      const joined = new Date(p.created_at).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
      if (monthDay(joined) === monthDay(today) && Number(joined.slice(0, 4)) < year) kind = "anniversary";
    }
    if (!kind) continue;
    const { data: w } = await db.from("wallets").select("balance_kobo").eq("user_id", p.id).maybeSingle();
    if (await sendEmail({ to: p.email, ...specialDateEmail({ name: p.full_name, kind, balanceKobo: Number(w?.balance_kobo || 0) }) })) sent++;
  }
  return { specialDateEmails: sent };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return send(res, 401, { error: "Unauthorised." });
  }
  try {
    const db = admin();
    const today = lagosToday();
    const autopay = await chargeDueAutopays(db, today);
    const dates = await sendSpecialDates(db, today);
    send(res, 200, { today, autopay, ...dates });
  } catch (e) {
    console.error("daily:", e);
    send(res, 500, { error: "Daily jobs failed." });
  }
}
