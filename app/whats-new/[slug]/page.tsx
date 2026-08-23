import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default async function WhatsNewDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: item } = await supabase.from("whats_new").select("*").eq("slug", params.slug).eq("status", "published").single();
  if (!item) notFound();

  return (
    <article className="container-xpera max-w-3xl py-10">
      <p className="text-xs text-slate-400">{item.published_at ? formatDate(item.published_at) : ""}</p>
      <h1 className="mt-2 text-3xl font-bold">{item.title}</h1>
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.title} className="mt-6 w-full rounded-xl2 object-cover" />
      )}
      <div className="prose mt-6 max-w-none whitespace-pre-line text-slate-700">{item.content}</div>
    </article>
  );
}
