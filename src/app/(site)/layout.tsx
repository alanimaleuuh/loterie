import { DemoBanner } from "@/components/layout/DemoBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <DemoBanner />
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}
