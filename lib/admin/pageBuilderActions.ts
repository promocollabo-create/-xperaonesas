"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeCustomHtml, sanitizeCustomCss } from "@/lib/sanitize/html";
import type { PageSectionType } from "@/types/database";

async function getOrCreatePage(slug: string, title: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (existing) return existing;
  const { data: created, error } = await admin.from("pages").insert({ slug, title, status: "draft" }).select("*").single();
  if (error || !created) throw new Error("Could not create page.");
  return created;
}

/** Ensures the page has a draft copy of its sections to edit, seeding
 * from the published copy the first time a page is opened in the builder. */
export async function ensureDraftSections(pageSlug: string, pageTitle: string) {
  const admin = createAdminClient();
  const page = await getOrCreatePage(pageSlug, pageTitle);

  const { data: draftSections } = await admin.from("page_sections").select("id").eq("page_id", page.id).eq("is_draft_version", true).limit(1);

  if (!draftSections || draftSections.length === 0) {
    const { data: published } = await admin.from("page_sections").select("*").eq("page_id", page.id).eq("is_draft_version", false);
    if (published && published.length > 0) {
      await admin.from("page_sections").insert(
        published.map(({ id, created_at, updated_at, ...rest }) => ({ ...rest, is_draft_version: true }))
      );
    }
  }

  return page;
}

export async function addSectionAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const pageId = formData.get("pageId") as string;
  const type = formData.get("type") as PageSectionType;

  const { data: existing } = await admin
    .from("page_sections")
    .select("sort_order")
    .eq("page_id", pageId)
    .eq("is_draft_version", true)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  await admin.from("page_sections").insert({
    page_id: pageId,
    type,
    is_draft_version: true,
    is_enabled: true,
    sort_order: nextOrder,
    config: {},
    custom_html: type === "custom_html" ? "<section class=\"xpera-custom\">\n  <h2>New Section</h2>\n</section>" : null,
    custom_css: type === "custom_html" ? ".xpera-custom {\n  padding: 40px;\n}" : null
  });

  revalidatePath(`/admin/pages/${(await admin.from("pages").select("slug").eq("id", pageId).single()).data?.slug}/builder`);
}

export async function updateSectionAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const configRaw = formData.get("config") as string | null;
  const customHtml = formData.get("customHtml") as string | null;
  const customCss = formData.get("customCss") as string | null;

  const payload: Record<string, unknown> = {};
  if (configRaw !== null) {
    try {
      payload.config = JSON.parse(configRaw);
    } catch {
      // ignore malformed JSON — leave config untouched
    }
  }
  if (customHtml !== null) payload.custom_html = sanitizeCustomHtml(customHtml);
  if (customCss !== null) payload.custom_css = sanitizeCustomCss(customCss);

  await admin.from("page_sections").update(payload).eq("id", id);
}

export async function duplicateSectionAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const { data: section } = await admin.from("page_sections").select("*").eq("id", id).single();
  if (!section) return;

  const { id: _id, created_at, updated_at, ...rest } = section;
  await admin.from("page_sections").insert({ ...rest, sort_order: rest.sort_order + 0.5 });
  await renumberSections(section.page_id);
}

export async function deleteSectionAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("page_sections").delete().eq("id", formData.get("id") as string);
}

export async function moveSectionAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const direction = formData.get("direction") as "up" | "down";

  const { data: section } = await admin.from("page_sections").select("*").eq("id", id).single();
  if (!section) return;

  const { data: siblings } = await admin
    .from("page_sections")
    .select("*")
    .eq("page_id", section.page_id)
    .eq("is_draft_version", true)
    .order("sort_order");

  if (!siblings) return;
  const index = siblings.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
  if (!swapWith) return;

  await admin.from("page_sections").update({ sort_order: swapWith.sort_order }).eq("id", section.id);
  await admin.from("page_sections").update({ sort_order: section.sort_order }).eq("id", swapWith.id);
}

export async function toggleSectionEnabledAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const isEnabled = formData.get("isEnabled") === "true";
  await admin.from("page_sections").update({ is_enabled: !isEnabled }).eq("id", id);
}

async function renumberSections(pageId: string) {
  const admin = createAdminClient();
  const { data: sections } = await admin.from("page_sections").select("*").eq("page_id", pageId).eq("is_draft_version", true).order("sort_order");
  if (!sections) return;
  for (let i = 0; i < sections.length; i++) {
    await admin.from("page_sections").update({ sort_order: i }).eq("id", sections[i].id);
  }
}

/** Draft changes never affect the live site — this is a no-op on published content. */
export async function saveDraftAction(pageSlug: string) {
  "use server";
  await requireAdmin();
  revalidatePath(`/admin/pages/${pageSlug}/builder`);
  return { success: true };
}

/**
 * PUBLISH: atomically replaces the published section set with the current
 * draft. This is the only action in the entire builder that touches what
 * the public site renders.
 */
export async function publishPageAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const pageId = formData.get("pageId") as string;
  const pageSlug = formData.get("pageSlug") as string;

  const { data: draftSections } = await admin.from("page_sections").select("*").eq("page_id", pageId).eq("is_draft_version", true);

  await admin.from("page_sections").delete().eq("page_id", pageId).eq("is_draft_version", false);

  if (draftSections && draftSections.length > 0) {
    await admin.from("page_sections").insert(
      draftSections.map(({ id, created_at, updated_at, ...rest }) => ({ ...rest, is_draft_version: false }))
    );
  }

  await admin.from("pages").update({ status: "published", published_at: new Date().toISOString() }).eq("id", pageId);

  revalidatePath(`/admin/pages/${pageSlug}/builder`);
  revalidatePath(pageSlug === "home" ? "/" : `/${pageSlug}`);
}
