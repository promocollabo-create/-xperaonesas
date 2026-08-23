"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "./roles";
import { createClient } from "../supabase/server";
import { z } from "zod";

const schema = z.object({ fullName: z.string().min(1), phone: z.string().optional() });

export async function updateProfileAction(formData: FormData) {
  const { user } = await requireUser();
  const parsed = schema.safeParse({ fullName: formData.get("fullName"), phone: formData.get("phone") });
  if (!parsed.success) return { error: "Invalid input." };

  const supabase = createClient();
  await supabase.from("profiles").update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null }).eq("id", user.id);
  revalidatePath("/account/profile");
  return { success: true };
}
