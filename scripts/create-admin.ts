/**
 * Securely creates (or promotes) an administrator account.
 *
 * This is the ONLY supported way to create an admin account — there is
 * intentionally no public admin registration page. It runs server-side
 * with the Supabase service-role key and never stores or prints a
 * hardcoded password anywhere in source control.
 *
 * The admin password is never hardcoded: it must come from the
 * ADMIN_PASSWORD environment variable (or be generated randomly if you
 * omit it — the generated password is printed once, to your terminal
 * only, and is never written to disk or logged anywhere else).
 *
 * Usage:
 *   ADMIN_EMAIL=admin@xperaone.com ADMIN_PASSWORD='choose-a-strong-one' npm run create-admin
 *
 *   # or let it generate a strong random password for you:
 *   ADMIN_EMAIL=admin@xperaone.com npm run create-admin
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be
 * set (e.g. in .env.local) — the service-role key must NEVER be exposed
 * to the browser or committed to git.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
let password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

if (!email) {
  console.error("Missing ADMIN_EMAIL. Usage: ADMIN_EMAIL=admin@xperaone.com [ADMIN_PASSWORD=...] npm run create-admin");
  process.exit(1);
}

let generated = false;
if (!password) {
  password = randomBytes(12).toString("base64url");
  generated = true;
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log(`Setting up admin account: ${email}`);

  // If the user already exists (e.g. they signed up normally first),
  // just promote their existing profile instead of creating a duplicate.
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase());

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    if (process.env.ADMIN_PASSWORD) {
      // Only touch the password if one was explicitly provided — don't
      // silently reset an existing admin's password on re-run.
      await supabase.auth.admin.updateUserById(userId, { password });
    }
    console.log("Found existing account — promoting to admin.");
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrator" }
    });

    if (error || !created?.user) {
      console.error("Could not create admin user:", error?.message ?? "unknown error");
      process.exit(1);
    }

    userId = created.user.id;
    console.log("Created new account.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", is_disabled: false })
    .eq("id", userId);

  if (profileError) {
    console.error("Account was created/found but the role update failed:", profileError.message);
    console.error("You can fix this manually: update profiles set role = 'admin' where id = '" + userId + "';");
    process.exit(1);
  }

  console.log("\n✔ Admin account ready.");
  console.log(`  Email:    ${email}`);
  if (generated) {
    console.log(`  Password: ${password}  (generated — save this now, it will not be shown again)`);
  } else if (process.env.ADMIN_PASSWORD) {
    console.log("  Password: (the one you provided in ADMIN_PASSWORD)");
  } else {
    console.log("  Password: unchanged (existing account, no ADMIN_PASSWORD supplied)");
  }
  console.log(`  Login at: ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/login`);
}

main().then(() => process.exit(0));
