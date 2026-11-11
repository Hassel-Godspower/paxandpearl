// POST /api/paystack-webhook   (set this URL in the Paystack dashboard: Settings -> API Keys & Webhooks)
// The ONLY place a payment is turned into wallet credit or a paid booking.
//  1. Verify the x-paystack-signature header (HMAC-SHA512 of the raw body with your secret key).
//  2. On charge.success, call settle_payment(), which checks the amount against what we recorded
//     before starting the checkout and applies it exactly once, even if Paystack retries.
import { createHmac, timingSafeEqual } from "node:crypto";
import { admin, send, methodGuard } from "./_lib/util.js";

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
      const { error } = await admin().rpc("settle_payment", { p_reference: reference, p_paid_kobo: amount });
      if (error) {
        if (/unknown payment reference|amount mismatch/i.test(error.message)) {
          // Not retryable: log for manual review and acknowledge so Paystack stops retrying.
          console.error("settle_payment rejected:", reference, error.message);
          return send(res, 200, { ok: true });
        }
        throw error; // transient: 500 makes Paystack retry later
      }
    }
    send(res, 200, { ok: true });
  } catch (e) {
    console.error("paystack-webhook:", e);
    send(res, 500, { error: "Webhook failed" });
  }
}
