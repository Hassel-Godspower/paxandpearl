// Auto top-up crediting, shared by the Paystack webhook and the daily job.
// Each monthly charge is credited exactly once: the ledger reference is unique.
import { sendEmail, receiptEmail } from "./mail.js";

export async function creditAutoTopup(db, { reference, amountKobo, userId }) {
  const ledgerRef = `autotopup_${reference}`;
  const { data: already } = await db.from("wallet_transactions").select("id").eq("reference", ledgerRef).maybeSingle();
  if (already) return false;                      // already credited and emailed
  const { data: newBal, error } = await db.rpc("credit_wallet", {
    p_user_id: userId, p_amount_kobo: amountKobo, p_reference: ledgerRef, p_type: "topup"
  });
  if (error) throw error;
  const { data: p } = await db.from("profiles").select("full_name, email").eq("id", userId).maybeSingle();
  if (p?.email) {
    await sendEmail({ to: p.email, ...receiptEmail({
      name: p.full_name, amountKobo, balanceKobo: Number(newBal || 0), reference,
      when: new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })
    }) });
  }
  return true;
}
