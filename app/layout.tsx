import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "../lib/supabase/server";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnnouncementBar from "../components/AnnouncementBar";
import { CartProvider } from "../components/CartProvider";

export const metadata: Metadata = {
  title: {
    default: "XperaOne — Digital Marketplace",
    template: "%s | XperaOne"
  },
  description: "Premium digital products, delivered securely."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [{ data: settings }, { data: userData }] = await Promise.all([
    supabase.from("website_settings").select("*").eq("id", 1).single(),
    supabase.auth.getUser()
  ]);

  let profile = null;
  if (userData?.user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
    profile = data;
  }

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          {settings?.announcement_enabled && settings.announcement_text ? (
            <AnnouncementBar text={settings.announcement_text} />
          ) : null}
          <Header settings={settings} user={profile} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </CartProvider>
      </body>
    </html>
  );
}
