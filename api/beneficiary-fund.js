// POST /api/beneficiary-fund { beneficiaryUserId, amount, method: "wallet" | "paystack", note? }
//   wallet   -> moves money from your wallet now             -> { ok: true }
//   paystack -> pay by card/transfer straight into their wallet -> { authorization_url }
// The beneficiary is notified when their wallet is credited.
import { admin, getAuthed, send, methodGuard, siteUrl, nairaToKobo, newReference, paystackInitialize } from "./_lib/util.js";
import { sendEmail, giftEmail, siteBase } from "./_lib/mail.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });

    const amountKobo = nairaToKobo(req.body?.amount, { min: 500 });
    if (!amountKobo) return send(res, 400, { error: "Enter a whole-naira amount between ₦500 and ₦1,000,000." });
    const method = req.body?.method === "paystack" ? "paystack" : "wallet";
    const benId = String(req.body?.beneficiaryUserId ?? "");

    const db = admin();
    const { data: rel } = await db.from("beneficiaries").select("id")
      .eq("owner_id", me.profile.id).eq("beneficiary_user_id", benId).maybeSingle();
    if (!rel) return send(res, 403, { error: "That person isn't in your beneficiaries." });

    if (method === "wallet") {
      const { error } = await db.rpc("fund_beneficiary_from_wallet", {
        p_owner_id: me.profile.id, p_beneficiary_user_id: benId, p_amount_kobo: amountKobo
      });
      if (error) {
        if (/insufficient/i.test(error.message)) return send(res, 402, { error: "Your wallet balance is too low. Top up first, or pay by card." });
        throw error;
      }

      // Gift card: a shareable page with an optional personal note.
      const note = String(req.body?.note ?? "").trim().slice(0, 280) || null;
      const { data: gift, error: gErr } = await db.from("gifts").insert({
        from_user: me.profile.id, to_user: benId, amount_kobo: amountKobo, note
      }).select("share_token").single();
      if (gErr) throw gErr;
      const giftLink = `${siteBase()}/gift.html?g=${gift.share_token}`;
      const { data: ben } = await db.from("profiles").select("full_name, email").eq("id", benId).maybeSingle();
      if (ben?.email) {
        await sendEmail({ to: ben.email, ...giftEmail({ toName: ben.full_name, fromName: me.profile.full_name, amountKobo, note, link: giftLink }) });
      }
      return send(res, 200, { ok: true, giftLink });
    }

    const reference = newReference("fund");
    const { error: insErr } = await db.from("paystack_payments").insert({
      reference, purpose: "fund_beneficiary", payer_id: me.profile.id, target_user_id: benId, amount_kobo: amountKobo
    });
    if (insErr) throw insErr;
    const authorization_url = await paystackInitialize({
      email: me.profile.email, amountKobo, reference,
      callbackUrl: `${siteUrl(req)}/profile?paid=${reference}`,
      metadata: { purpose: "fund_beneficiary" }
    });
    send(res, 200, { authorization_url });
  } catch (e) {
    console.error("beneficiary-fund:", e);
    send(res, 500, { error: "Could not complete that. Please try again." });
  }
}
