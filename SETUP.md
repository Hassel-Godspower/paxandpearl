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

## 7. Client accounts and emails

**How clients get accounts**
- **Existing clients:** import them from your sheet (step 4). Then send them `messages/existing-clients-whatsapp.txt`, with their first name filled in.
- **New clients:** they open `/profile`, choose "New here?", and enter their name, email and phone. The account is created and a login link is emailed to them. One account per phone number. Anyone with an email can sign up.
- **After a paid booking as a guest:** the confirmation page offers "Create my wallet", with their details already filled in.
- Public sign-up in Supabase stays **off**. Accounts are created only through your server, which is where the one-account-per-phone rule is enforced.

**Customise the emails**
1. Supabase → **Authentication → Email Templates**.
2. **Magic Link** (login emails): set the subject to `Your Pax & Pearl login link`. Paste the whole of `emails/magic-link.html` into the body.
3. **Invite user** (beneficiary emails): set the subject to `You've been added to a Pax & Pearl Wellness Wallet`. Paste the whole of `emails/invite-user.html` into the body.
4. Click **Save** on each one.

The templates use the Pax & Pearl colours and keep the `{{ .ConfirmationURL }}` link, which must stay in place. The invite email also shows the name of the person who added the beneficiary.

Test each email by requesting a login link or adding a beneficiary with an address you own. Check the result in your inbox and in Resend's Logs.
