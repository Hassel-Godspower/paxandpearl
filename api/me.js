// GET  /api/me           -> { birthday }
// POST /api/me { birthday: "YYYY-MM-DD" | null }  -> saves the client's birthday (used for a birthday email)
import { admin, getAuthed, send, methodGuard } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET", "POST"])) return;
  try {
    const me = await getAuthed(req);
    if (!me) return send(res, 401, { error: "Please log in first." });
    const db = admin();
    if (req.method === "GET") {
      const { data } = await db.from("profiles").select("birthday").eq("id", me.profile.id).maybeSingle();
      return send(res, 200, { birthday: data?.birthday ?? null });
    }
    const raw = req.body?.birthday;
    let birthday = null;
    if (raw) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) && !isNaN(Date.parse(`${raw}T12:00:00Z`));
      if (!ok) return send(res, 400, { error: "Enter a valid date." });
      birthday = String(raw);
    }
    const { error } = await db.from("profiles").update({ birthday }).eq("id", me.profile.id);
    if (error) throw error;
    send(res, 200, { ok: true, birthday });
  } catch (e) {
    console.error("me:", e);
    send(res, 500, { error: "Could not save your birthday. Please try again." });
  }
}
