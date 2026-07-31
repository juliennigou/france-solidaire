"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, LogIn, Menu, PenLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  /** Sur la page d’accueil, les actions ouvrent les fenêtres de dialogue. */
  onLogin?: () => void;
  onPublish?: () => void;
  /** Les ancres pointent vers l’accueil depuis les pages secondaires. */
  home?: boolean;
};

const sections = [
  { href: "#annonces", label: "Les annonces" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#engagement", label: "Notre engagement" },
];

export function SiteHeader({
  onLogin,
  onPublish,
  home = false,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const prefix = home ? "" : "/";

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="border-b-2 border-blue-france bg-background md:sticky md:top-0 md:z-40">
      <div className="border-b border-line">
        <div className="site-container flex h-18 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 no-underline"
            aria-label="France Solidaire, retour à l’accueil"
          >
            <span className="brand-mark">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[1.0625rem] font-extrabold tracking-[-0.02em] text-ink uppercase">
                France Solidaire
              </span>
              <span className="hidden text-[0.8125rem] text-muted-foreground sm:block">
                L’entraide de proximité, entre voisins
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {onLogin ? (
              <Button
                variant="ghost"
                className="h-11 px-4 text-[0.9375rem] font-semibold text-blue-france"
                onClick={onLogin}
              >
                <LogIn />
                Se connecter
              </Button>
            ) : (
              <Button
                render={<Link href="/connexion" />}
                variant="ghost"
                className="h-11 px-4 text-[0.9375rem] font-semibold text-blue-france no-underline"
              >
                <LogIn />
                Se connecter
              </Button>
            )}
            <Button
              className="h-11 bg-blue-france px-5 text-[0.9375rem] font-semibold text-white hover:bg-blue-france-hover"
              onClick={onPublish}
              render={onPublish ? undefined : <Link href="/#publier" />}
            >
              <PenLine />
              Publier une annonce
            </Button>
          </div>

          <Button
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            variant="outline"
            className="h-11 gap-2 border-line px-3 text-[0.9375rem] font-semibold text-ink md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X /> : <Menu />}
            Menu
          </Button>
        </div>
      </div>

      <nav
        aria-label="Navigation principale"
        className="hidden bg-blue-france-975 md:block"
      >
        <ul className="site-container flex items-center gap-1">
          {sections.map((section) => (
            <li key={section.href}>
              <a
                href={`${prefix}${section.href}`}
                className="flex h-12 items-center border-b-2 border-transparent px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:border-blue-france hover:text-blue-france"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        id="menu-mobile"
        className={cn("border-t border-line md:hidden", !menuOpen && "hidden")}
      >
        <ul className="site-container divide-y divide-line py-1">
          {sections.map((section) => (
            <li key={section.href}>
              <a
                href={`${prefix}${section.href}`}
                className="flex min-h-14 items-center font-medium text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="site-container grid gap-2 py-4">
          {onLogin ? (
            <Button
              variant="outline"
              className="h-12 justify-center border-blue-france text-[0.9375rem] font-semibold text-blue-france"
              onClick={() => {
                setMenuOpen(false);
                onLogin();
              }}
            >
              <LogIn />
              Se connecter
            </Button>
          ) : (
            <Button
              render={<Link href="/connexion" />}
              variant="outline"
              className="h-12 justify-center border-blue-france text-[0.9375rem] font-semibold text-blue-france no-underline"
            >
              <LogIn />
              Se connecter
            </Button>
          )}
          <Button
            className="h-12 justify-center bg-blue-france text-[0.9375rem] font-semibold text-white hover:bg-blue-france-hover"
            onClick={
              onPublish
                ? () => {
                    setMenuOpen(false);
                    onPublish();
                  }
                : undefined
            }
            render={onPublish ? undefined : <Link href="/#publier" />}
          >
            <PenLine />
            Publier une annonce
          </Button>
        </div>
      </div>
    </header>
  );
}
