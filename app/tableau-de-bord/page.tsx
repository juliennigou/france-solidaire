import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardForProfile } from "@/lib/announcement-repository";
import { currentProfile } from "@/lib/auth";
import { ManagementActions } from "@/components/management-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace" };

export default async function DashboardPage() {
  const profile = await currentProfile();
  if (!profile) redirect("/connexion");
  const data = await dashboardForProfile(profile);

  return (
    <main id="contenu" className="site-container min-h-screen py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm font-semibold text-teal">
            ← Retour à l’accueil
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-ink">Mon espace</h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <Button variant="outline">Se déconnecter</Button>
        </form>
      </div>

      <section className="mt-10" aria-labelledby="dashboard-announcements">
        <h2 id="dashboard-announcements" className="text-2xl font-bold text-ink">
          Mes annonces ({data.announcements.length})
        </h2>
        <div className="mt-5 grid gap-5">
          {data.announcements.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="p-7 text-muted-foreground">
                Aucune annonce n’est associée à cette adresse email.
              </CardContent>
            </Card>
          ) : (
            data.announcements.map((announcement) => {
              const replies = data.responses.filter(
                (response) => response.announcementId === announcement.id,
              );
              return (
                <Card key={announcement.id} className="rounded-3xl">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{announcement.category}</Badge>
                      <Badge variant="outline">{announcement.status}</Badge>
                    </div>
                    <CardTitle className="text-xl">
                      {announcement.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ManagementActions
                      endpoint={`/api/announcements/${announcement.id}`}
                      status={announcement.status}
                    />
                    <div>
                      <h3 className="font-semibold">
                        Réponses reçues ({replies.length})
                      </h3>
                      <div className="mt-3 space-y-3">
                        {replies.map((response) => (
                          <article
                            key={response.id}
                            className="rounded-xl bg-cream/60 p-4"
                          >
                            <p className="font-medium">{response.firstName}</p>
                            <a
                              href={`mailto:${response.email}`}
                              className="text-sm text-teal underline"
                            >
                              {response.email}
                            </a>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                              {response.message}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
