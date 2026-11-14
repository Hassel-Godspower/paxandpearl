// GET /api/gift?g=TOKEN  -> the shareable gift card (first names only, no contact details)
import { admin, send, methodGuard } from "./_lib/util.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  try {
    const token = String(req.query?.g ?? "").replace(/[^a-f0-9]/gi, "");
    if (!/^[a-f0-9]{32}$/i.test(token)) return send(res, 404, { error: "Gift not found." });
    const db = admin();
    const { data: g } = await db.from("gifts")
      .select("amount_kobo, note, created_at, from_user, to_user").eq("share_token", token).maybeSingle();
    if (!g) return send(res, 404, { error: "Gift not found." });
    const { data: people } = await db.from("profiles").select("id, full_name").in("id", [g.from_user, g.to_user]);
    const name = (id) => String((people || []).find((p) => p.id === id)?.full_name || "").trim().split(/\s+/)[0] || "A friend";
    send(res, 200, {
      from: name(g.from_user), to: name(g.to_user),
      amount: Number(g.amount_kobo) / 100, note: g.note || "", date: g.created_at
    });
  } catch (e) {
    console.error("gift:", e);
    send(res, 500, { error: "Could not load this gift." });
  }
}
