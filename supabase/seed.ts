/**
 * Seeds a fresh Supabase project with enough data to see the app working:
 * an admin user, two categories, three products, payment settings, and a
 * minimal published Home page.
 *
 * Usage (after `npm install` and setting up your .env.local):
 *   npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const admin = createClient(url, serviceKey);

async function main() {
  console.log("Seeding XperaOne...");

  // 1. Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@xperaone.example";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: "XperaOne Admin" }
  });

  if (userError && !userError.message.includes("already been registered")) {
    console.error("Could not create admin user:", userError.message);
  } else if (created?.user) {
    await admin.from("profiles").update({ role: "admin", full_name: "XperaOne Admin" }).eq("id", created.user.id);
    console.log(`Admin user ready: ${adminEmail} / ${adminPassword} (change this password after first login)`);
  }

  // 2. Categories
  const { data: categories } = await admin
    .from("categories")
    .upsert(
      [
        { name: "Templates", slug: "templates", is_active: true, sort_order: 0 },
        { name: "Plugins", slug: "plugins", is_active: true, sort_order: 1 }
      ],
      { onConflict: "slug" }
    )
    .select("*");

  const templatesCategory = categories?.find((c) => c.slug === "templates");

  // 3. Products
  await admin.from("products").upsert(
    [
      {
        name: "XperaOne Starter Kit",
        slug: "xperaone-starter-kit",
        short_description: "Everything you need to launch fast.",
        description: "A complete starter kit with components, docs, and examples.",
        price: 49,
        sale_price: 39,
        category_id: templatesCategory?.id,
        status: "published",
        is_featured: true,
        is_new: true,
        license: "Single-site license",
        features: ["Lifetime updates", "Priority support", "Commercial use allowed"]
      },
      {
        name: "Pro Dashboard Template",
        slug: "pro-dashboard-template",
        short_description: "A polished admin dashboard template.",
        price: 79,
        category_id: templatesCategory?.id,
        status: "published",
        is_featured: true,
        features: ["Dark mode", "10+ pages", "Figma source included"]
      },
      {
        name: "SEO Toolkit Plugin",
        slug: "seo-toolkit-plugin",
        short_description: "Boost your site's search ranking.",
        price: 29,
        status: "published",
        is_new: true,
        features: ["Automated sitemap", "Meta tag manager"]
      }
    ],
    { onConflict: "slug" }
  );

  // 4. Payment settings
  await admin
    .from("payment_settings")
    .update({
      method_name: "Bank Transfer",
      account_name: "XperaOne Inc.",
      account_number: "0000-0000-0000",
      bank_details: "Example Bank, Routing 000000000",
      instructions: "Please include your order number as the payment reference.",
      currency: "USD"
    })
    .eq("id", 1);

  // 5. A minimal published Home page (Page Builder falls back to a live
  // default anyway if this is skipped, but this shows the builder working end-to-end).
  const { data: homePage } = await admin
    .from("pages")
    .upsert({ slug: "home", title: "Home", status: "published", published_at: new Date().toISOString() }, { onConflict: "slug" })
    .select("*")
    .single();

  if (homePage) {
    const sections = [
      { type: "hero", config: { headline: "Premium Digital Products", subheadline: "Instant delivery, verified payments.", ctaLabel: "Shop Now", ctaHref: "/shop" } },
      { type: "featured_products", config: { title: "Featured Products", limit: 8 } },
      { type: "categories", config: { limit: 6 } }
    ];
    for (const isDraft of [true, false]) {
      await admin.from("page_sections").delete().eq("page_id", homePage.id).eq("is_draft_version", isDraft);
      await admin.from("page_sections").insert(
        sections.map((s, i) => ({ page_id: homePage.id, is_draft_version: isDraft, is_enabled: true, sort_order: i, ...s }))
      );
    }
  }

  console.log("Seed complete.");
}

main().then(() => process.exit(0));
