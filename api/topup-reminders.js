// GET /api/topup-reminders
// Run daily by Vercel Cron (see vercel.json). Emails each active client a top-up reminder..
// at most once every 21 days. Protected by CRON_SECRET (Vercel sends it automatically once set).
// Needs env: RESEND_API_KEY, optional RESEND_FROM and SITE_URL.
import { admin, send, methodGuard } from "./_lib/util.js";

const EVERY_DAYS = 21;
const BATCH = 200;

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const naira = (kobo) => "₦" + Math.round(Number(kobo || 0) / 100).toLocaleString("en-NG");

function reminderEmail({ name, balanceKobo, siteUrl }) {
  const first = String(name || "").trim().split(/\s+/)[0] || "there";
  const balanceLine = balanceKobo > 0
    ? `Your wallet balance is ${naira(balanceKobo)}.`
    : "Your wallet is empty at the moment.";
  const link = `${siteUrl}/profile`;
  const subject = balanceKobo > 0 ? "Your Wellness Wallet is ready for your next treat" : "Top up your Wellness Wallet";
  const text = `Hello ${first},\n\n${balanceLine}\n\nTop up now so your next spa treat is ready when you are:\n${link}\n\nWith love,\nPax & Pearl`;
  const html = `<div style="font-family:Poppins,Arial,sans-serif;max-width:520px;margin:0 auto;color:#2b2b2b;line-height:1.55">
    <p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#7a0c0c;margin:0 0 8px">Pax &amp; Pearl Wellness Wallet</p>
    <h2 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:0 0 14px">Hello ${esc(first)},</h2>
    <p>${esc(balanceLine)}</p>
    <p>Top up now so your next spa treat is ready when you are.</p>
    <p style="margin:26px 0"><a href="${esc(link)}" style="background:#7a0c0c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:600;display:inline-block">Top up my wallet</a></p>
    <p style="font-size:13px;color:#777">You are receiving this every three weeks as a reminder. Sign in at <a href="${esc(link)}" style="color:#7a0c0c">paxandpearl.com/profile</a> with your email.</p>
  </div>`;
  return { subject, text, html };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return send(res, 401, { error: "Unauthorised." });
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return send(res, 500, { error: "RESEND_API_KEY is not set." });
  const from = process.env.RESEND_FROM || "Pax & Pearl <hello@paxandpearl.com>";
  const siteUrl = (process.env.SITE_URL || "https://paxandpearl.com").replace(/\/$/, "");

  try {
    const db = admin();
    const cutoff = new Date(Date.now() - EVERY_DAYS * 864e5).toISOString();
    const { data: due, error } = await db.from("profiles")
      .select("id, full_name, email, last_topup_reminder_at")
      .eq("status", "active")
      .or(`last_topup_reminder_at.is.null,last_topup_reminder_at.lt.${cutoff}`)
      .limit(BATCH);
    if (error) throw error;

    let sent = 0, failed = 0;
    for (const p of due || []) {
      if (!p.email) continue;
      const { data: w } = await db.from("wallets").select("balance_kobo").eq("user_id", p.id).maybeSingle();
      const email = reminderEmail({ name: p.full_name, balanceKobo: Number(w?.balance_kobo || 0), siteUrl });
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [p.email], subject: email.subject, html: email.html, text: email.text })
      });
      if (!r.ok) {
        failed++;
        console.error("topup reminder failed:", p.email, r.status, (await r.text()).slice(0, 200));
        continue;
      }
      await db.from("profiles").update({ last_topup_reminder_at: new Date().toISOString() }).eq("id", p.id);
      sent++;
    }
    send(res, 200, { checked: (due || []).length, sent, failed });
  } catch (e) {
    console.error("topup-reminders:", e);
    send(res, 500, { error: "Could not send reminders." });
  }
}
