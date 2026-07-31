import Link from "next/link";
import { HeartHandshake } from "lucide-react";

const footerLinks = [
  { href: "/#annonces", label: "Les annonces" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#engagement", label: "Notre engagement" },
  { href: "/connexion", label: "Mon espace" },
];

const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Données personnelles" },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-blue-france bg-background">
      <div className="site-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-mark">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <span className="text-[1.0625rem] font-extrabold uppercase tracking-[-0.02em] text-ink">
              France Solidaire
            </span>
          </div>
          <p className="mt-5 max-w-md text-[0.9375rem] leading-7 text-muted-foreground">
            Initiative citoyenne indépendante, sans lien avec une administration.
            La plateforme met en relation des particuliers pour de l’entraide
            gratuite et ne remplace ni les services d’urgence, ni les
            professionnels qualifiés.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <nav aria-label="Pied de page">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink">
              Le service
            </h2>
            <ul className="mt-4 space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[0.9375rem] text-ink hover:text-blue-france hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-ink">
              En cas d’urgence
            </h2>
            <ul className="mt-4 space-y-3 text-[0.9375rem] text-muted-foreground">
              <li>
                <span className="font-bold text-ink">15</span> — Samu
              </li>
              <li>
                <span className="font-bold text-ink">18</span> — Pompiers
              </li>
              <li>
                <span className="font-bold text-ink">112</span> — Numéro
                d’urgence européen
              </li>
              <li>
                <span className="font-bold text-ink">115</span> — Hébergement
                d’urgence
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="site-container flex flex-col gap-3 py-6 text-[0.8125rem] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-blue-france hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            Code source ouvert sous licence MIT · L’aide proposée est toujours
            gratuite.
          </p>
        </div>
      </div>
    </footer>
  );
}
