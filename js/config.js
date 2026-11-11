/* Public Supabase settings. Safe to ship in the browser:
   the anon key only does what Row Level Security allows.
   Find both in Supabase -> Project Settings -> API.
   NEVER put the service_role key or any Paystack secret key in this file. */
window.PAX_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY"
};
