"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { z } from "zod";

const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

export type AdminLoginState = { error?: string } | undefined;

/**
 * Dedicated admin login. Distinct from the customer `loginAction` so that
 * admin credential checks and role verification never share a code path
 * with the public-facing login form.
 *
 * Flow:
 *   1. Authenticate against Supabase Auth (never a separate password store).
 *   2. Re-fetch the session server-side (never trust the client).
 *   3. Look up profiles.role for that user.
 *   4. role === 'admin' (and not disabled) -> redirect to /admin.
 *      Anything else -> sign the session back out immediately and deny.
 */
export async function adminLoginAction(_prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email and password." };
  }

  const supabase = createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
  if (signInError) {
    return { error: "Incorrect email or password." };
  }

  // Never trust the client-side session alone — re-verify server-side.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Could not verify session. Please try again." };
  }

  const { data: profile } = await supabase.from("profiles").select("role, is_disabled").eq("id", user.id).single();

  if (!profile || profile.role !== "admin" || profile.is_disabled) {
    // A valid login with the wrong role must not leave an active session
    // sitting in the browser — sign out before denying.
    await supabase.auth.signOut();
    return { error: "Access denied. Admin privileges required." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function adminLogoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
