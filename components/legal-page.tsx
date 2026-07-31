import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="site-container min-h-[60vh] py-8 md:py-12">
        <nav aria-label="Fil d’Ariane">
          <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-muted-foreground">
            <li>
              <Link href="/" className="text-link">
                Accueil
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-ink">
              {title}
            </li>
          </ol>
        </nav>

        <article className="mt-8 max-w-3xl">
          <h1 className="section-title">{title}</h1>
          <div className="mt-8 space-y-8 text-[1.0625rem] leading-8 text-muted-foreground">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
