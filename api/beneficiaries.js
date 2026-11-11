// GET  /api/beneficiaries                      -> { beneficiaries: [{ id, userId, name, phone, status }] }
// POST /api/beneficiaries { name, phone, email? } -> adds one.
//   - If the phone (or email) already belongs to a client, they are added and notified in the app.
//   - Otherwise an account is auto-created and an invite email is sent (email is then required).
import { admin, getAuthed, send, methodGuard, siteUrl, normalizePhone, isEmail } from "./_lib/util.js";

const MAX_BENEFICIARIES = 20;

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET", "POST"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    const db = admin();

    if (req.method === "GET") {
      const { data: rows, error } = await db
        .from("beneficiaries").select("id, beneficiary_user_id").eq("owner_id", me.profile.id).order("created_at");
      if (error) throw error;
      const ids = rows.map((r) => r.beneficiary_user_id);
      const { data: profs } = ids.length
        ? await db.from("profiles").select("id, full_name, phone, status").in("id", ids)
        : { data: [] };
      const byId = new Map((profs || []).map((p) => [p.id, p]));
      return send(res, 200, {
        beneficiaries: rows.map((r) => {
          const p = byId.get(r.beneficiary_user_id) || {};
          return { id: r.id, userId: r.beneficiary_user_id, name: p.full_name || "Beneficiary", phone: p.phone || "", status: p.status || "active" };
        })
      });
    }

    // ----- POST: add a beneficiary -----
    const name = String(req.body?.name ?? "").trim().slice(0, 80);
    const phone = normalizePhone(req.body?.phone);
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (name.length < 2) return send(res, 400, { error: "Enter the beneficiary's name." });
    if (!phone) return send(res, 400, { error: "Enter a valid Nigerian phone number." });

    const { count } = await db.from("beneficiaries").select("id", { count: "exact", head: true }).eq("owner_id", me.profile.id);
    if ((count ?? 0) >= MAX_BENEFICIARIES) return send(res, 400, { error: `You can add up to ${MAX_BENEFICIARIES} beneficiaries.` });

    // Existing client? Match by phone first, then by email.
    let { data: existing } = await db.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (!existing && isEmail(email)) {
      ({ data: existing } = await db.from("profiles").select("id").ilike("email", email).maybeSingle());
    }

    let beneficiaryId, outcome;
    if (existing) {
      beneficiaryId = existing.id;
      outcome = "existing";
    } else {
      if (!isEmail(email)) {
        return send(res, 400, { error: "email_required", message: "This person isn't a client yet. Add their email so we can send an invite." });
      }
      const { data: invited, error: inviteErr } = await db.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, phone },
        redirectTo: `${siteUrl(req)}/profile`
      });
      if (inviteErr || !invited?.user) {
        console.error("invite:", inviteErr?.message);
        return send(res, 400, { error: "We couldn't invite that email address. Check it and try again." });
      }
      beneficiaryId = invited.user.id;
      const { error: profErr } = await db.from("profiles").insert({
        id: beneficiaryId, full_name: name, email, phone, status: "invited"
      });
      if (profErr) {
        await db.auth.admin.deleteUser(beneficiaryId); // don't leave a half-created account
        console.error("profile insert:", profErr.message);
        return send(res, 500, { error: "Could not create the beneficiary. Please try again." });
      }
      outcome = "invited";
    }

    if (beneficiaryId === me.profile.id) return send(res, 400, { error: "You can't add yourself." });
    const { error: addErr } = await db.rpc("add_beneficiary", { p_owner_id: me.profile.id, p_beneficiary_user_id: beneficiaryId });
    if (addErr) throw addErr;
    send(res, 200, { ok: true, outcome });
  } catch (e) {
    console.error("beneficiaries:", e);
    send(res, 500, { error: "Something went wrong. Please try again." });
  }
}
