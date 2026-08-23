import "server-only";
import { createClient } from "../supabase/server";

export class UnauthorizedError extends Error {
  constructor(message = "You must be logged in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Returns the current authenticated user + profile, or throws.
 * Use at the top of every Server Action / Route Handler that needs
 * "the logged-in user" — never trust a userId passed from the client.
 */
export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new UnauthorizedError();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_disabled) throw new ForbiddenError("Account is disabled.");

  return { user, profile };
}

/**
 * Same as requireUser, but also asserts role === 'admin'.
 * Use at the top of EVERY admin server action / route handler, in
 * addition to (not instead of) the middleware check — defense in depth.
 */
export async function requireAdmin() {
  const { user, profile } = await requireUser();
  if (profile.role !== "admin") throw new ForbiddenError("Admin access required.");
  return { user, profile };
}
