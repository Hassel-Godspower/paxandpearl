// POST /api/register  { name, email, phone }  -> { ok: true }
// Anyone with an email can create a Wellness Wallet account. Rules:
//  - one account per phone number (409 if the number belongs to a different email)
//  - if the email already has an account, nothing is created; the page then sends a login link
// The browser sends the login link itself afterwards (signInWithOtp), using the Magic Link template.
import { admin, send, methodGuard, normalizePhone, isEmail } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  try {
    const name = String(req.body?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const phone = normalizePhone(req.body?.phone);
    if (name.length < 2) return send(res, 400, { error: "Enter your full name." });
    if (!isEmail(email)) return send(res, 400, { error: "Enter a valid email address." });
    if (!phone) return send(res, 400, { error: "Enter a valid Nigerian phone number." });

    const db = admin();

    // Phone numbers belong to one account only.
    const { data: byPhone, error: pErr } = await db.from("profiles").select("email").eq("phone", phone).maybeSingle();
    if (pErr) throw pErr;
    if (byPhone && byPhone.email.toLowerCase() !== email) {
      return send(res, 409, {
        error: "phone_taken",
        message: "This phone number is already linked to another account. If that isn't you, message us on WhatsApp and we'll sort it out."
      });
    }

    // Email already has an account: nothing to create. The page sends the login link.
    const { data: byEmail, error: eErr } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (eErr) throw eErr;
    if (byEmail || byPhone) return send(res, 200, { ok: true, existing: true });

    // New account: confirmed straight away, so Supabase sends no separate sign-up email.
    const { data: created, error: cErr } = await db.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { full_name: name, phone }
    });
    if (cErr || !created?.user) {
      console.error("register createUser:", cErr?.message);
      // An auth account may already exist without a profile; the page still sends a login link.
      return send(res, 200, { ok: true, existing: true });
    }

    const { error: profErr } = await db.from("profiles").insert({
      id: created.user.id, full_name: name, email, phone, status: "active"
    });
    if (profErr) {
      await db.auth.admin.deleteUser(created.user.id);   // never leave a login without a profile
      if (/duplicate|unique/i.test(profErr.message)) {
        return send(res, 409, { error: "phone_taken", message: "This phone number is already linked to another account." });
      }
      throw profErr;
    }
    send(res, 200, { ok: true, existing: false });
  } catch (e) {
    console.error("register:", e);
    send(res, 500, { error: "Could not create your account. Please try again." });
  }
}
