// Shared email helper (Resend) and branded templates for the Wellness Wallet.
// The underscore folder keeps this file from being exposed as a public route by Vercel.

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const naira = (kobo) => "₦" + Math.round(Number(kobo || 0) / 100).toLocaleString("en-NG");
export const siteBase = () => (process.env.SITE_URL || "https://paxandpearl.com").replace(/\/$/, "");
const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "there";

/** Sends one email through Resend. Returns true when Resend accepted it. */
export async function sendEmail({ to, subject, html, text, attachments }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const from = process.env.RESEND_FROM || "Pax & Pearl <hello@paxandpearl.com>";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text, ...(attachments ? { attachments } : {}) })
  });
  if (!r.ok) console.error("email failed:", to, r.status, (await r.text()).slice(0, 200));
  return r.ok;
}

function shell(inner) {
  return `<div style="font-family:Poppins,Arial,sans-serif;max-width:520px;margin:0 auto;color:#2b2b2b;line-height:1.55">
    <p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#7a0c0c;margin:0 0 8px">Pax &amp; Pearl Wellness Wallet</p>
    ${inner}
    <p style="font-size:12px;color:#888;margin-top:28px">Pax &amp; Pearl, FESTAC, Lagos</p>
  </div>`;
}

export function receiptEmail({ name, amountKobo, balanceKobo, reference, when }) {
  const first = esc(firstName(name));
  const subject = `Receipt: ${naira(amountKobo)} added to your wallet`;
  const text = `Hello ${firstName(name)},\n\nWe received ${naira(amountKobo)} into your Wellness Wallet on ${when}.\nNew balance: ${naira(balanceKobo)}\nReference: ${reference}\n\nThank you,\nPax & Pearl`;
  const html = shell(`
    <h2 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:0 0 14px">Thank you, ${first}.</h2>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#777">Amount added</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right"><strong>${esc(naira(amountKobo))}</strong></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#777">New balance</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${esc(naira(balanceKobo))}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#777">Date</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${esc(when)}</td></tr>
      <tr><td style="padding:8px 0;color:#777">Reference</td><td style="padding:8px 0;text-align:right;font-size:12px">${esc(reference)}</td></tr>
    </table>
    <p style="margin:24px 0"><a href="${siteBase()}/profile" style="background:#7a0c0c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:600;display:inline-block">Open my wallet</a></p>`);
  return { subject, text, html };
}

export function autopayFailedEmail({ name, amountKobo, failures }) {
  const last = failures >= 3;
  const subject = last ? "Your monthly top-up has been paused" : "We couldn't complete your monthly top-up";
  const body = last
    ? `After three attempts we couldn't charge your card for your monthly top-up of ${naira(amountKobo)}, so we've paused it. You can switch it back on in your wallet after topping up once.`
    : `We couldn't charge your card for this month's top-up of ${naira(amountKobo)}. We'll try again tomorrow. If your card has changed, top up once from your wallet page.`;
  const text = `Hello ${firstName(name)},\n\n${body}\n\n${siteBase()}/profile`;
  const html = shell(`
    <h2 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:0 0 14px">Hello ${esc(firstName(name))},</h2>
    <p>${esc(body)}</p>
    <p style="margin:24px 0"><a href="${siteBase()}/profile" style="background:#7a0c0c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:600;display:inline-block">Open my wallet</a></p>`);
  return { subject, text, html };
}

export function specialDateEmail({ name, kind, balanceKobo }) {
  const first = esc(firstName(name));
  const isBirthday = kind === "birthday";
  const subject = isBirthday ? "Happy birthday from Pax & Pearl" : "One year with Pax & Pearl";
  const lead = isBirthday
    ? "Wishing you a joyful birthday. Treat yourself to something restful this week."
    : "Thank you for a year of looking after yourself with us. Here's to the next one.";
  const balanceLine = balanceKobo > 0 ? `Your wallet balance is ${naira(balanceKobo)}, ready for your next treat.` : "Top up your wallet to book your next treat in a tap.";
  const html = shell(`
    <h2 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:0 0 14px">Hello ${first},</h2>
    <p>${esc(lead)}</p>
    <p>${esc(balanceLine)}</p>
    <p style="margin:24px 0"><a href="${siteBase()}/profile" style="background:#7a0c0c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:600;display:inline-block">Open my wallet</a></p>`);
  return { subject, text: `Hello ${firstName(name)},\n\n${lead}\n\n${balanceLine}\n${siteBase()}/profile`, html };
}

export function giftEmail({ toName, fromName, amountKobo, note, link }) {
  const subject = `${firstName(fromName)} sent you a Pax & Pearl gift`;
  const html = shell(`
    <h2 style="font-family:Montserrat,Arial,sans-serif;font-size:22px;margin:0 0 14px">Hello ${esc(firstName(toName))},</h2>
    <p>${esc(firstName(fromName))} has added <strong>${esc(naira(amountKobo))}</strong> to your Wellness Wallet.</p>
    ${note ? `<blockquote style="border-left:3px solid #c9a24d;margin:16px 0;padding:6px 14px;color:#444;font-style:italic">${esc(note)}</blockquote>` : ""}
    <p style="margin:24px 0"><a href="${esc(link)}" style="background:#7a0c0c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:600;display:inline-block">See your gift</a></p>`);
  return { subject, text: `${firstName(fromName)} added ${naira(amountKobo)} to your Wellness Wallet.${note ? `\n\n"${note}"` : ""}\n\n${link}`, html };
}
