// GET /api/payment-status?ref=topup_xxx|fund_xxx  (login required) -> { status: "pending" | "paid" }
// profile.html polls this after the customer returns from Paystack, until the webhook has landed.
import { admin, getAuthed, send, methodGuard } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    const ref = String(req.query?.ref ?? "");
    if (!/^(topup|fund)_[0-9a-f]{32}$/.test(ref)) return send(res, 400, { error: "Invalid reference." });
    const { data, error } = await admin().from("paystack_payments")
      .select("status").eq("reference", ref).eq("payer_id", me.profile.id).maybeSingle();
    if (error) throw error;
    if (!data) return send(res, 404, { error: "Payment not found." });
    send(res, 200, { status: data.status });
  } catch (e) {
    console.error("payment-status:", e);
    send(res, 500, { error: "Could not check the payment." });
  }
}
