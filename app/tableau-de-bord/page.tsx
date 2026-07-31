import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Inbox, MapPin } from "lucide-react";

import { dashboardForProfile } from "@/lib/announcement-repository";
import { currentProfile } from "@/lib/auth";
import { ManagementActions } from "@/components/management-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusTag } from "@/components/status-tag";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace" };

export default async function DashboardPage() {
  const profile = await currentProfile();
  if (!profile) redirect("/connexion");
  const data = await dashboardForProfile(profile);

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

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="section-title">Mon espace</h1>
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">
              Connecté avec <span className="font-semibold text-ink">{profile.email}</span>
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button
              variant="outline"
              className="h-11 border-2 border-blue-france px-4 font-semibold text-blue-france hover:bg-blue-france-975"
            >
              Se déconnecter
            </Button>
          </form>
        </div>

        <section className="mt-10" aria-labelledby="dashboard-announcements">
          <h2
            id="dashboard-announcements"
            className="text-xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Mes annonces ({data.announcements.length})
          </h2>

          {data.announcements.length === 0 ? (
            <div className="mt-5 border border-line bg-alt px-6 py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center bg-white text-blue-france">
                <Inbox className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-[0.9375rem] text-muted-foreground">
                Aucune annonce n’est associée à cette adresse email.
              </p>
              <Button
                render={<Link href="/#publier" />}
                className="mt-6 h-12 bg-blue-france px-5 font-semibold text-white no-underline hover:bg-blue-france-hover"
              >
                Publier une annonce
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid gap-5">
              {data.announcements.map((announcement) => {
                const replies = data.responses.filter(
                  (response) => response.announcementId === announcement.id,
                );
                return (
                  <article
                    key={announcement.id}
                    className="border border-line bg-white"
                  >
                    <div className="border-b border-line p-5 md:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag status={announcement.status} />
                        <span className="inline-flex items-center gap-1.5 bg-alt px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
                          {announcement.category}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-ink">
                        {announcement.title}
                      </h3>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[0.875rem] text-muted-foreground">
                        <MapPin className="size-4" aria-hidden="true" />
                        {announcement.commune}
                      </p>
                      <div className="mt-5">
                        <ManagementActions
                          endpoint={`/api/announcements/${announcement.id}`}
                          status={announcement.status}
                        />
                      </div>
                    </div>

                    <div className="p-5 md:p-6">
                      <h4 className="text-[0.9375rem] font-bold text-ink">
                        Réponses reçues ({replies.length})
                      </h4>
                      {replies.length === 0 ? (
                        <p className="mt-3 text-[0.9375rem] text-muted-foreground">
                          Aucune réponse pour le moment.
                        </p>
                      ) : (
                        <ul className="mt-4 grid gap-3">
                          {replies.map((response) => (
                            <li
                              key={response.id}
                              className="border-l-4 border-blue-france bg-alt p-4"
                            >
                              <p className="font-semibold text-ink">
                                {response.firstName}
                              </p>
                              <a
                                href={`mailto:${response.email}`}
                                className="text-link text-[0.875rem]"
                              >
                                {response.email}
                              </a>
                              <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-6 text-muted-foreground">
                                {response.message}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
