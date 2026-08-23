import { createAdminClient } from "../../../../../lib/supabase/admin";
import { ensureDraftSections, publishPageAction } from "../../../../../lib/admin/pageBuilderActions";
import SectionEditor from "../../../../../components/admin/PageBuilderEditor";

const PAGE_TITLES: Record<string, string> = { home: "Home" };

export default async function PageBuilderPage({ params }: { params: { slug: string } }) {
  const title = PAGE_TITLES[params.slug] ?? params.slug;
  const page = await ensureDraftSections(params.slug, title);

  const admin = createAdminClient();
  const { data: draftSections } = await admin
    .from("page_sections")
    .select("*")
    .eq("page_id", page.id)
    .eq("is_draft_version", true)
    .order("sort_order");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Builder — {title}</h1>
          <p className="text-sm text-slate-500">
            Draft changes here never affect the live site. Click Publish to push the draft live.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/admin/pages/${params.slug}/builder?preview=1`} target="_blank" className="btn-secondary !py-2 text-sm">
            Preview
          </a>
          <form action={publishPageAction}>
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="pageSlug" value={params.slug} />
            <button className="btn-primary !py-2 text-sm">Publish</button>
          </form>
        </div>
      </div>

      <SectionEditor pageId={page.id} pageSlug={params.slug} sections={draftSections ?? []} />
    </div>
  );
}
