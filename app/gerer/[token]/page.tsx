import Link from "next/link";
import { notFound } from "next/navigation";
import { announcementForManagement } from "@/lib/announcement-repository";
import { hashToken } from "@/lib/security";
import { ManagementActions } from "@/components/management-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ token: string }> };

export default async function ManageAnnouncementPage({ params }: PageProps) {
  const { token } = await params;
  const data = await announcementForManagement(hashToken(token));
  if (!data) notFound();
  const { announcement, responses } = data;

  return (
    <main id="contenu" className="site-container min-h-screen py-12">
      <h1 className="sr-only">Gestion de l’annonce {announcement.title}</h1>
      <Link href="/" className="text-sm font-semibold text-teal">
        ← Retour aux annonces
      </Link>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{announcement.category}</Badge>
              <Badge variant="outline">{announcement.status}</Badge>
            </div>
            <CardTitle className="text-2xl">{announcement.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="leading-7 text-muted-foreground">
              {announcement.description}
            </p>
            <ManagementActions
              endpoint={`/api/manage/${token}`}
              status={announcement.status}
            />
          </CardContent>
        </Card>
        <section aria-labelledby="reponses-title">
          <h2 id="reponses-title" className="text-xl font-bold text-ink">
            Réponses reçues ({responses.length})
          </h2>
          <div className="mt-4 space-y-3">
            {responses.length === 0 ? (
              <p className="rounded-2xl bg-white p-5 text-muted-foreground">
                Aucune réponse pour le moment.
              </p>
            ) : (
              responses.map((response) => (
                <article
                  key={response.id}
                  className="rounded-2xl border border-ink/8 bg-white p-5"
                >
                  <h3 className="font-semibold text-ink">
                    {response.firstName}
                  </h3>
                  <a
                    className="text-sm text-teal underline"
                    href={`mailto:${response.email}`}
                  >
                    {response.email}
                  </a>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {response.message}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
