import Link from "next/link";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main id="contenu" className="site-container min-h-screen py-12">
      <Link href="/" className="text-sm font-semibold text-teal">
        ← Retour à l’accueil
      </Link>
      <article className="prose prose-slate mt-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-ink">{title}</h1>
        <div className="mt-8 space-y-7 leading-7 text-muted-foreground">
          {children}
        </div>
      </article>
    </main>
  );
}
