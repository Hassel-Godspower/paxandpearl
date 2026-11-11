/* Pax & Pearl client auth helper (Supabase). Load AFTER:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="/js/config.js"></script>
   Exposes window.PaxAuth = { configured, client, session(), api(path, opts), naira(n) } */
(function (w) {
  "use strict";
  const cfg = w.PAX_CONFIG || {};
  const configured = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/YOUR-/.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY));
  const client = configured && w.supabase
    ? w.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;

  async function session() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
  }

  /** Call our own /api/* endpoints with the logged-in user's token (if any). */
  async function api(path, { method = "GET", body } = {}) {
    const s = await session();
    const headers = {};
    if (s) headers.Authorization = `Bearer ${s.access_token}`;
    if (body) headers["Content-Type"] = "application/json";
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let json = {};
    try { json = await res.json(); } catch (_) {}
    if (!res.ok) {
      const err = new Error(json.message || json.error || "Request failed");
      err.status = res.status;
      err.code = json.error;
      throw err;
    }
    return json;
  }

  const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  w.PaxAuth = { configured, client, session, api, naira };
})(window);
