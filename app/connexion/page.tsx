import Link from "next/link";
import { AccountRequestForm } from "@/components/account-request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Connexion" };

export default function ConnectionPage() {
  return (
    <main id="contenu" className="site-container min-h-screen py-16">
      <h1 className="sr-only">Connexion à France Solidaire</h1>
      <Link href="/" className="text-sm font-semibold text-teal">
        ← Retour à l’accueil
      </Link>
      <Card className="mx-auto mt-8 max-w-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Accéder à mon espace</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Aucun mot de passe. Nous vous envoyons un lien personnel pour
            retrouver vos annonces et vos réponses.
          </p>
        </CardHeader>
        <CardContent>
          <AccountRequestForm />
        </CardContent>
      </Card>
    </main>
  );
}
