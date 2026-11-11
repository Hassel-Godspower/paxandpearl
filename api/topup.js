// POST /api/topup  { amount }  (whole naira)  -> { authorization_url }
// Starts a Paystack checkout. The wallet is credited ONLY by the webhook after payment succeeds.
import { admin, getAuthed, send, methodGuard, siteUrl, nairaToKobo, newReference, paystackInitialize } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });

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
