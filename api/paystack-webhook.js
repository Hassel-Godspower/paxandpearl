// POST /api/paystack-webhook   (set this URL in the Paystack dashboard: Settings -> API Keys & Webhooks)
// The ONLY place a payment is turned into wallet credit or a paid booking.
//  1. Verify the x-paystack-signature header (HMAC-SHA512 of the raw body with your secret key).
//  2. On charge.success, call settle_payment(), which checks the amount against what we recorded
//     before starting the checkout and applies it exactly once, even if Paystack retries.
import { createHmac, timingSafeEqual } from "node:crypto";
import { admin, send, methodGuard } from "./_lib/util.js";
import { sendEmail, receiptEmail } from "./_lib/mail.js";
import { creditAutoTopup } from "./_lib/autopay.js";


/* After a payment is applied: receipts for top-ups, and save a reusable card for auto top-up. */
async function afterSettle(db, reference, data) {
  const { data: pay } = await db.from("paystack_payments")
    .select("purpose, payer_id, amount_kobo, receipt_sent_at").eq("reference", reference).maybeSingle();
  if (!pay || pay.purpose !== "topup") return;

  const auth = data.authorization;
  if (auth?.reusable && auth.authorization_code && data.channel === "card" && pay.payer_id) {
    await db.from("wallet_cards").upsert({
      user_id: pay.payer_id, authorization_code: auth.authorization_code,
      card_last4: auth.last4 || null, card_brand: auth.brand || auth.card_type || null
    }, { onConflict: "user_id" });
  }
  if (!pay.receipt_sent_at) await sendTopupReceipt(db, pay.payer_id, pay.amount_kobo, reference, new Date());
}

async function sendTopupReceipt(db, userId, amountKobo, reference, at) {
  const { data: p } = await db.from("profiles").select("full_name, email").eq("id", userId).maybeSingle();
  const { data: w } = await db.from("wallets").select("balance_kobo").eq("user_id", userId).maybeSingle();
  if (!p?.email) return;
  const when = at.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
  const sent = await sendEmail({ to: p.email, ...receiptEmail({ name: p.full_name, amountKobo, balanceKobo: Number(w?.balance_kobo || 0), reference, when }) });
  if (sent) await db.from("paystack_payments").update({ receipt_sent_at: new Date().toISOString() }).eq("reference", reference);
}

// We need the exact raw bytes for the signature, so Vercel's body parser is switched off.
export const config = { api: { bodyParser: false } };

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Missing PAYSTACK_SECRET_KEY");

    const raw = await readRaw(req);
    const expected = createHmac("sha512", secret).update(raw).digest("hex");
    const got = String(req.headers["x-paystack-signature"] || "");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(got, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return send(res, 401, { error: "Bad signature" });

    const event = JSON.parse(raw.toString("utf8"));
    if (event?.event === "charge.success" && event?.data?.status === "success") {
      const { reference, amount, currency } = event.data;
      if (currency !== "NGN") {
        console.error("Ignoring non-NGN payment", reference, currency);
        return send(res, 200, { ok: true });
      }
      const db = admin();

      // Monthly auto top-up charges arrive here too if Paystack finishes them later.
      if (event.data.metadata?.purpose === "autotopup") {
        if (!event.data.metadata?.user_id) console.error("autotopup without user", reference);
        else await creditAutoTopup(db, { reference, amountKobo: Number(amount), userId: event.data.metadata.user_id });
        return send(res, 200, { ok: true });
      }

      const { error } = await db.rpc("settle_payment", { p_reference: reference, p_paid_kobo: amount });
      if (error) {
        if (/unknown payment reference|amount mismatch/i.test(error.message)) {
          // Not retryable: log for manual review and acknowledge so Paystack stops retrying.
          console.error("settle_payment rejected:", reference, error.message);
          return send(res, 200, { ok: true });
        }
        throw error; // transient: 500 makes Paystack retry later
      }
      await afterSettle(db, reference, event.data);
    }
    send(res, 200, { ok: true });
  } catch (e) {
    console.error("paystack-webhook:", e);
    send(res, 500, { error: "Webhook failed" });
  }
}
