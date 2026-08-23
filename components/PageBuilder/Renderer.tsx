import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "../ProductGrid";
import { sanitizeCustomHtml, sanitizeCustomCss } from "@/lib/sanitize/html";
import type { PageSection, ProductWithImages, Category } from "../../types/database";

/**
 * Renders a page's PUBLISHED sections only. Draft content never reaches
 * here — that's enforced both by the query (is_draft_version = false) and
 * by RLS on page_sections (see supabase/rls.sql).
 */
export default async function PageRenderer({ sections }: { sections: PageSection[] }) {
  const supabase = createClient();
  const enabled = sections.filter((s) => s.is_enabled).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      {await Promise.all(
        enabled.map(async (section) => {
          switch (section.type) {
            case "hero":
              return <HeroSection key={section.id} config={section.config as any} />;
            case "heading":
              return <HeadingSection key={section.id} config={section.config as any} />;
            case "text":
              return <TextSection key={section.id} config={section.config as any} />;
            case "image":
              return <ImageSection key={section.id} config={section.config as any} />;
            case "button":
              return <ButtonSection key={section.id} config={section.config as any} />;
            case "banner":
              return <BannerSection key={section.id} config={section.config as any} />;
            case "cta":
              return <CtaSection key={section.id} config={section.config as any} />;
            case "newsletter":
              return <NewsletterSection key={section.id} config={section.config as any} />;
            case "faq":
              return <FaqSection key={section.id} config={section.config as any} />;
            case "categories": {
              const { data } = await supabase
                .from("categories")
                .select("*")
                .eq("is_active", true)
                .order("sort_order")
                .limit((section.config as any)?.limit ?? 6);
              return <CategoriesSection key={section.id} categories={(data as Category[]) ?? []} />;
            }
            case "product_grid":
            case "featured_products": {
              let query = supabase
                .from("products")
                .select("*, product_images(*)")
                .eq("status", "published");
              if (section.type === "featured_products") query = query.eq("is_featured", true);
              const { data } = await query.limit((section.config as any)?.limit ?? 8);
              return (
                <ProductsSection
                  key={section.id}
                  title={(section.config as any)?.title ?? (section.type === "featured_products" ? "Featured Products" : "Shop")}
                  products={(data as ProductWithImages[]) ?? []}
                />
              );
            }
            case "custom_html":
              return (
                <CustomHtmlSection
                  key={section.id}
                  html={section.custom_html ?? ""}
                  css={section.custom_css ?? ""}
                />
              );
            default:
              return null;
          }
        })
      )}
    </>
  );
}

function HeroSection({ config }: { config: any }) {
  return (
    <section className="bg-brand-gradient py-20 text-white">
      <div className="container-xpera flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{config?.headline ?? "Premium Digital Products"}</h1>
        <p className="max-w-xl text-lg text-white/85">
          {config?.subheadline ?? "Instant delivery. Verified payments. Secure downloads."}
        </p>
        {config?.ctaLabel && (
          <Link href={config?.ctaHref ?? "/shop"} className="rounded-full bg-white px-8 py-3 font-semibold text-brand-700">
            {config.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
function HeadingSection({ config }: { config: any }) {
  return (
    <div className="container-xpera py-8 text-center">
      <h2 className="text-3xl font-bold text-slate-900">{config?.text ?? ""}</h2>
    </div>
  );
}
function TextSection({ config }: { config: any }) {
  return (
    <div className="container-xpera py-6">
      <p className="mx-auto max-w-3xl text-center text-slate-600">{config?.text ?? ""}</p>
    </div>
  );
}
function ImageSection({ config }: { config: any }) {
  if (!config?.url) return null;
  return (
    <div className="container-xpera py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={config.url} alt={config.alt ?? ""} className="w-full rounded-xl2 object-cover" />
    </div>
  );
}
function ButtonSection({ config }: { config: any }) {
  return (
    <div className="container-xpera flex justify-center py-6">
      <Link href={config?.href ?? "/shop"} className="btn-primary">
        {config?.label ?? "Shop Now"}
      </Link>
    </div>
  );
}
function BannerSection({ config }: { config: any }) {
  return (
    <div className="container-xpera py-6">
      <div className="rounded-xl2 bg-brand-100 p-8 text-center">
        <h3 className="text-2xl font-bold text-brand-800">{config?.title ?? ""}</h3>
        {config?.subtitle && <p className="mt-2 text-brand-700">{config.subtitle}</p>}
      </div>
    </div>
  );
}
function CtaSection({ config }: { config: any }) {
  return (
    <div className="bg-slate-900 py-14 text-center text-white">
      <div className="container-xpera">
        <h3 className="text-3xl font-bold">{config?.title ?? "Ready to get started?"}</h3>
        <Link href={config?.href ?? "/shop"} className="btn-primary mt-6 inline-flex">
          {config?.label ?? "Browse Products"}
        </Link>
      </div>
    </div>
  );
}
function NewsletterSection({ config }: { config: any }) {
  return (
    <div className="container-xpera py-14 text-center">
      <h3 className="text-2xl font-bold">{config?.title ?? "Stay in the loop"}</h3>
      <p className="mt-2 text-slate-500">{config?.subtitle ?? "New releases and offers, straight to your inbox."}</p>
      <form className="mx-auto mt-6 flex max-w-md gap-2">
        <input type="email" required placeholder="you@example.com" className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm" />
        <button type="submit" className="btn-primary !py-3">Subscribe</button>
      </form>
    </div>
  );
}
function FaqSection({ config }: { config: any }) {
  const items: { q: string; a: string }[] = config?.items ?? [];
  return (
    <div className="container-xpera max-w-3xl py-14">
      <h3 className="mb-6 text-center text-2xl font-bold">FAQ</h3>
      <div className="flex flex-col divide-y divide-slate-100">
        {items.map((item, i) => (
          <details key={i} className="py-4">
            <summary className="cursor-pointer font-semibold text-slate-900">{item.q}</summary>
            <p className="mt-2 text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
function CategoriesSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <div className="container-xpera py-14">
      <h3 className="mb-6 text-2xl font-bold">Shop by Category</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="card flex flex-col items-center gap-2 p-4 text-center hover:border-brand-300">
            {c.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image_url} alt={c.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-brand-100" />
            )}
            <span className="text-sm font-medium text-slate-800">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
function ProductsSection({ title, products }: { title: string; products: ProductWithImages[] }) {
  return (
    <div className="container-xpera py-14">
      <h3 className="mb-6 text-2xl font-bold">{title}</h3>
      <ProductGrid products={products} />
    </div>
  );
}

/**
 * Renders admin-authored HTML/CSS. The content is sanitized again here
 * (defense in depth — it's also sanitized on save) and scoped so custom
 * CSS can't leak style rules onto the rest of the page.
 */
function CustomHtmlSection({ html, css }: { html: string; css: string }) {
  const safeHtml = sanitizeCustomHtml(html);
  const safeCss = sanitizeCustomCss(css);
  return (
    <section className="xpera-custom-section">
      {safeCss && <style dangerouslySetInnerHTML={{ __html: safeCss }} />}
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </section>
  );
}
