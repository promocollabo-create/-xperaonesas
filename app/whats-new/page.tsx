import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { WhatsNewItem } from "@/types/database";

export const metadata = { title: "What's New" };
export const revalidate = 60;

const TYPE_LABEL: Record<string, string> = {
  announcement: "Announcement",
  news: "News",
  product_release: "Product Release",
  update: "Update",
  offer: "Offer"
};

export default async function WhatsNewPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("whats_new")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const items = (data as WhatsNewItem[]) ?? [];

  return (
    <div className="container-xpera py-10">
      <h1 className="mb-8 text-3xl font-bold">What's New</h1>
      {items.length === 0 && <p className="text-slate-500">Nothing published yet — check back soon.</p>}
      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <Link key={item.id} href={`/whats-new/${item.slug}`} className="card flex flex-col gap-4 p-6 sm:flex-row">
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.title} className="h-40 w-full rounded-xl object-cover sm:w-56" />
            )}
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="badge-featured">{TYPE_LABEL[item.type]}</span>
                <span className="text-xs text-slate-400">{item.published_at ? formatDate(item.published_at) : ""}</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-slate-600">{item.content}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
