# Wellness Wallet: setup guide

Do these in order. Use Paystack **test mode** until step 8 passes.

## 1. Supabase
1. Create a project at supabase.com.
2. **SQL Editor** → paste all of `supabase/schema.sql` → Run.
3. **Authentication → URL Configuration**: set *Site URL* to your live domain and add `https://YOUR-DOMAIN/profile` under *Redirect URLs*.
4. **Authentication → Email Templates**: edit "Magic Link" and "Invite user" to match Pax & Pearl wording.
5. **Authentication → SMTP Settings**: add your own SMTP (Resend, Brevo, etc.). Supabase's built-in email is limited to a few messages per hour and is not enough for real clients.
6. **Project Settings → API**: copy the *Project URL*, the *anon* key, and the *service_role* key.

## 2. Paystack
1. Paystack dashboard → **Settings → API Keys & Webhooks**.
2. Copy the **test secret key** (`sk_test_...`).
3. Set **Webhook URL** to `https://YOUR-DOMAIN/api/paystack-webhook`.

## 3. Website config
- Edit `js/config.js`: paste the Supabase **Project URL** and **anon** key (these two are safe to be public).
- In **Vercel → Settings → Environment Variables** add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `SITE_URL` (see `.env.example`). Redeploy.
- Never put the service_role key or the Paystack secret key in any file in the repo.

## 4. Import your clients
1. Export your spreadsheet as CSV with columns **Name, Phone, Email**.
2. In a terminal inside the project: `npm install`
3. Dry run (writes nothing):
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-clients.mjs clients.csv --dry-run`
4. Run it again without `--dry-run`. Rows with a bad phone or email go to `import-skipped.csv` for you to fix and re-run (it skips people already imported).
5. Importing sends no emails. Clients log in at `/profile` with their email and get a magic link.

## 5. Test end to end (test mode)
- Log in as a test client → **Top up** ₦1,000 with Paystack's test card → balance updates.
- Add a beneficiary that is not a client (use an email you own) → invite arrives, beneficiary appears with "Invite sent".
- **+ Add Fund** from wallet → beneficiary sees a notification and balance.
- Book a service on `/booking` with each payment option.

## 6. Go live
Swap `PAYSTACK_SECRET_KEY` to `sk_live_...`, set the live webhook URL, redeploy.

## Notes
- Service prices are read from `catalog.json` on the server, so changing a price in your admin page changes it everywhere.
- Wallet money can only be spent on bookings; there is no withdraw path.
- To refund a cancelled wallet booking, run in the SQL editor: `select refund_wallet_booking('<booking id>');`
- The existing admin page stores bookings in the browser only. Paid bookings are in the Supabase `bookings` table (Table Editor) and are also sent to your Google Form and WhatsApp.
