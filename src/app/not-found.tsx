import Link from "next/link";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <DemoBanner />
      <Header />
      <main className="container-page max-w-xl py-28 text-center">
        <p className="font-display text-8xl text-ink-200">404</p>
        <h1 className="h-display mt-2 text-4xl">Page introuvable</h1>
        <p className="mt-3 text-ink-600">Ce lot ou cette page n&apos;existe pas (ou plus).</p>
        <Link href="/tirages" className="btn-primary mt-8">Voir les tirages</Link>
      </main>
      <Footer />
    </>
  );
}
