#!/usr/bin/env node
/* Import clients from your spreadsheet into Supabase (one account + empty wallet each).
 *
 *   1. In Excel / Google Sheets: File -> Save/Download as CSV.
 *      Needs columns named like:  Name | Phone | Email   (any order; "Full Name", "WhatsApp" etc. also work)
 *   2. SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *        node scripts/import-clients.mjs clients.csv --dry-run      # check first, writes nothing
 *   3. Run again without --dry-run to create the accounts.
 *   4. To email every client their login link straight away, add --send-links:
 *        SUPABASE_ANON_KEY=... SITE_URL=https://paxandpearl.com node scripts/import-clients.mjs clients.csv --send-links
 *      Each client gets the Magic Link email (your branded template, sent through your Resend SMTP).
 *
 * - Safe to re-run: people who already exist (same phone or email) are skipped.
 * - No emails are sent unless you add --send-links. Clients can always log in on /profile with their email.
 * - Rows without a valid email or phone are written to import-skipped.csv so you can fix them.
 * - Run this on your own computer. The service-role key must never go in the website code.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { admin, normalizePhone, isEmail } from "../api/_lib/util.js";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const sendLinks = args.includes("--send-links");
const siteUrl = (process.env.SITE_URL || "https://paxandpearl.com").replace(/\/$/, "");
if (!file) { console.error("Usage: node scripts/import-clients.mjs clients.csv [--dry-run]"); process.exit(1); }

/* ---- tiny CSV parser (handles quotes, commas and newlines inside quotes) ---- */
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = ""; if (row.some((v) => v.trim() !== "")) rows.push(row); row = [];
    } else cell += c;
  }
  row.push(cell); if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const rows = parseCsv(readFileSync(file, "utf8"));
if (rows.length < 2) { console.error("The CSV has no data rows."); process.exit(1); }
const header = rows[0].map((h) => h.trim().toLowerCase());
const findCol = (...names) => header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
const iName = findCol("full name", "name", "client");
const iPhone = findCol("phone", "whatsapp", "mobile", "number");
const iEmail = findCol("email", "e-mail");
if (iName < 0 || iPhone < 0 || iEmail < 0) {
  console.error(`Couldn't find all of the Name, Phone and Email columns. Headers seen: ${rows[0].join(" | ")}`);
  process.exit(1);
}

const db = admin();
const seenPhones = new Set(), seenEmails = new Set();
const stats = { created: 0, existing: 0, skipped: 0, failed: 0, linksSent: 0 };
const toLink = [];
const skipped = [["Name", "Phone", "Email", "Reason"]];

for (let r = 1; r < rows.length; r++) {
  const raw = rows[r];
  const name = (raw[iName] || "").trim().replace(/\s+/g, " ");
  const phone = normalizePhone(raw[iPhone]);
  const email = (raw[iEmail] || "").trim().toLowerCase();
  const skip = (reason) => { stats.skipped++; skipped.push([name, raw[iPhone] || "", raw[iEmail] || "", reason]); };

  if (name.length < 2) { skip("missing name"); continue; }
  if (!phone) { skip("invalid phone number"); continue; }
  if (!isEmail(email)) { skip("missing or invalid email (needed to log in)"); continue; }
  if (seenPhones.has(phone) || seenEmails.has(email)) { skip("duplicate row in this file"); continue; }
  seenPhones.add(phone); seenEmails.add(email);
  toLink.push({ name, phone, email, raw });

  const { data: dup } = await db.from("profiles").select("id").or(`phone.eq.${phone},email.ilike.${email}`).limit(1);
  if (dup?.length) { stats.existing++; continue; }
  if (dryRun) { stats.created++; continue; }

  const { data: created, error: authErr } = await db.auth.admin.createUser({
    email, email_confirm: true, user_metadata: { full_name: name, phone }
  });
  if (authErr || !created?.user) {
    stats.failed++; skipped.push([name, phone, email, `auth error: ${authErr?.message}`]); continue;
  }
  const { error: profErr } = await db.from("profiles").insert({
    id: created.user.id, full_name: name, email, phone, status: "active"
  });
  if (profErr) {
    await db.auth.admin.deleteUser(created.user.id);   // never leave an account without a profile
    stats.failed++; skipped.push([name, phone, email, `profile error: ${profErr.message}`]); continue;
  }
  stats.created++;
}

console.log(`${dryRun ? "[DRY RUN] would create" : "Created"}: ${stats.created}`);
console.log(`Already existed (skipped): ${stats.existing}`);
console.log(`Skipped for bad data: ${stats.skipped}`);
console.log(`Failed: ${stats.failed}`);

/* ---- optional: email each client a magic login link ---- */
if (sendLinks && !dryRun) {
  if (!process.env.SUPABASE_ANON_KEY) { console.error("--send-links needs SUPABASE_ANON_KEY (the publishable/anon key)."); process.exit(1); }
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  for (const c of toLink) {
    const { error } = await anon.auth.signInWithOtp({
      email: c.email,
      options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/profile` }
    });
    if (error) {
      skipped.push([c.name, c.phone, c.email, `login link failed: ${error.message}`]);
      if (/rate limit|too many/i.test(error.message)) { console.log("Email rate limit reached. Wait an hour and run this command again; it will continue."); break; }
    } else stats.linksSent++;
    await new Promise((resolve) => setTimeout(resolve, 2500));   // pace the emails
  }
  console.log(`Login links sent: ${stats.linksSent} of ${toLink.length}`);
} else if (sendLinks && dryRun) {
  console.log(`[DRY RUN] would email login links to ${toLink.length} clients`);
}
if (skipped.length > 1) {
  writeFileSync("import-skipped.csv", skipped.map((r) => r.map(csvCell).join(",")).join("\n"));
  console.log("Rows that need attention were written to import-skipped.csv");
}
