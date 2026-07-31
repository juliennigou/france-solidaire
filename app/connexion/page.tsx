import Link from "next/link";
import { Check, ChevronRight, UserRound } from "lucide-react";

import { AccountRequestForm } from "@/components/account-request-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Connexion" };

export default function ConnectionPage() {
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
              Mon espace
            </li>
          </ol>
        </nav>

        <div className="mx-auto mt-10 max-w-xl border border-line border-t-4 border-t-blue-france bg-white p-6 md:p-8">
          <span className="flex size-12 items-center justify-center bg-blue-france text-white">
            <UserRound className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em] text-ink">
            Accéder à mon espace
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-7 text-muted-foreground">
            Aucun mot de passe. Nous vous envoyons un lien personnel par email
            pour retrouver vos annonces et les réponses reçues.
          </p>
          <div className="mt-6">
            <AccountRequestForm />
          </div>
          <ul className="mt-6 grid gap-2 border border-line bg-alt p-4 text-[0.9375rem] text-ink">
            {[
              "Retrouver, fermer ou rouvrir vos annonces",
              "Lire les réponses reçues",
              "Supprimer vos données vous-même",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-relais" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.8125rem] leading-5 text-muted-foreground">
            Le lien est personnel, utilisable une seule fois et expire après
            15 minutes. Publier une annonce ne nécessite aucun compte.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
